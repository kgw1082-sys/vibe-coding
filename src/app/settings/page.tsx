'use client'

import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tag, AlertTriangle, Bell, X, Save } from 'lucide-react'
import { NEWS_TAGS } from '@/lib/mock-data'
import { RED_FLAG_KEYWORDS, ORANGE_FLAG_KEYWORDS } from '@/lib/clause-keywords'

export default function SettingsPage() {
  const [selectedTags, setSelectedTags] = useState<string[]>(['P&C Insurance', 'Reinsurance', 'Cyber Risk'])
  const [notifications, setNotifications] = useState({
    newArticles: true,
    redFlag: true,
    weeklyDigest: false,
    legalUpdates: true,
  })

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      <Topbar
        title="설정"
        description="US Expat Hub 환경 설정"
        actions={
          <Button size="sm" className="bg-accent hover:bg-accent/80 text-white gap-1.5">
            <Save size={14} />
            저장
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl">

        {/* 뉴스 관심 태그 관리 */}
        <Card className="bg-bg-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <Tag size={14} className="text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">뉴스 관심 태그</CardTitle>
              <p className="text-xs text-white/40">선택한 태그의 뉴스만 피드에 표시됩니다</p>
            </div>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {NEWS_TAGS.filter((t) => t !== '전체').map((tag) => {
                const active = selectedTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {tag}
                    {active && <X size={10} />}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-white/30">
              {selectedTags.length}개 태그 선택됨
            </p>
          </CardContent>
        </Card>

        {/* Red Flag 키워드 사전 */}
        <Card className="bg-bg-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-risk-red/15 flex items-center justify-center">
              <AlertTriangle size={14} className="text-risk-red" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">Red Flag 키워드 사전</CardTitle>
              <p className="text-xs text-white/40">Clause Finder 스크리닝에 사용되는 키워드 목록</p>
            </div>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-risk-red flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-red inline-block" />
                RED — 즉시 검토 필요
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RED_FLAG_KEYWORDS.map((kw) => (
                  <Badge key={kw} className="text-[11px] bg-risk-red/10 text-risk-red border border-risk-red/20">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-risk-orange flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-orange inline-block" />
                ORANGE — 누락 여부 체크
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ORANGE_FLAG_KEYWORDS.map((kw) => (
                  <Badge key={kw} className="text-[11px] bg-risk-orange/10 text-risk-orange border border-risk-orange/20">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-white/10 text-white/50 hover:text-white hover:border-white/30 text-xs">
              + 키워드 추가
            </Button>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card className="bg-bg-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-400/15 flex items-center justify-center">
              <Bell size={14} className="text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">알림 설정</CardTitle>
              <p className="text-xs text-white/40">수신할 알림 유형을 선택하세요</p>
            </div>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent className="space-y-0">
            {[
              { key: 'newArticles' as const, label: '새 기사 알림', desc: '관심 태그에 새 기사가 등록되면 알림을 받습니다' },
              { key: 'redFlag' as const, label: 'Red Flag 감지', desc: 'Clause 스크리닝에서 RED 등급 조항 발견 시 알림' },
              { key: 'weeklyDigest' as const, label: '주간 다이제스트', desc: '매주 월요일 보험 시장 동향 요약을 이메일로 받습니다' },
              { key: 'legalUpdates' as const, label: '법령 개정 알림', desc: '관심 주의 보험 법령 변경사항을 알려드립니다' },
            ].map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-white font-medium">{label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    checked={notifications[key]}
                    onCheckedChange={() => toggleNotification(key)}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
                {i < arr.length - 1 && <Separator className="bg-white/5" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
