import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import Sidebar from '@/components/layout/Sidebar'
import MobileTabBar from '@/components/layout/MobileTabBar'
import { AuthProvider } from '@/components/providers/AuthProvider'

export const metadata: Metadata = {
  title: 'US Expat Hub',
  description: 'Insurance Intelligence for US Expatriates',
  openGraph: {
    title: 'US Expat Hub',
    description: 'Insurance Intelligence for US Expatriates',
    images: [{ url: '/images/hanwha-insurance-logo.jpg' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans bg-bg-base text-text-primary antialiased">
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <MobileTabBar />
        </AuthProvider>
        <Toaster
          theme="light"
          position="top-right"
          toastOptions={{
            style: { background: '#EDE6DD', border: '1px solid #E9D5CD', color: '#2D2420' },
          }}
        />
      </body>
    </html>
  )
}
