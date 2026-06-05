export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { keys, getUser, saveUser, requireAdmin } from '@/lib/auth'
import { internalError } from '@/lib/api-error'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof Response) return authResult

  try {
    // id is email (URL-encoded)
    const email = decodeURIComponent(params.id)
    const user = await getUser(email)
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    await saveUser({ ...user, status: 'approved', approvedAt: new Date().toISOString() })

    const pending: string[] = (await redis.get<string[]>(keys.pending)) ?? []
    await redis.set(keys.pending, pending.filter((e) => e !== email))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[POST /api/admin/users/[id]/approve]', err)
    return internalError()
  }
}
