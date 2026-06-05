import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { internalError } from '@/lib/api-error'
import type { GlossaryEntry } from '@/lib/glossary-seed'

const REDIS_KEY = 'glossary:custom'

async function getCustomEntries(): Promise<GlossaryEntry[]> {
  try {
    const data = await redis.get<GlossaryEntry[]>(REDIS_KEY)
    return data ?? []
  } catch {
    return []
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { entry }: { entry: GlossaryEntry } = await request.json()
    const custom = await getCustomEntries()
    const exists = custom.find((e) => e.id === params.id)

    const updated: GlossaryEntry = { ...entry, id: params.id, isCustom: true, updatedAt: new Date().toISOString() }
    const next = exists
      ? custom.map((e) => (e.id === params.id ? updated : e))
      : [...custom, updated]

    await redis.set(REDIS_KEY, next)
    return NextResponse.json(updated)
  } catch (err) {
    console.error('[PUT /api/glossary/[id]]', err)
    return internalError()
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const custom = await getCustomEntries()
    const next = custom.filter((e) => e.id !== params.id)
    await redis.set(REDIS_KEY, next)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/glossary/[id]]', err)
    return internalError()
  }
}
