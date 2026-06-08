'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Newspaper, FileSearch, Scale, Settings, Mail, BookOpen, LogOut } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/news', label: '뉴스', icon: Newspaper },
  { href: '/clause', label: 'Clause', icon: FileSearch },
  { href: '/email', label: '메일', icon: Mail },
  { href: '/legal', label: '법령', icon: Scale },
  { href: '/glossary', label: '용어', icon: BookOpen },
  { href: '/settings', label: '설정', icon: Settings },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  // router not needed here
  const { logout } = useAuth()

  const handleLogout = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    logout()
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-bg-surface border-t border-border-color safe-area-bottom overflow-x-auto">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-shrink-0 flex flex-col items-center justify-center py-2 px-3 gap-0.5 min-h-[56px] min-w-[52px] transition-colors ${
              active ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
      <button
        onClick={handleLogout}
        onTouchEnd={handleLogout}
        className="flex-shrink-0 flex flex-col items-center justify-center py-2 px-3 gap-0.5 min-h-[56px] min-w-[52px] text-text-secondary hover:text-risk-red transition-colors cursor-pointer"
      >
        <LogOut size={20} />
        <span className="text-[10px] font-medium">로그아웃</span>
      </button>
    </nav>
  )
}
