import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import LayoutShell from '@/components/providers/LayoutShell'

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
