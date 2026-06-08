export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { internalError } from '@/lib/api-error'

const CACHE_TTL = 3600
const BASE_URL = 'https://open.er-api.com/v6/latest'

interface RateCache {
  rates: Record<string, number>
  cachedAt: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const base = (searchParams.get('base') ?? 'USD').toUpperCase()
    const cacheKey = `exchange-rate:${base}`

    const cached = await redis.get<RateCache>(cacheKey).catch(() => null)
    if (cached) return NextResponse.json(cached)

    const res = await fetch(`${BASE_URL}/${base}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`)

    const data = await res.json()
    const result: RateCache = {
      rates: data.rates,
      cachedAt: new Date().toISOString(),
    }
    await redis.set(cacheKey, result, { ex: CACHE_TTL }).catch(() => null)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[GET /api/exchange-rate]', err)
    return internalError('환율 데이터를 불러오지 못했습니다.')
  }
}
