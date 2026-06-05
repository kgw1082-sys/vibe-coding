'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function checkPassword(pw: string) {
  return {
    minLength: pw.length >= 8,
    hasUppercase: /[A-Z]/.test(pw),
    hasSpecialChars: (pw.match(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g) ?? []).length >= 2,
  }
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const checks = checkPassword(password)
  const allChecksPass = checks.minLength && checks.hasUppercase && checks.hasSpecialChars
  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword

  const emailValid = email.endsWith('@hanwha.com')
  const emailInvalid = email.includes('@') && !email.endsWith('@hanwha.com')

  const isDisabled =
    !name || !department || !email || !password || !confirmPassword ||
    !allChecksPass || passwordMismatch || loading || !emailValid

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error)
        return
      }
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <Card className="w-full max-w-[440px] bg-bg-surface border-border-color">
        <CardHeader className="space-y-3 pb-4">
          <Image
            src="/images/hanwha-insurance-logo.jpg"
            width={160}
            height={40}
            alt="한화 생명보험"
            className="h-10 w-auto object-contain mx-auto"
          />
          <CardTitle className="text-lg font-bold text-text-primary text-center">
            임직원 전용 가입 신청
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl">✅</div>
              <p className="font-semibold text-text-primary">가입 신청이 완료되었습니다.</p>
              <p className="text-sm text-text-secondary">운영자 승인 후 로그인이 가능합니다.</p>
              <p className="text-sm text-text-muted">승인 여부는 로그인 시 확인하실 수 있습니다.</p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">이름</label>
                <Input
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">부서</label>
                <Input
                  placeholder="국제사업팀"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">임직원 이메일</label>
                <Input
                  type="email"
                  placeholder="gildong.hong@hanwha.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {emailInvalid && (
                  <p className="text-xs text-red-500">한화 임직원 이메일만 가입 가능합니다</p>
                )}
                {emailValid && (
                  <p className="text-xs text-emerald-600">✓ 올바른 이메일 형식</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">비밀번호</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="space-y-1 mt-2">
                  {[
                    { key: 'minLength' as const, label: '8자리 이상' },
                    { key: 'hasUppercase' as const, label: '영문 대문자 1개 이상' },
                    { key: 'hasSpecialChars' as const, label: '특수문자 2개 이상' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs">
                      <span>{checks[key] ? '✅' : '❌'}</span>
                      <span className={checks[key] ? 'text-emerald-600' : 'text-text-disabled'}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-text-primary">비밀번호 확인</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordMismatch && (
                  <p className="text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
                )}
              </div>

              <Button
                className="w-full bg-accent hover:bg-accent-hover text-white"
                disabled={isDisabled}
                onClick={handleSubmit}
              >
                {loading ? '신청 중...' : '가입 신청'}
              </Button>
            </>
          )}

          <div className="text-center">
            <Link href="/login" className="text-xs text-accent hover:underline">
              로그인으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
