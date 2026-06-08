'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tag, AlertTriangle, Bell, X, Plus, Globe } from 'lucide-react'
import { NEWS_TAGS } from '@/lib/mock-data'
import { RED_FLAG_KEYWORDS, ORANGE_FLAG_KEYWORDS } from '@/lib/clause-keywords'
import { loadSettings, saveSettings, COUNTRIES } from '@/lib/user-settings'
import type { UserSettings, KeywordEntry, CountryCode } from '@/lib/user-settings'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [newKeywordLevel, setNewKeywordLevel] = useState<'red' | 'orange'>('red')
  const [newKeywordDesc, setNewKeywordDesc] = useState('')
  const [currentCountry, setCurrentCountry] = useState<CountryCode | null>(null)
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [savingCountry, setSavingCountry] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('auth-token')
    fetch('/api/settings', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.countryCode) setCurrentCountry(data.countryCode) })
      .catch(() => null)
  }, [])

  const persist = useCallback((next: UserSettings) => {
    setSettings(next)
    try {
      saveSettings(next)
      toast.success('설정이 저장되었습니다')
    } catch {
      toast.error('설정 저장에 실패했습니다')
    }
  }, [])

  const toggleTag = (tag: string) => {
    if (!settings) return
    const newsTags = settings.newsTags.includes(tag)
      ? settings.newsTags.filter((t) => t !== tag)
      : [...settings.newsTags, tag]
    persist({ ...settings, newsTags })
  }

  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    if (!settings) return
    persist({
      ...settings,
      notifications: { ...settings.notifications, [key]: !settings.notifications[key] },
    })
  }

  const addKeyword = () => {
    if (!settings || !newKeyword.trim()) return
    const entry: KeywordEntry = {
      keyword: newKeyword.trim(),
      level: newKeywordLevel,
      description: newKeywordDesc.trim(),
    }
    persist({ ...settings, customKeywords: [...settings.customKeywords, entry] })
    setNewKeyword('')
    setNewKeywordDesc('')
  }

  const removeKeyword = (index: number) => {
    if (!settings) return
    const customKeywords = settings.customKeywords.filter((_, i) => i !== index)
    persist({ ...settings, customKeywords })
  }

  const saveCountry = async (code: CountryCode) => {
    setSavingCountry(true)
    try {
      const token = localStorage.getItem('auth-token')
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ countryCode: code }),
      })
      if (res.ok) {
        setCurrentCountry(code)
        setShowCountryModal(false)
        toast.success('국가 설정이 변경되었습니다.')
      } else {
        toast.error('저장에 실패했습니다.')
      }
    } finally {
      setSavingCountry(false)
    }
  }

  if (!settings) return null

  return (
    <>
      <Topbar title="설정" description="Hanwha Global Insurance Intelligence 환경 설정" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl">

        {/* 파견 국가 설정 */}
        <Card className="bg-bg-card border-border-color">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <Globe size={14} className="text-accent" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-semibold text-white">파견 국가 설정</CardTitle>
              <p className="text-xs text-text-muted">뉴스, 법령, 환율 기준 국가</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowCountryModal(true)}
              className="h-7 text-xs border-border-color text-text-secondary hover:text-text-primary">
              변경
            </Button>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent>
            {currentCountry ? (() => {
              const c = COUNTRIES.find(x => x.code === currentCountry)
              return c ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                    <p className="text-xs text-text-muted">{c.currency}</p>
                  </div>
                </div>
              ) : null
            })() : (
              <p className="text-sm text-text-disabled">국가가 설정되지 않았습니다</p>
            )}
          </CardContent>
        </Card>

        {/* 뉴스 관심 태그 */}
        <Card className="bg-bg-card border-border-color">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <Tag size={14} className="text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-text-primary">뉴스 관심 태그</CardTitle>
              <p className="text-xs text-text-secondary">선택한 태그의 뉴스만 피드에 표시됩니다</p>
            </div>
          </CardHeader>
          <Separator className="bg-border-color mb-3" />
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {NEWS_TAGS.filter((t) => t !== '전체').map((tag) => {
                const active = settings.newsTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-black/[0.04] text-text-secondary border-border-color hover:border-border-color'
                    }`}
                  >
                    {tag}
                    {active && <X size={10} />}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-text-disabled">{settings.newsTags.length}개 태그 선택됨</p>
          </CardContent>
        </Card>

        {/* Red Flag 키워드 사전 */}
        <Card className="bg-bg-card border-border-color">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-risk-red/15 flex items-center justify-center">
              <AlertTriangle size={14} className="text-risk-red" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-text-primary">Red Flag 키워드 사전</CardTitle>
              <p className="text-xs text-text-secondary">Clause Finder 스크리닝에 사용되는 키워드 목록</p>
            </div>
          </CardHeader>
          <Separator className="bg-border-color mb-3" />
          <CardContent className="space-y-4">
            {/* 기본 키워드 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-risk-red flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-red inline-block" />
                RED — 기본 키워드
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RED_FLAG_KEYWORDS.map((kw) => (
                  <Badge key={kw} className="text-[11px] bg-risk-red/10 text-risk-red border border-risk-red/20">{kw}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-risk-orange flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-orange inline-block" />
                ORANGE — 기본 키워드
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ORANGE_FLAG_KEYWORDS.map((kw) => (
                  <Badge key={kw} className="text-[11px] bg-risk-orange/10 text-risk-orange border border-risk-orange/20">{kw}</Badge>
                ))}
              </div>
            </div>

            {/* 사용자 추가 키워드 */}
            {settings.customKeywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-text-secondary">사용자 추가 키워드</p>
                <div className="space-y-1.5">
                  {settings.customKeywords.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.04]">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.level === 'red' ? 'bg-risk-red' : 'bg-risk-orange'}`} />
                      <span className="text-xs text-text-primary font-medium flex-1">{entry.keyword}</span>
                      {entry.description && <span className="text-[11px] text-text-secondary flex-1">{entry.description}</span>}
                      <button onClick={() => removeKeyword(i)} className="text-text-disabled hover:text-text-secondary transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 키워드 추가 폼 */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-text-secondary">새 키워드 추가</p>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="키워드"
                  className="bg-black/[0.04] border-border-color text-text-primary text-xs h-8"
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                />
                <select
                  value={newKeywordLevel}
                  onChange={(e) => setNewKeywordLevel(e.target.value as 'red' | 'orange')}
                  className="bg-black/[0.04] border border-border-color text-text-primary text-xs rounded-md px-2 h-8"
                >
                  <option value="red">RED</option>
                  <option value="orange">ORANGE</option>
                </select>
              </div>
              <Input
                value={newKeywordDesc}
                onChange={(e) => setNewKeywordDesc(e.target.value)}
                placeholder="설명 (선택)"
                className="bg-black/[0.04] border-border-color text-text-primary text-xs h-8"
              />
              <Button
                size="sm"
                onClick={addKeyword}
                disabled={!newKeyword.trim()}
                className="bg-accent hover:bg-accent/80 text-white gap-1.5 text-xs"
              >
                <Plus size={12} />
                추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card className="bg-bg-card border-border-color">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-400/15 flex items-center justify-center">
              <Bell size={14} className="text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-text-primary">알림 설정</CardTitle>
              <p className="text-xs text-text-secondary">수신할 알림 유형을 선택하세요</p>
            </div>
          </CardHeader>
          <Separator className="bg-border-color mb-3" />
          <CardContent className="space-y-0">
            {([
              { key: 'newsRefresh' as const, label: '새 기사 알림', desc: '관심 태그에 새 기사가 등록되면 알림을 받습니다' },
              { key: 'redFlag' as const, label: 'Red Flag 감지', desc: 'Clause 스크리닝에서 RED 등급 조항 발견 시 알림' },
              { key: 'lawUpdate' as const, label: '법령 개정 알림', desc: '관심 주의 보험 법령 변경사항을 알려드립니다' },
            ]).map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-text-primary font-medium">{label}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    checked={settings.notifications[key]}
                    onCheckedChange={() => toggleNotification(key)}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
                {i < arr.length - 1 && <Separator className="bg-border-color/50" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {showCountryModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface rounded-2xl border border-border-color shadow-lg w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">파견 국가 변경</h3>
              <button onClick={() => setShowCountryModal(false)} className="text-text-disabled hover:text-text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => saveCountry(c.code as CountryCode)} disabled={savingCountry}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    currentCountry === c.code ? 'border-accent bg-accent/10' : 'border-border-color hover:border-accent/40'
                  }`}>
                  <span className="text-2xl">{c.flag}</span>
                  <span className="text-[11px] font-medium text-text-primary">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
