import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import LayoutShell from '@/components/providers/LayoutShell'

export const metadata: Metadata = {
  title: 'Hanwha Global Insurance Intelligence',
  description: '한화손보 글로벌 통합 지원 플랫폼',
  openGraph: {
    title: 'Hanwha Global Insurance Intelligence',
    description: '한화손보 글로벌 통합 지원 플랫폼',
    images: [{ url: '/images/hanwha-insurance-logo.jpg' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans bg-bg-base text-text-primary antialiased">
        <AuthProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
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
