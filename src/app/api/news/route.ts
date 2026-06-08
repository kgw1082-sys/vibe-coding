export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { fetchNews } from '@/lib/newsapi'
import redis from '@/lib/redis'
import anthropic from '@/lib/anthropic'
import { internalError } from '@/lib/api-error'
import type { NewsArticle } from '@/types'

const CACHE_TTL = 1800

async function generateInsight(article: NewsArticle): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `다음 보험 관련 기사를 한화손보 글로벌 주재원 관점에서 한국어로 한 문장(30자 이내)으로 핵심 인사이트를 작성하라. 문장만 반환하라.\n\n제목: ${article.title}\n설명: ${article.description}`,
      }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  } catch {
    return ''
  }
}

async function addInsights(articles: NewsArticle[], limit = 15): Promise<NewsArticle[]> {
  const top = articles.slice(0, limit)
  const rest = articles.slice(limit)
  const withInsights = await Promise.all(
    top.map(async (a) => ({ ...a, insight: await generateInsight(a) }))
  )
  return [...withInsights, ...rest]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag') || '전체'
    const country = searchParams.get('country') || undefined
    const cacheKey = `news:v3:${createHash('md5').update(`${tag}:${country ?? ''}`).digest('hex')}`

    const cached = await redis.get<{ international: NewsArticle[]; domestic: NewsArticle[]; cachedAt: string }>(cacheKey).catch(() => null)
    if (cached) return NextResponse.json(cached)

    const { international, domestic } = await fetchNews(tag === '전체' ? undefined : tag, country)

    const [intlWithInsights, domWithInsights] = await Promise.all([
      addInsights(international, 15),
      addInsights(domestic, 5),
    ])

    const result = {
      international: intlWithInsights,
      domestic: domWithInsights,
      // legacy field for backward compat (dashboard uses .articles)
      articles: intlWithInsights,
      cachedAt: new Date().toISOString(),
    }
    await redis.set(cacheKey, result, { ex: CACHE_TTL }).catch(() => null)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/news]', err)
    return internalError()
  }
}
