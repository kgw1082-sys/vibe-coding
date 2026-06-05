'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, FileSearch, Scale, Settings, Mail, BookOpen, Wrench, LogOut, CalendarDays,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/calendar', label: '캘린더', icon: CalendarDays },
  { href: '/news', label: '뉴스 피드', icon: Newspaper },
  { href: '/clause', label: 'Clause Finder', icon: FileSearch },
  { href: '/email', label: '메일 작성기', icon: Mail },
  { href: '/legal', label: '법령 조회', icon: Scale },
  { href: '/glossary', label: '용어 사전', icon: BookOpen },
  { href: '/settings', label: '설정', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="hidden md:flex w-[220px] min-h-screen flex-col bg-bg-surface border-r border-border-color flex-shrink-0">
      {/* 브랜드 로고 */}
      <div className="px-5 py-4 border-b border-border-color">
        <Image
          src="/images/hanwha-insurance-logo.jpg"
          alt="Hanwha Insurance"
          width={140}
          height={32}
          className="h-8 w-auto object-contain"
          priority
        />
        <p className="text-[10px] text-text-secondary mt-1.5 leading-tight">한화손보 글로벌 통합 지원 플랫폼</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-text-disabled uppercase tracking-widest px-3 pb-2">
          메뉴
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:bg-black/[0.04] hover:text-text-primary'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}

        {/* 관리자 메뉴 */}
        {user?.role === 'admin' && (
          <>
            <p className="text-[10px] font-semibold text-text-disabled uppercase tracking-widest px-3 pb-2 pt-4">
              관리
            </p>
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-secondary hover:bg-black/[0.04] hover:text-text-primary'
              }`}
            >
              <Wrench size={17} className="flex-shrink-0" />
              운영자 관리
            </Link>
          </>
        )}
      </nav>

      {/* 사용자 프로필 */}
      <div className="px-3 pb-4 border-t border-border-color pt-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent/25 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
            {user?.name?.[0] ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-primary truncate">{user?.name ?? '...'}</p>
            <p className="text-[10px] text-text-secondary truncate">{user?.department ?? ''}</p>
          </div>
          <button
            onClick={logout}
            className="text-text-disabled hover:text-text-primary transition-colors flex-shrink-0"
            title="로그아웃"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
