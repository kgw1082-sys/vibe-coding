import { NextResponse } from 'next/server'
import axios from 'axios'
import anthropic from '@/lib/anthropic'
import type { LawSearchResult } from '@/types'
import { missingApiKey, rateLimited, isRateLimit } from '@/lib/api-error'

const STATIC_EXAMPLES: LawSearchResult[] = [
  {
    lawName:       'Internal Revenue Code',
    articleNumber: 'IRC § 911',
    content:       '해외 거주 미국 시민권자·영주권자의 외국 근로소득을 최대 $126,500(2024년)까지 제외하는 Foreign Earned Income Exclusion.',
    relevanceScore: 0.95,
    source:        'IRS',
    url:           'https://www.irs.gov/individuals/international-taxpayers/foreign-earned-income-exclusion',
  },
  {
    lawName:       'Bank Secrecy Act',
    articleNumber: '31 U.S.C. § 5314',
    content:       '해외 금융계좌 합계 $10,000 초과 시 FinCEN Form 114(FBAR) 연간 제출 의무.',
    relevanceScore: 0.88,
    source:        'FinCEN',
    url:           'https://bsaefiling.fincen.treas.gov/main.html',
  },
  {
    lawName:       'Foreign Account Tax Compliance Act (FATCA)',
    articleNumber: '26 U.S.C. § 1471–1474',
    content:       '해외 금융기관에 미국인 계좌 정보 보고를 의무화, 개인은 Form 8938 제출 필요.',
    relevanceScore: 0.82,
    source:        'IRS',
    url:           'https://www.irs.gov/businesses/corporations/foreign-account-tax-compliance-act-fatca',
  },
]

async function searchCongress(query: string): Promise<LawSearchResult[]> {
  const apiKey = process.env.CONGRESS_API_KEY
  if (!apiKey) return []
  try {
    const res = await axios.get('https://api.congress.gov/v3/bill', {
      params: { search: query, api_key: apiKey, limit: 5, format: 'json', sort: 'updateDate+desc' },
      timeout: 6000,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = res.data?.bills ?? []
    return items.map((item): LawSearchResult => ({
      lawName:       item.title ?? 'Unknown',
      articleNumber: item.number ? `${item.type} ${item.number} (${item.congress}th Congress)` : '',
      content:       item.latestAction?.text ?? item.title ?? '',
      relevanceScore: 0.75,
      source:        'Congress.gov',
      url:           item.url ?? '',
      updatedAt:     item.updateDate ?? '',
    }))
  } catch {
    return []
  }
}

function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/Â§/g, '§')   // Â§ → §  (double-encoded UTF-8)
    .replace(/Â/g, '')                // stray Â
    .replace(/â¦/g, '...') // â€¦ → …
    .replace(/…/g, '...')
    .trim()
}

async function searchEcfr(query: string): Promise<LawSearchResult[]> {
  try {
    const url = `https://www.ecfr.gov/api/search/v1/results?${new URLSearchParams({ query, per_page: '10' })}`
    const res  = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return []
    const text = await res.text()
    // Node.js undici may decode UTF-8 § (C2 A7) as two Latin-1 chars Â§ (U+00C2 U+00A7);
    // fix before JSON.parse so field values are clean.
    const fixedText = text.replace(/Â§/g, '§').replace(/Â/g, '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = JSON.parse(fixedText) as { results?: Array<{ hierarchy?: Record<string, string>; hierarchy_headings?: Record<string, string>; headings?: Record<string, string>; full_text_excerpt?: string; score?: number; starts_on?: string }> }
    const items = json?.results ?? []
    const seen = new Set<string>()
    const results: LawSearchResult[] = []
    for (const item of items) {
      const h  = item.hierarchy         ?? {}
      const hh = item.hierarchy_headings ?? {}
      const titleNum = h.title   ?? ''
      const part     = h.part    ?? ''
      const section  = h.section ?? ''
      if (seen.has(section)) continue
      seen.add(section)
      const url = section
        ? `https://www.ecfr.gov/current/title-${titleNum}/part-${part}/section-${section}`
        : part
        ? `https://www.ecfr.gov/current/title-${titleNum}/part-${part}`
        : 'https://www.ecfr.gov'
      results.push({
        lawName:       item.headings?.title ?? hh.title ?? 'CFR',
        articleNumber: cleanText(hh.section ?? (section ? `§ ${section}` : `Title ${titleNum} CFR`)),
        content:       cleanText(item.full_text_excerpt ?? item.headings?.section ?? ''),
        relevanceScore: item.score ? Math.min(1, item.score / 20) : 0.7,
        source:        'eCFR',
        url,
        updatedAt:     item.starts_on ?? '',
      })
      if (results.length >= 5) break
    }
    return results
  } catch {
    return []
  }
}

async function searchViaAI(query: string): Promise<LawSearchResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) return STATIC_EXAMPLES
  try {
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `다음 키워드와 관련된 미국 보험·세무 법령을 5개 알려줘. 반드시 아래 JSON 배열 형식으로만 응답 (코드블록 없이):
[
  {
    "lawName": "법령명 (영문)",
    "articleNumber": "조문번호 (예: IRC §911)",
    "content": "핵심 내용 요약 (한국어, 1-2문장)",
    "relevanceScore": 0.85,
    "source": "출처 (IRS / Congress.gov / State 등)",
    "url": "공식 URL 또는 빈 문자열",
    "updatedAt": ""
  }
]

키워드: ${query}`,
      }],
    })
    const raw   = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return STATIC_EXAMPLES
    return JSON.parse(match[0]) as LawSearchResult[]
  } catch {
    return STATIC_EXAMPLES
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()
  const scope = searchParams.get('scope') ?? 'all'

  if (!query) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 })
  }

  if (!process.env.CONGRESS_API_KEY) return missingApiKey('Congress API')

  try {
    let results: LawSearchResult[] = []

    if (scope !== 'state') {
      const [congress, ecfr] = await Promise.all([searchCongress(query), searchEcfr(query)])
      results = [...congress, ...ecfr]
    }

    if (results.length === 0) {
      results = await searchViaAI(query)
    }

    results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    return NextResponse.json({ results, query })
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[/api/legal/search]', err)
    return NextResponse.json(STATIC_EXAMPLES)
  }
}
