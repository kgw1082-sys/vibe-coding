import axios from 'axios'
import { parseStringPromise } from 'xml2js'
import type { NewsArticle } from '@/types'

const NEWS_API_BASE = 'https://newsapi.org/v2'
const RSS_FALLBACK_URL = 'https://www.insurancejournal.com/feed/'

const TAG_MAP: Record<string, string> = {
  'p&c':        'P&C Insurance',
  property:     'P&C Insurance',
  casualty:     'P&C Insurance',
  reinsurance:  'Reinsurance',
  life:         'Life Insurance',
  health:       'Healthcare',
  medicare:     'Healthcare',
  medicaid:     'Healthcare',
  tax:          'Tax/IRS',
  irs:          'Tax/IRS',
  fbar:         'FBAR',
  fatca:        'FATCA',
  visa:         'Visa/Immigration',
  immigration:  'Visa/Immigration',
  legal:        'Legal',
  regulation:   'Regulation',
  lloyds:       'Lloyd\'s/London',
  catastrophe:  'CAT/Catastrophe',
  cyber:        'Cyber',
  workers:      'Workers\' Comp',
}

function extractTags(title: string, description = ''): string[] {
  const text = `${title} ${description}`.toLowerCase()
  const found = new Set<string>()
  for (const [key, label] of Object.entries(TAG_MAP)) {
    if (text.includes(key)) found.add(label)
  }
  return Array.from(found).slice(0, 4)
}

// ── NewsAPI ────────────────────────────────────────────────────────────
export async function fetchNews(
  tags: string[],
  sortBy: 'publishedAt' | 'relevancy' = 'publishedAt',
): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPI_KEY
  if (!apiKey) return fetchRss()

  // 태그를 NewsAPI q 쿼리로 변환
  const tagQueryMap: Record<string, string> = {
    'P&C Insurance':      'P&C insurance OR property casualty insurance',
    'Reinsurance':        'reinsurance',
    'Life Insurance':     'life insurance expatriate',
    'Healthcare':         'US health insurance expat',
    'Tax/IRS':            'US expat tax IRS FBAR',
    'FBAR':               'FBAR foreign bank account',
    'FATCA':              'FATCA foreign account',
    'Visa/Immigration':   'US visa immigration',
    'Legal':              'US insurance regulation legal',
    'Regulation':         'insurance regulation US',
    "Lloyd's/London":     "Lloyd's London insurance",
    'CAT/Catastrophe':    'catastrophe insurance hurricane flood',
    'Cyber':              'cyber insurance breach',
    "Workers' Comp":      "workers compensation insurance",
  }

  const effectiveTags = tags.filter((t) => t !== '전체')
  const q =
    effectiveTags.length > 0
      ? effectiveTags.map((t) => tagQueryMap[t] ?? t).join(' OR ')
      : 'US expat insurance OR reinsurance OR P&C insurance OR health insurance OR IRS expatriate'

  try {
    const res = await axios.get(`${NEWS_API_BASE}/everything`, {
      params: { q, language: 'en', sortBy, pageSize: 20, apiKey },
      timeout: 8000,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.articles.map((a: any, i: number): NewsArticle => ({
      id:          `newsapi-${i}-${Date.now()}`,
      title:       a.title ?? '',
      description: a.description ?? '',
      url:         a.url ?? '',
      publishedAt: a.publishedAt ?? '',
      source:      a.source?.name ?? 'Unknown',
      tags:        extractTags(a.title ?? '', a.description ?? ''),
    }))
  } catch {
    return fetchRss()
  }
}

// ── Insurance Journal RSS 폴백 ─────────────────────────────────────────
async function fetchRss(): Promise<NewsArticle[]> {
  const res  = await axios.get(RSS_FALLBACK_URL, { timeout: 8000, responseType: 'text' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const xml: any = await parseStringPromise(res.data, { explicitArray: false })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = [].concat(xml?.rss?.channel?.item ?? [])
  return items.slice(0, 20).map((item, i): NewsArticle => ({
    id:          `rss-${i}-${Date.now()}`,
    title:       item.title ?? '',
    description: stripHtml(item.description ?? ''),
    url:         item.link ?? '',
    publishedAt: item.pubDate ?? '',
    source:      'Insurance Journal',
    tags:        extractTags(item.title ?? '', item.description ?? ''),
  }))
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').trim()
}
