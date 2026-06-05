export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import redis from '@/lib/redis'
import { keys, getUser, saveUser } from '@/lib/auth'
import { validatePassword } from '@/lib/password-validator'
import { internalError } from '@/lib/api-error'
import type { UserAccount } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { name, department, email, password } = await request.json()

    if (!email?.endsWith('@hanwha.com')) {
      return NextResponse.json(
        { error: '한화 임직원 이메일(@hanwha.com)만 가입 가능합니다.' },
        { status: 400 },
      )
    }

    if (!name?.trim() || !department?.trim()) {
      return NextResponse.json({ error: '이름과 부서를 입력해 주세요.' }, { status: 400 })
    }

    const existing = await getUser(email)
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 })
    }

    const validation = validatePassword(password ?? '')
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user: UserAccount = {
      id: crypto.randomUUID(),
      name: name.trim(),
      department: department.trim(),
      email,
      passwordHash,
      status: 'pending',
      role: 'user',
      createdAt: new Date().toISOString(),
    }

    await saveUser(user)

    const list: string[] = (await redis.get<string[]>(keys.list)) ?? []
    await redis.set(keys.list, [...list, email])

    const pending: string[] = (await redis.get<string[]>(keys.pending)) ?? []
    await redis.set(keys.pending, [...pending, email])

    return NextResponse.json({
      success: true,
      message: '가입 신청이 완료되었습니다. 운영자 승인 후 로그인 가능합니다.',
    })
  } catch (err) {
    console.error('[POST /api/auth/register]', err)
    return internalError()
  }
}
