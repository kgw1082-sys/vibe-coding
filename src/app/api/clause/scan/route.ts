import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { CLAUSE_KEYWORDS } from '@/lib/clause-keywords'
import type { FlagItem, MissingItem, ClauseScanResult } from '@/types'
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'

const MISSING_DESCRIPTIONS: Record<string, string> = {
  Deductible:           '자기부담금 조항이 명시되지 않았습니다',
  Jurisdiction:         '관할권 / 준거법 조항이 누락되었습니다',
  'Notice of Loss':     '손해통지 기간 조항이 없습니다',
  'Policy Period':      '보험기간 명시가 불분명합니다',
  'Insured Name':       '피보험자 명칭 특정이 누락되었습니다',
  'Named Insured':      '기명피보험자 조항이 없습니다',
  Sublimit:             '세부 보상 한도 조항 검토 필요',
  Coinsurance:          '공동보험 조항 여부 확인 필요',
  Exclusion:            '면책 조항 목록이 불완전할 수 있습니다',
  'Condition Precedent':'선행조건 조항 누락 여부 확인 필요',
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function scanKeywords(
  text: string,
  keywords: string[],
  level: 'RED' | 'ORANGE',
): FlagItem[] {
  const flags: FlagItem[] = []
  const seen = new Set<string>()

  for (const keyword of keywords) {
    const re = new RegExp(escapeRegex(keyword), 'gi')
    const firstMatch = re.exec(text)
    if (!firstMatch) continue

    const lower = firstMatch[0].toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)

    // Count all occurrences for context
    re.lastIndex = 0
    let count = 0
    while (re.exec(text) !== null) count++

    const start = Math.max(0, firstMatch.index - 90)
    const end   = Math.min(text.length, firstMatch.index + keyword.length + 90)
    flags.push({
      keyword:  firstMatch[0],
      level,
      context:  text.slice(start, end).trim() + (count > 1 ? ` (총 ${count}회 등장)` : ''),
      position: firstMatch.index,
    })
  }
  return flags
}

interface AiFlag {
  keyword: string
  level: 'red' | 'orange'
  context: string
  guidance: string
}

export async function POST(request: Request) {
  try {
  const body = await request.json()
  const { text: inputText, fileBase64, fileName } = body as {
    text?: string
    fileBase64?: string
    fileName?: string
  }

  let text = (inputText ?? '').trim()

  // ── 파일 파싱 ──────────────────────────────────────────────
  if (fileBase64 && fileName) {
    const buffer = Buffer.from(fileBase64, 'base64')
    try {
      if (fileName.toLowerCase().endsWith('.pdf')) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (b: Buffer) => Promise<{ text: string }>
        const parsed   = await pdfParse(buffer)
        text = parsed.text
      } else if (fileName.toLowerCase().endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const parsed  = await mammoth.extractRawText({ buffer })
        text = parsed.value
      }
    } catch {
      return NextResponse.json({ error: '파일 파싱 실패. 텍스트를 직접 입력해주세요.' }, { status: 422 })
    }
  }

  if (!text) {
    return NextResponse.json({ error: '분석할 텍스트가 없습니다.' }, { status: 400 })
  }

  // ── 룰 기반 스캔 ───────────────────────────────────────────
  const redFlags    = scanKeywords(text, CLAUSE_KEYWORDS.RED,    'RED')
  const orangeFlags = scanKeywords(text, CLAUSE_KEYWORDS.ORANGE, 'ORANGE')
  const flags       = [...redFlags, ...orangeFlags]

  const missingItems: MissingItem[] = CLAUSE_KEYWORDS.ORANGE
    .filter((kw) => !new RegExp(escapeRegex(kw), 'i').test(text))
    .map((kw) => ({ keyword: kw, description: MISSING_DESCRIPTIONS[kw] ?? `${kw} 조항 누락 확인 필요` }))

  const redCount    = redFlags.length
  const orangeCount = orangeFlags.length
  const score       = Math.min(100, redCount * 25 + orangeCount * 10)
  const level: 'HIGH' | 'MEDIUM' | 'LOW' = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW'

  // ── 룰 기반 fallback 메시지 ────────────────────────────────
  const ruleBasedSummary = `총 ${redCount}건의 RED 고위험 조항과 ${orangeCount}건의 ORANGE 검토 조항, ${missingItems.length}건의 누락 항목이 발견되었습니다.`
  const ruleBasedRec =
    level === 'HIGH'   ? '즉시 재검토 필요: 절대 면책(Absolute Exclusion) 관련 고위험 조항이 다수 포함되어 있습니다. 인수 전 법무 및 리스크 부서와 협의를 권고합니다.' :
    level === 'MEDIUM' ? '조건부 인수 가능: 주요 조항 수정 또는 보완 후 인수 검토를 권고합니다.' :
                         '인수 가능: 표준 절차에 따라 인수를 진행할 수 있습니다.'

  let aiSummary      = ruleBasedSummary
  let recommendation = ruleBasedRec
  let aiFlags: AiFlag[] = []

  // ── API 키 미설정 시 mock 응답 ────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 분석')

  // ── Claude AI 분석 ─────────────────────────────────────────
  try {
    const flagSummary = {
      red:    redFlags.map((f) => ({ keyword: f.keyword, context: f.context })),
      orange: orangeFlags.map((f) => ({ keyword: f.keyword, context: f.context })),
      missing: missingItems.map((m) => m.keyword),
    }

    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
      system:     '당신은 보험 언더라이터 전문가입니다. 영문 특약 텍스트를 분석하여 인수 관점의 위험 요소를 파악하십시오.',
      messages: [{
        role:    'user',
        content: `아래 룰 기반 스캔 결과와 원문 텍스트를 분석하여 인수 위험도를 평가하십시오.

[룰 기반 스캔 결과]
${JSON.stringify(flagSummary, null, 2)}

[원문 텍스트]
${text}

반드시 아래 JSON 형식으로만 응답하십시오 (코드블록·부가 텍스트 없이 순수 JSON):
{
  "aiFlags": [
    { "keyword": "string", "level": "red|orange", "context": "원문 관련 문맥", "guidance": "언더라이팅 가이던스 (한국어, 1-2문장)" }
  ],
  "summary": "분석 요약 (한국어, 2-3문장)",
  "recommendation": "인수 권고사항 (한국어, 1-2문장)"
}`,
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed: { aiFlags?: AiFlag[]; summary?: string; recommendation?: string } =
        JSON.parse(jsonMatch[0])
      aiSummary      = parsed.summary      || ruleBasedSummary
      recommendation = parsed.recommendation || ruleBasedRec
      aiFlags        = parsed.aiFlags       || []
    }
  } catch {
    // AI 미연결 시 rule-based 결과만 반환
  }

  // ── 룰 기반 + AI guidance 병합 ─────────────────────────────
  const mergedFlags: FlagItem[] = flags.map((flag) => {
    const match = aiFlags.find(
      (af) => af.keyword.toLowerCase() === flag.keyword.toLowerCase(),
    )
    return match ? { ...flag, guidance: match.guidance } : flag
  })

  const result: ClauseScanResult = {
    originalText: text,
    flags: mergedFlags,
    missingItems,
    score,
    level,
    aiSummary,
    recommendation,
  }

  return NextResponse.json(result)
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[/api/clause/scan]', err)
    return internalError()
  }
}
