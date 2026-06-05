export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import redis from '@/lib/redis'
import { keys, getUser, requireAdmin } from '@/lib/auth'
import { internalError } from '@/lib/api-error'

export async function GET(request: Request) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof Response) return authResult

  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') ?? 'all'

    const list: string[] = (await redis.get<string[]>(keys.list)) ?? []
    const users = await Promise.all(list.map((email) => getUser(email)))
    const valid = users.filter(Boolean)

    const filtered = statusFilter === 'all'
      ? valid
      : valid.filter((u) => u!.status === statusFilter)

    const pub = filtered.map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...rest } = u!
      return rest
    })

    return NextResponse.json(pub)
  } catch (err) {
    console.error('[GET /api/admin/users]', err)
    return internalError()
  }
}
