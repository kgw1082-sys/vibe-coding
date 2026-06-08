export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { requireAuth } from '@/lib/auth'
import { internalError } from '@/lib/api-error'
import type { UserSettings } from '@/lib/user-settings'

function settingsKey(email: string) {
  return `settings:${email}`
}

export async function GET(request: Request) {
  const result = await requireAuth(request)
  if (result instanceof Response) return result

  try {
    const data = await redis.get<UserSettings>(settingsKey(result.email)).catch(() => null)
    return NextResponse.json(data ?? {})
  } catch (err) {
    console.error('[GET /api/settings]', err)
    return internalError()
  }
}

export async function PUT(request: Request) {
  const result = await requireAuth(request)
  if (result instanceof Response) return result

  try {
    const body: Partial<UserSettings> = await request.json()
    const existing = await redis.get<UserSettings>(settingsKey(result.email)).catch(() => null) ?? {}
    const merged = { ...existing, ...body }
    await redis.set(settingsKey(result.email), merged)
    return NextResponse.json(merged)
  } catch (err) {
    console.error('[PUT /api/settings]', err)
    return internalError()
  }
}
