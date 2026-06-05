import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import MobileTabBar from '@/components/layout/MobileTabBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'US Expat Hub',
  description: 'Insurance Intelligence for US Expatriates',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className={`${inter.className} bg-bg-base text-white antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
            {children}
          </main>
        </div>
        <MobileTabBar />
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: { background: '#21253a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
          }}
        />
      </body>
    </html>
  )
}
