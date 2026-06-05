import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'
import type { GlossaryEntry } from '@/lib/glossary-seed'

const SYSTEM_PROMPT = `당신은 미국 보험업 전문가입니다. 주어진 영문 보험 용어를 미국 파견 주재원이 이해할 수 있도록 설명하십시오.
반드시 아래 JSON만 반환하십시오. 다른 텍스트 없이:
{
  "term": string,
  "koreanName": string,
  "definition": string,
  "example": string,
  "relatedTerms": string[],
  "category": string
}`

export async function POST(request: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 용어 생성')

    const { term }: { term: string } = await request.json()
    if (!term?.trim()) {
      return NextResponse.json({ error: '용어를 입력하세요.' }, { status: 400 })
    }

    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `보험 용어: ${term.trim()}` }],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return internalError('용어 생성 결과를 파싱할 수 없습니다.')

    const generated = JSON.parse(jsonMatch[0])
    const entry: Partial<GlossaryEntry> = {
      id: term.trim().toLowerCase().replace(/\s+/g, '-'),
      ...generated,
      isCustom: true,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(entry)
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[POST /api/glossary/generate]', err)
    return internalError()
  }
}
