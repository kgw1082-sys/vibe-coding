export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 번역')

    const { text }: { text: string } = await request.json()
    if (!text?.trim()) return NextResponse.json({ error: '번역할 텍스트를 입력하세요.' }, { status: 400 })

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `다음 영문 보험업 이메일을 한국어로 번역하라. 핵심 요청사항을 마지막에 bullet point로 정리하라. JSON으로만 반환:
{ "translation": string, "keyPoints": string[] }

이메일:
${text.trim()}`,
      }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return internalError('번역 결과를 파싱할 수 없습니다.')

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[POST /api/email/translate]', err)
    return internalError()
  }
}
