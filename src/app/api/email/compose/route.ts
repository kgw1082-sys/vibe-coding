export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'

export interface EmailComposeRequest {
  receivedMail?: string
  koreanDraft: string
  recipient: 'Broker' | 'Reinsurer' | 'Insurer' | 'Client'
  tone: 'Formal' | 'Neutral' | 'Friendly'
}

export interface EmailComposeResult {
  subject: string
  body: string
}

const SYSTEM_PROMPT = `당신은 미국 보험업계에서 근무하는 주재원의 영문 비즈니스 이메일 작성 전문가입니다. 다음 규칙을 따르십시오:
- 수신 메일이 있으면 그 맥락과 톤을 반드시 반영하십시오
- recipient 유형에 맞는 격식 수준을 적용하십시오
  (Broker: 파트너십 강조 / Reinsurer: 기술적·전문적 / Insurer: 협력적 / Client: 친절하고 명확하게)
- tone 파라미터를 반영하십시오 (Formal/Neutral/Friendly)
- 보험업 도메인 용어를 자연스럽게 사용하십시오
- 반드시 아래 JSON 형식으로만 반환하십시오:
  { "subject": string, "body": string }`

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 메일 작성')

    const body: EmailComposeRequest = await request.json()
    const { receivedMail, koreanDraft, recipient, tone } = body

    if (!koreanDraft?.trim()) {
      return NextResponse.json({ error: '답변 내용을 입력하세요.' }, { status: 400 })
    }

    const userContent = [
      `Recipient type: ${recipient}`,
      `Tone: ${tone}`,
      receivedMail?.trim() ? `\nReceived email:\n${receivedMail.trim()}` : '',
      `\nKorean draft to translate into professional English email:\n${koreanDraft.trim()}`,
    ].filter(Boolean).join('\n')

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return internalError('메일 생성 결과를 파싱할 수 없습니다.')

    const result: EmailComposeResult = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[/api/email/compose]', err)
    return internalError()
  }
}
