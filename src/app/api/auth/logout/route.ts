export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { extractToken, deleteSession } from '@/lib/auth'

export async function POST(request: Request) {
  const token = extractToken(request)
  if (token) await deleteSession(token).catch(() => null)

  const res = NextResponse.json({ success: true })
  res.cookies.set('auth-token', '', { maxAge: 0, path: '/' })
  return res
}
