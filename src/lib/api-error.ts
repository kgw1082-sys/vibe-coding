// src/lib/api-error.ts
import { NextResponse } from 'next/server'

export function missingApiKey(service = '서비스') {
  return NextResponse.json(
    { error: `${service} 설정이 필요합니다` },
    { status: 503 },
  )
}

export function rateLimited() {
  return NextResponse.json(
    { error: '잠시 후 다시 시도해 주세요' },
    { status: 429 },
  )
}

export function internalError(message = '서버 오류가 발생했습니다') {
  return NextResponse.json({ error: message }, { status: 500 })
}

/** Returns true if the error looks like an Anthropic rate-limit */
export function isRateLimit(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    return (err as { status: number }).status === 429
  }
  return false
}
