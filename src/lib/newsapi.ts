import { parseStringPromise } from 'xml2js'
import type { NewsArticle } from '@/types'

// ── 신뢰할 수 있는 보험 전문 RSS 피드 ──────────────────────────────────
const RSS_SOURCES = [
  { url: 'https://www.insurancejournal.com/feed/',            source: 'Insurance Journal' },
  { url: 'https://www.reinsurancene.ws/feed/',                source: 'Reinsurance News' },
  { url: 'https://www.carriermanagement.com/feed/',           source: 'Carrier Management' },
  { url: 'https://www.businessinsurance.com/rss/news.rss',   source: 'Business Insurance' },
  { url: 'https://www.insurancebusinessmag.com/rss/',        source: 'Insurance Business' },
  { url: 'https://news.google.com/rss/search?q=reinsurance+insurance+US&hl=en-US&gl=US&ceid=US:en', source: 'Google News' },
]

const TAG_MAP: Record<string, string[]> = {
  'P&C Insurance':    ['p&c', 'property', 'casualty', 'homeowner', 'auto insurance', 'liability'],
  'Reinsurance':      ['reinsurance', 'treaty', 'facultative', 'retrocession', 'cedent', 'cession'],
  'Life Insurance':   ['life insurance', 'annuity', 'whole life', 'term life'],
  'Healthcare':       ['health insurance', 'medicare', 'medicaid', 'aca', 'affordable care'],
  'Cyber':            ['cyber', 'ransomware', 'data breach', 'cybersecurity'],
  'CAT/Catastrophe':  ['catastrophe', 'hurricane', 'flood', 'earthquake', 'tornado', 'wildfire', 'nat cat'],
  'Regulation':       ['regulation', 'regulatory', 'naic', 'department of insurance', 'compliance'],
  "Lloyd's/London":   ["lloyd's", "lloyds", 'london market', 'london insurance'],
  'Legal':            ['lawsuit', 'litigation', 'court', 'verdict', 'settlement', 'ofac'],
  'Tax/IRS':          ['irs', 'tax', 'fbar', 'fatca', 'expat tax'],
}

export function extractTags(title: string, description = ''): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const found = new Set<string>()
  for (const [label, keywords] of Object.entries(TAG_MAP)) {
    if (keywords.some((k) => text.includes(k))) found.add(label)
  }
  return Array.from(found).slice(0, 4)
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&[a-z]+;/gi, ' ').trim()
}

function parseDate(dateStr: string): number {
  try { return new Date(dateStr).getTime() } catch { return 0 }
}

// ── 단일 RSS 피드 fetch ─────────────────────────────────────────────────
async function fetchSingleRss(source: { url: string; source: string }): Promise<NewsArticle[]> {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HanwhaGlobal/1.0)' },
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    })
    if (!res.ok) return []
    const text = await res.text()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const xml: any = await parseStringPromise(text, { explicitArray: false, trim: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = [].concat(
      xml?.rss?.channel?.item ?? xml?.feed?.entry ?? []
    )
    return items.slice(0, 15).map((item, i): NewsArticle => {
      const title = stripHtml(
        typeof item.title === 'object' ? item.title._ ?? item.title['#text'] ?? '' : item.title ?? ''
      )
      const description = stripHtml(
        typeof item.description === 'object' ? item.description._ ?? '' : item.description ?? item.summary ?? ''
      )
      const url = item.link?.$ ? item.link.$.href : (typeof item.link === 'string' ? item.link : item.guid ?? '')
      const pubDate = item.pubDate ?? item.published ?? item.updated ?? ''
      return {
        id:          `${source.source}-${i}-${parseDate(pubDate)}`,
        title,
        description,
        url,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        source:      source.source,
        tags:        extractTags(title, description),
      }
    }).filter((a) => a.title && a.url)
  } catch {
    return []
  }
}

// ── 전체 피드 병렬 수집 → 최신순 정렬 ────────────────────────────────────
export async function fetchNews(tagFilter?: string): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(RSS_SOURCES.map(fetchSingleRss))
  const all = results.flatMap((r) => r.status === 'fulfilled' ? r.value : [])

  // 중복 URL 제거
  const seen = new Set<string>()
  const unique = all.filter((a) => {
    if (!a.url || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  // 태그 필터링
  const filtered = tagFilter && tagFilter !== '전체'
    ? unique.filter((a) => a.tags.some((t) => t === tagFilter) || a.tags.length === 0)
    : unique

  // 최신순 정렬
  return filtered.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))
}
