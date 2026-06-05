export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getUser, createSession } from '@/lib/auth'
import { seedAdminIfNeeded } from '@/lib/auth-seed'
import { internalError } from '@/lib/api-error'

export async function POST(request: Request) {
  try {
    await seedAdminIfNeeded()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해 주세요.' }, { status: 400 })
    }

    const user = await getUser(email)
    if (!user) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        { error: '승인 대기 중입니다. 운영자 승인 후 이용 가능합니다.', status: 'pending' },
        { status: 401 },
      )
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        { error: '가입이 거절되었습니다. 운영자에게 문의하세요.', status: 'rejected' },
        { status: 401 },
      )
    }

    const token = await createSession(user.email)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...pub } = user

    const res = NextResponse.json({ token, user: pub })
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return res
  } catch (err) {
    console.error('[POST /api/auth/login]', err)
    return internalError()
  }
}
