'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Newspaper, FileSearch, Scale, Mail, BookOpen, Settings,
  Plus, ChevronRight, Clock, TrendingUp, CalendarDays, Trash2,
} from 'lucide-react'
import { getEventsForDate, deleteEvent, toDateStr, type ScheduleEvent } from '@/lib/schedule'
import type { NewsArticle } from '@/types'

const SHORTCUTS = [
  { href: '/calendar', icon: CalendarDays, label: '캘린더' },
  { href: '/news',     icon: Newspaper,   label: '뉴스 피드' },
  { href: '/clause',   icon: FileSearch,  label: 'Clause Finder' },
  { href: '/legal',    icon: Scale,       label: '법령 조회' },
  { href: '/email',    icon: Mail,        label: '메일 작성기' },
  { href: '/glossary', icon: BookOpen,    label: '용어 사전' },
  { href: '/settings', icon: Settings,    label: '설정' },
]

function todayLabel() {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  })
}

const DOT_COLOR: Record<string, string> = {
  orange: 'bg-accent',
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  red: 'bg-risk-red',
}

export default function DashboardPage() {
  const [todayStr, setTodayStr] = useState('')
  const [todayEvents, setTodayEvents] = useState<ScheduleEvent[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const { user } = useAuth()
  const router = useRouter()

  const todayDate = toDateStr(new Date())

  const refreshEvents = useCallback(() => {
    setTodayEvents(getEventsForDate(todayDate))
  }, [todayDate])

  useEffect(() => {
    setTodayStr(todayLabel())
    refreshEvents()
    // 실시간 뉴스 fetch
    fetch('/api/news')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.articles) setNews(data.articles.slice(0, 3)) })
      .catch(() => null)
  }, [refreshEvents])

  const handleDelete = (id: string) => {
    deleteEvent(id)
    refreshEvents()
  }

  return (
    <>
      <Topbar title="대시보드" description="US Expat Insurance Intelligence" />

      <div className="flex-1 overflow-y-auto p-5 space-y-6 max-w-3xl">

        {/* [1] 웰컴 헤더 */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">안녕하세요, {user?.name ?? '...'}님 👋</h2>
          <p className="text-sm text-text-muted mt-0.5">{todayStr}</p>
        </div>

        {/* [2] 오늘의 일정 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock size={15} className="text-accent" />
              오늘의 일정
            </h3>
            <Button size="sm" variant="outline" onClick={() => router.push('/calendar')}
              className="h-7 text-xs gap-1 border-border-color text-text-secondary hover:text-text-primary hover:border-accent/50">
              <Plus size={12} /> 일정 추가
            </Button>
          </div>
          <Card className="bg-bg-card border-border-color">
            <CardContent className="py-2 px-4">
              {todayEvents.length === 0 ? (
                <div className="py-5 text-center space-y-2">
                  <p className="text-sm text-text-disabled">오늘 등록된 일정이 없습니다</p>
                  <button onClick={() => router.push('/calendar')}
                    className="text-xs text-accent hover:underline">
                    + 캘린더에서 추가하기
                  </button>
                </div>
              ) : (
                <div>
                  {todayEvents.map((event, i) => (
                    <div key={event.id}
                      className={`flex items-center gap-3 py-3 group ${i < todayEvents.length - 1 ? 'border-b border-border-color/50' : ''}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[event.color ?? 'orange'] ?? 'bg-accent'}`} />
                      {event.time && (
                        <span className="text-xs font-semibold text-accent w-10 flex-shrink-0">{event.time}</span>
                      )}
                      <span className="text-sm text-text-primary flex-1">{event.title}</span>
                      <button onClick={() => handleDelete(event.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-disabled hover:text-risk-red transition-all p-1 rounded">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {todayEvents.length > 0 && (
            <Link href="/calendar" className="text-xs text-accent hover:underline flex items-center gap-0.5 mt-2 justify-end">
              캘린더 전체 보기 <ChevronRight size={11} />
            </Link>
          )}
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
              {news.length === 0 ? (
                <div className="py-4 space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className={`py-3 ${i < 3 ? 'border-b border-border-color/50' : ''}`}>
                      <div className="h-3.5 w-3/4 bg-black/[0.06] rounded animate-pulse mb-2" />
                      <div className="h-2.5 w-1/3 bg-black/[0.04] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : news.map((article, i) => (
                <a key={article.id} href={article.url} target="_blank" rel="noopener noreferrer"
                  className={`block py-3 hover:bg-black/[0.03] -mx-4 px-4 transition-colors ${i < 2 ? 'border-b border-border-color/50' : ''}`}>
                  <p className="text-sm text-text-primary font-medium leading-snug line-clamp-2 hover:text-accent transition-colors">
                    {article.title}
                  </p>
                  <p className="text-[11px] text-text-disabled mt-1">
                    {article.source} · {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                  </p>
                </a>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* [4] 바로가기 */}
        <section>
          <h3 className="text-sm font-semibold text-text-primary mb-3">바로가기</h3>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
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
