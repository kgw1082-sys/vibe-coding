'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Newspaper, FileSearch, Scale, Mail, BookOpen, Settings,
  Plus, ChevronRight, Clock, TrendingUp,
} from 'lucide-react'
import { MOCK_RECENT_NEWS } from '@/lib/mock-data'

const SCHEDULES = [
  { time: '10:00', title: '뉴욕지점 주간 미팅' },
  { time: '14:00', title: '재보험사 컨퍼런스콜 (Munich Re)' },
  { time: '16:30', title: '언더라이팅 보고서 제출 마감' },
]

const SHORTCUTS = [
  { href: '/news',     icon: Newspaper,  label: '뉴스 피드' },
  { href: '/clause',   icon: FileSearch, label: 'Clause Finder' },
  { href: '/legal',    icon: Scale,      label: '법령 조회' },
  { href: '/email',    icon: Mail,       label: '메일 작성기' },
  { href: '#',         icon: BookOpen,   label: '용어 사전' },
  { href: '/settings', icon: Settings,   label: '설정' },
]

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
}

export default function DashboardPage() {
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(todayLabel())
  }, [])

  return (
    <>
      <Topbar title="대시보드" description="US Expat Insurance Intelligence" />

      <div className="flex-1 overflow-y-auto p-5 space-y-6 max-w-3xl">

        {/* [1] 웰컴 헤더 */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">안녕하세요, 홍길동님 👋</h2>
          <p className="text-sm text-text-muted mt-0.5">{today}</p>
        </div>

        {/* [2] 오늘의 일정 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock size={15} className="text-accent" />
              오늘의 일정
            </h3>
            <Button size="sm" variant="outline"
              className="h-7 text-xs gap-1 border-border-color text-text-secondary hover:text-text-primary hover:border-accent/50">
              <Plus size={12} /> 일정 추가
            </Button>
          </div>
          <Card className="bg-bg-card border-border-color">
            <CardContent className="py-2 px-4">
              {SCHEDULES.length === 0 ? (
                <p className="text-sm text-text-disabled py-4 text-center">오늘 등록된 일정이 없습니다</p>
              ) : (
                <div>
                  {SCHEDULES.map(({ time, title }, i) => (
                    <div key={i} className={`flex items-center gap-4 py-3 ${i < SCHEDULES.length - 1 ? 'border-b border-border-color/50' : ''}`}>
                      <span className="text-xs font-semibold text-accent w-10 flex-shrink-0">{time}</span>
                      <span className="text-sm text-text-primary">{title}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* [3] 오늘의 주요 뉴스 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp size={15} className="text-accent" />
              오늘의 주요 뉴스
            </h3>
            <Link href="/news" className="text-xs text-accent hover:underline flex items-center gap-0.5">
              전체 보기 <ChevronRight size={11} />
            </Link>
          </div>
          <Card className="bg-bg-card border-border-color">
            <CardContent className="py-2 px-4">
              {MOCK_RECENT_NEWS.slice(0, 3).map((article, i) => (
                <div key={article.id}
                  className={`py-3 ${i < 2 ? 'border-b border-border-color/50' : ''}`}>
                  <p className="text-sm text-text-primary font-medium leading-snug line-clamp-2">
                    {article.title}
                  </p>
                  <p className="text-[11px] text-text-disabled mt-1">
                    {article.source} · {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* [4] 바로가기 */}
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-3">바로가기</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {SHORTCUTS.map(({ href, icon: Icon, label }) => (
              <Link key={label} href={href}>
                <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-bg-card border border-border-color hover:border-accent/40 hover:bg-accent/5 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Icon size={17} className="text-accent" />
                  </div>
                  <span className="text-[11px] font-medium text-text-secondary text-center leading-tight">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}
