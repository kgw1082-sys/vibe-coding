'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [statusType, setStatusType] = useState<'pending' | 'rejected' | 'error'>('error')

  const handleSubmit = async () => {
    setStatusMsg(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatusMsg(data.error)
        setStatusType(data.status ?? 'error')
        return
      }
      localStorage.setItem('auth-token', data.token)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px] bg-bg-surface border-border-color">
        <CardHeader className="space-y-3 pb-4">
          <Image
            src="/images/hanwha-insurance-logo.jpg"
            width={160}
            height={40}
            alt="한화 생명보험"
            className="h-10 w-auto object-contain mx-auto"
          />
          <CardTitle className="text-lg font-bold text-text-primary text-center">
            임직원 로그인
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-primary">이메일</label>
            <Input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-primary">비밀번호</label>
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {statusMsg && (
            <div
              className={`text-sm px-4 py-3 rounded-lg border ${
                statusType === 'pending'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : statusType === 'rejected'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              {statusMsg}
            </div>
          )}

          <Button
            className="w-full bg-accent hover:bg-accent-hover text-white"
            disabled={!email || !password || loading}
            onClick={handleSubmit}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>

          <div className="text-center">
            <Link href="/register" className="text-xs text-accent hover:underline">
              가입 신청하기 →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
