'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Newspaper, FileSearch, Scale, Settings, ShieldCheck,
} from 'lucide-react'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/news', label: '뉴스 피드', icon: Newspaper },
  { href: '/clause', label: 'Clause Finder', icon: FileSearch },
  { href: '/legal', label: '법령 조회', icon: Scale },
  { href: '/settings', label: '설정', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-[220px] min-h-screen flex-col bg-bg-surface border-r border-white/10 flex-shrink-0">
      {/* 브랜드 로고 */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <ShieldCheck size={18} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">US Expat Hub</p>
            <p className="text-[10px] text-white/40 leading-tight">Insurance Intelligence</p>
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pb-2">
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
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} className="flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 사용자 프로필 */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-accent/25 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
            US
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">US 보험 담당자</p>
            <p className="text-[10px] text-white/40 truncate">user@expathub.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
