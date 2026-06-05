import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { fetchNews } from '@/lib/newsapi'
import redis from '@/lib/redis'
import anthropic from '@/lib/anthropic'
import type { NewsArticle, NewsResponse } from '@/types'

const CACHE_TTL = 3600 // 1시간

// Claude로 한줄 인사이트 생성
async function generateInsight(article: NewsArticle): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `다음 보험 관련 기사를 미국 파견 주재원 관점에서 한국어로 한 문장(30자 이내)으로 핵심 인사이트를 작성하라. 문장만 반환하라.

제목: ${article.title}
설명: ${article.description}`,
      }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  } catch {
    return ''
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tagsParam = searchParams.get('tags') ?? '전체'
  const sortBy    = (searchParams.get('sortBy') ?? 'publishedAt') as 'publishedAt' | 'relevancy'

  const tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean)

  // 캐시 키: tags + sortBy 해시
  const hashInput = `${tags.sort().join(',')}:${sortBy}`
  const cacheKey  = `news:${createHash('md5').update(hashInput).digest('hex')}`

  // Redis 캐시 확인
  try {
    const cached = await redis.get<NewsResponse>(cacheKey)
    if (cached) {
      return NextResponse.json({ ...cached, fromCache: true })
    }
  } catch {
    // Redis 없으면 패스
  }

  // NewsAPI 또는 RSS 페칭
  let articles: NewsArticle[]
  try {
    articles = await fetchNews(tags, sortBy)
  } catch {
    return NextResponse.json({ error: '뉴스를 불러오는 데 실패했습니다.' }, { status: 502 })
  }

  // Claude 인사이트 병렬 생성 (최대 10개 기사)
  const subset = articles.slice(0, 10)
  const insights = await Promise.all(subset.map(generateInsight))
  const enriched: NewsArticle[] = articles.map((a, i) => ({
    ...a,
    insight: insights[i] ?? '',
  }))

  const result: NewsResponse = {
    articles: enriched,
    cachedAt: new Date().toISOString(),
  }

  // Redis 캐싱
  try {
    await redis.set(cacheKey, result, { ex: CACHE_TTL })
  } catch {
    // 캐싱 실패는 무시
  }

  return NextResponse.json(result)
}
