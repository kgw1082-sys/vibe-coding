import { NextResponse } from 'next/server'
import anthropic from '@/lib/anthropic'
import type { LegalQueryRequest, LegalQueryResult, LawRef } from '@/types'
import { missingApiKey, rateLimited, isRateLimit } from '@/lib/api-error'

const MOCK_RESULT: LegalQueryResult = {
  question: '',
  answer: 'AI 분석 기능은 API 키 설정 후 활성화됩니다. `.env.local`의 `ANTHROPIC_API_KEY`를 설정하세요.',
  verdict: 'unknown',
  laws: [],
  confidence: 'LOW',
}

export async function POST(request: Request) {
  const body: LegalQueryRequest = await request.json()
  const { state, category, question } = body

  if (!question?.trim()) {
    return NextResponse.json({ error: '질의 내용이 필요합니다.' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 분석')

  const context = [
    state    && `대상 주(State): ${state}`,
    category && `카테고리: ${category}`,
  ].filter(Boolean).join('\n')

  const prompt = `당신은 미국 보험법 및 파견 주재원(Expat) 관련 법령 전문가입니다.
${context}

아래 질의에 대해 분석하고, 반드시 다음 JSON 형식으로만 응답하십시오 (코드블록·부가 텍스트 없이 순수 JSON):

{
  "answer": "상세 답변 (한국어, 3-5문장)",
  "verdict": "violation | caution | ok | unknown",
  "laws": [
    {
      "name": "법령명",
      "citation": "조문 번호 또는 인용 (예: IRC §911, 26 U.S.C. 911)",
      "url": "관련 URL (없으면 빈 문자열)",
      "snippet": "관련 조문 핵심 내용 요약 (한국어, 1-2문장)"
    }
  ],
  "confidence": "HIGH | MEDIUM | LOW"
}

verdict 기준:
- violation: 현재 상황이 법적 위반 가능성 있음
- caution: 주의 필요, 추가 검토 권고
- ok: 법적으로 문제없음
- unknown: 정보 부족으로 판단 불가

질의: ${question}`

  try {
    const msg = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw   = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON 파싱 실패')

    const parsed: {
      answer?: string
      verdict?: LegalQueryResult['verdict']
      laws?: LawRef[]
      confidence?: LegalQueryResult['confidence']
    } = JSON.parse(match[0])

    const result: LegalQueryResult = {
      question,
      answer:     parsed.answer     ?? '분석 결과를 생성하지 못했습니다.',
      verdict:    parsed.verdict    ?? 'unknown',
      laws:       parsed.laws       ?? [],
      confidence: parsed.confidence ?? 'LOW',
    }
    return NextResponse.json(result)
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[/api/legal/query]', err)
    return NextResponse.json({ ...MOCK_RESULT, question } satisfies LegalQueryResult)
  }
}
