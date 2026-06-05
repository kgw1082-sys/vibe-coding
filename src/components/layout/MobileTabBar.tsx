'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Newspaper, FileSearch, Scale, Settings, Mail } from 'lucide-react'

const navItems = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/news', label: '뉴스', icon: Newspaper },
  { href: '/clause', label: 'Clause', icon: FileSearch },
  { href: '/email', label: '메일', icon: Mail },
  { href: '/legal', label: '법령', icon: Scale },
  { href: '/settings', label: '설정', icon: Settings },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-bg-surface border-t border-border-color safe-area-bottom">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              active ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
