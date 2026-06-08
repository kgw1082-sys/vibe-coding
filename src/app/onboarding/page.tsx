'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { COUNTRIES, type CountryCode } from '@/lib/user-settings'

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<CountryCode | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const done = localStorage.getItem('onboarding-done')
    if (done) {
      router.push('/')
      return
    }
    const storedToken = localStorage.getItem('auth-token')
    fetch('/api/settings', {
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.countryCode) {
          router.push('/')
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  const handleSubmit = async () => {
    if (!selected) return
    setLoading(true)
    const storedToken = localStorage.getItem('auth-token')
    await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
      },
      body: JSON.stringify({ countryCode: selected }),
    })
    localStorage.setItem('onboarding-done', '1')
    router.push('/')
  }

  if (checking) return null

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-bg-surface border-border-color">
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4 text-center">
            <Image
              src="/images/hanwha-insurance-logo.jpg"
              width={160}
              height={40}
              className="h-10 w-auto object-contain mx-auto"
              alt="한화손보 로고"
            />
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-text-primary">파견 국가를 선택해 주세요</h1>
              <p className="text-sm text-text-muted">
                선택한 국가에 맞는 뉴스, 법령, 환율 정보를 제공합니다
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setSelected(c.code as CountryCode)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selected === c.code
                    ? 'border-accent bg-accent/10'
                    : 'border-border-color bg-bg-card hover:border-accent/40'
                }`}
              >
                <span className="text-3xl">{c.flag}</span>
                <span className="text-sm font-medium text-text-primary">{c.name}</span>
                <span className="text-[11px] text-text-muted">{c.currency}</span>
              </button>
            ))}
          </div>

          <Button
            disabled={!selected || loading}
            onClick={handleSubmit}
            className="w-full bg-accent hover:bg-accent/90 text-white"
          >
            {loading ? '저장 중...' : '시작하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
