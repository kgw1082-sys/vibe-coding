import { parseStringPromise } from 'xml2js'
import type { NewsArticle } from '@/types'

// ── 신뢰할 수 있는 보험 전문 RSS 피드 ──────────────────────────────────
const RSS_SOURCES_BASE = [
  { url: 'https://www.insurancejournal.com/feed/',          source: 'Insurance Journal',  lang: 'en' },
  { url: 'https://www.reinsurancene.ws/feed/',              source: 'Reinsurance News',   lang: 'en' },
  { url: 'https://www.carriermanagement.com/feed/',         source: 'Carrier Management', lang: 'en' },
  { url: 'https://www.businessinsurance.com/rss/news.rss', source: 'Business Insurance', lang: 'en' },
  { url: 'https://www.insurancebusinessmag.com/rss/',      source: 'Insurance Business', lang: 'en' },
  // 국내 보험 뉴스 RSS
  { url: 'https://news.google.com/rss/search?q=손해보험+재보험+보험업&hl=ko&gl=KR&ceid=KR:ko', source: '국내 보험뉴스', lang: 'ko' },
  { url: 'https://news.google.com/rss/search?q=한화손해보험+삼성화재+DB손해보험&hl=ko&gl=KR&ceid=KR:ko', source: '국내 보험사', lang: 'ko' },
]

// 국가별 Google News 쿼리
const COUNTRY_RSS: Record<string, { url: string; source: string; lang: string }> = {
  US: { url: 'https://news.google.com/rss/search?q=US+insurance+reinsurance&hl=en-US&gl=US&ceid=US:en', source: 'Google News US', lang: 'en' },
  GB: { url: 'https://news.google.com/rss/search?q=UK+insurance+reinsurance+Lloyd%27s&hl=en-GB&gl=GB&ceid=GB:en', source: 'Google News UK', lang: 'en' },
  DE: { url: 'https://news.google.com/rss/search?q=Germany+insurance+Munich+Re+Allianz&hl=de&gl=DE&ceid=DE:de', source: 'Google News DE', lang: 'de' },
  SG: { url: 'https://news.google.com/rss/search?q=Singapore+insurance+reinsurance&hl=en-SG&gl=SG&ceid=SG:en', source: 'Google News SG', lang: 'en' },
  JP: { url: 'https://news.google.com/rss/search?q=Japan+insurance+再保険&hl=ja&gl=JP&ceid=JP:ja', source: 'Google News JP', lang: 'ja' },
  CN: { url: 'https://news.google.com/rss/search?q=China+insurance+reinsurance+PICC&hl=zh-CN&gl=CN&ceid=CN:zh-Hans', source: 'Google News CN', lang: 'zh' },
  AE: { url: 'https://news.google.com/rss/search?q=UAE+insurance+reinsurance+Dubai&hl=en&gl=AE&ceid=AE:en', source: 'Google News UAE', lang: 'en' },
  FR: { url: 'https://news.google.com/rss/search?q=France+insurance+reinsurance+AXA+SCOR&hl=fr&gl=FR&ceid=FR:fr', source: 'Google News FR', lang: 'fr' },
}

function getRssSources(countryCode?: string) {
  const sources = [...RSS_SOURCES_BASE]
  if (countryCode && COUNTRY_RSS[countryCode]) {
    sources.push(COUNTRY_RSS[countryCode])
  } else {
    sources.push({ url: 'https://news.google.com/rss/search?q=reinsurance+insurance+US&hl=en-US&gl=US&ceid=US:en', source: 'Google News', lang: 'en' })
  }
  return sources
}

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

// ── 전체 피드 병렬 수집 → 국내/해외 분리 후 최신순 정렬 ──────────────────
export async function fetchNews(tagFilter?: string, countryCode?: string): Promise<{
  international: NewsArticle[]
  domestic: NewsArticle[]
}> {
  const sources = getRssSources(countryCode)
  const results = await Promise.allSettled(sources.map(fetchSingleRss))
  const all = results.flatMap((r) => r.status === 'fulfilled' ? r.value : [])

  // 중복 URL 제거
  const seen = new Set<string>()
  const unique = all.filter((a) => {
    if (!a.url || seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  // 커스텀 태그 검색 (태그명을 직접 검색어로 사용)
  const filtered = tagFilter && tagFilter !== '전체'
    ? unique.filter((a) => {
        const text = `${a.title} ${a.description}`.toLowerCase()
        const tag = tagFilter.toLowerCase()
        return a.tags.some((t) => t === tagFilter) || text.includes(tag)
      })
    : unique

  const sorted = filtered.sort((a, b) => parseDate(b.publishedAt) - parseDate(a.publishedAt))

  // 국내/해외 분리 (source가 '국내' 포함하거나 한글이 포함된 기사)
  const domestic = sorted.filter((a) =>
    a.source.includes('국내') || /[가-힣]/.test(a.title)
  )
  const international = sorted.filter((a) =>
    !a.source.includes('국내') && !/[가-힣]/.test(a.title)
  )

  return { international, domestic }
}
