export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { resolveUser } from '@/lib/auth'
import { seedAdminIfNeeded } from '@/lib/auth-seed'

export async function GET(request: Request) {
  await seedAdminIfNeeded()
  const user = await resolveUser(request)
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  return NextResponse.json(user)
}
