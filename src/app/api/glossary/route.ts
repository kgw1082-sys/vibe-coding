export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { GLOSSARY_SEED } from '@/lib/glossary-seed'
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.toLowerCase() ?? ''
    const autocomplete = searchParams.get('autocomplete') === 'true'

    const custom = await getCustomEntries()
    const all = [
      ...GLOSSARY_SEED,
      ...custom.filter((c) => !GLOSSARY_SEED.find((s) => s.id === c.id)),
    ]

    const filtered = q
      ? all.filter(
          (e) =>
            e.term.toLowerCase().includes(q) ||
            e.koreanName.includes(q) ||
            e.definition.includes(q),
        )
      : all

    if (autocomplete) {
      return NextResponse.json(filtered.map((e) => ({ id: e.id, term: e.term, koreanName: e.koreanName })))
    }

    return NextResponse.json(filtered)
  } catch (err) {
    console.error('[GET /api/glossary]', err)
    return internalError()
  }
}

export async function POST(request: Request) {
  try {
    const { entry }: { entry: GlossaryEntry } = await request.json()
    if (!entry?.id || !entry?.term) {
      return NextResponse.json({ error: '유효하지 않은 데이터입니다.' }, { status: 400 })
    }

    const custom = await getCustomEntries()
    const next = [...custom.filter((e) => e.id !== entry.id), { ...entry, isCustom: true }]
    await redis.set(REDIS_KEY, next)

    return NextResponse.json(entry)
  } catch (err) {
    console.error('[POST /api/glossary]', err)
    return internalError()
  }
}
