import bcrypt from 'bcryptjs'
import redis from '@/lib/redis'
import { keys, saveUser } from '@/lib/auth'
import type { UserAccount } from '@/lib/auth'

let seeded = false

export async function seedAdminIfNeeded(): Promise<void> {
  if (seeded) return
  try {
    const existing = await redis.get(keys.user('admin@hanwha.com'))
    if (!existing) {
      const passwordHash = await bcrypt.hash('Admin@hanwha#1', 12)
      const admin: UserAccount = {
        id: 'admin',
        name: '관리자',
        department: '시스템관리',
        email: 'admin@hanwha.com',
        passwordHash,
        status: 'approved',
        role: 'admin',
        createdAt: new Date().toISOString(),
      }
      await saveUser(admin)
      // ensure list contains admin
      const list: string[] = (await redis.get<string[]>(keys.list)) ?? []
      if (!list.includes('admin@hanwha.com')) {
        await redis.set(keys.list, [...list, 'admin@hanwha.com'])
      }
    }
    seeded = true
  } catch (err) {
    console.error('[auth-seed]', err)
  }
}
