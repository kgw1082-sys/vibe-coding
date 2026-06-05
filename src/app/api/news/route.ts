export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { fetchNews } from '@/lib/newsapi'
import redis from '@/lib/redis'
import anthropic from '@/lib/anthropic'
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'
import type { NewsArticle, NewsResponse } from '@/types'

const CACHE_TTL = 3600

async function generateInsight(article: NewsArticle): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `다음 보험 관련 기사를 미국 파견 주재원 관점에서 한국어로 한 문장(30자 이내)으로 핵심 인사이트를 작성하라. 문장만 반환하라.\n\n제목: ${article.title}\n설명: ${article.description}`,
      }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  } catch {
    return ''
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag') || '전체'
    const cacheKey = `news:${createHash('md5').update(tag).digest('hex')}`

    const cached = await redis.get<NewsResponse>(cacheKey).catch(() => null)
    if (cached) return NextResponse.json(cached)

    if (!process.env.NEWSAPI_KEY) return missingApiKey('뉴스 API')

    const articles = await fetchNews([tag])
    const withInsights = await Promise.all(
      articles.map(async (a) => ({ ...a, insight: await generateInsight(a) }))
    )
    const result: NewsResponse = { articles: withInsights, cachedAt: new Date().toISOString() }
    await redis.set(cacheKey, result, { ex: CACHE_TTL }).catch(() => null)
    return NextResponse.json(result)
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[/api/news]', err)
    return internalError()
  }
}
