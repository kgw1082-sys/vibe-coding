import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="w-full max-w-sm px-8 py-10 bg-bg-surface rounded-2xl border border-border-color shadow-sm flex flex-col items-center gap-6">
        <Image
          src="/images/hanwha-insurance-logo.jpg"
          alt="Hanwha Insurance"
          width={200}
          height={48}
          className="h-12 w-auto object-contain"
          priority
        />
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-text-primary">US Expat Hub</h1>
          <p className="text-sm text-text-muted">미국 주재원 통합 플랫폼</p>
        </div>
      </div>
    </div>
  )
}
