import redis from '@/lib/redis'

export interface UserAccount {
  id: string
  name: string
  department: string
  email: string
  passwordHash: string
  status: 'pending' | 'approved' | 'rejected'
  role: 'user' | 'admin'
  createdAt: string
  approvedAt?: string
}

export type PublicUser = Omit<UserAccount, 'passwordHash'>

const SESSION_TTL = 60 * 60 * 24 // 24h in seconds

// ── Redis key helpers ───────────────────────────────────────────
export const keys = {
  user: (email: string) => `users:${email}`,
  list: 'users:list',
  pending: 'users:pending',
  session: (token: string) => `session:${token}`,
}

// ── User operations ─────────────────────────────────────────────
export async function getUser(email: string): Promise<UserAccount | null> {
  return redis.get<UserAccount>(keys.user(email))
}

export async function saveUser(user: UserAccount): Promise<void> {
  await redis.set(keys.user(user.email), user)
}

// ── Session operations ──────────────────────────────────────────
export async function createSession(email: string): Promise<string> {
  const token = crypto.randomUUID()
  await redis.set(keys.session(token), email, { ex: SESSION_TTL })
  return token
}

export async function getSession(token: string): Promise<string | null> {
  return redis.get<string>(keys.session(token))
}

export async function deleteSession(token: string): Promise<void> {
  await redis.del(keys.session(token))
}

// ── Request auth helpers ─────────────────────────────────────────
export function extractToken(request: Request): string | null {
  const auth = request.headers.get('Authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookie = request.headers.get('cookie')
  if (cookie) {
    const match = cookie.match(/auth-token=([^;]+)/)
    if (match) return match[1]
  }
  return null
}

export async function resolveUser(request: Request): Promise<PublicUser | null> {
  const token = extractToken(request)
  if (!token) return null
  const email = await getSession(token)
  if (!email) return null
  const user = await getUser(email)
  if (!user) return null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...pub } = user
  return pub
}

export async function requireAuth(request: Request): Promise<PublicUser | Response> {
  const user = await resolveUser(request)
  if (!user) {
    return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return user
}

export async function requireAdmin(request: Request): Promise<PublicUser | Response> {
  const result = await requireAuth(request)
  if (result instanceof Response) return result
  if (result.role !== 'admin') {
    return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return result
}
