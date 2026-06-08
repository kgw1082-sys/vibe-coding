'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Copy, RotateCcw, Mail, Clock } from 'lucide-react'
import type { EmailComposeRequest, EmailComposeResult } from '@/app/api/email/compose/route'

type Recipient = 'Broker' | 'Reinsurer' | 'Insurer' | 'Client'
type Tone = 'Formal' | 'Neutral' | 'Friendly'

interface HistoryItem {
  id: string
  subject: string
  body: string
  recipient: Recipient
  tone: Tone
  createdAt: string
}

function isEnglishDominated(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z가-힣]/g, '')
  if (letters.length === 0) return false
  const english = (text.match(/[a-zA-Z]/g) ?? []).length
  return english / letters.length > 0.7
}

const HISTORY_KEY = 'hanwha-global:email-history'
const MAX_HISTORY = 5

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveHistory(item: HistoryItem) {
  const prev = loadHistory()
  const next = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, 10)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
}

const RECIPIENTS: Recipient[] = ['Broker', 'Reinsurer', 'Insurer', 'Client']
const TONES: Tone[] = ['Formal', 'Neutral', 'Friendly']

export default function EmailPage() {
  const [recipient, setRecipient] = useState<Recipient>('Broker')
  const [tone, setTone] = useState<Tone>('Formal')
  const [receivedMail, setReceivedMail] = useState('')
  const [koreanDraft, setKoreanDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<EmailComposeResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [translating, setTranslating] = useState(false)
  const [translation, setTranslation] = useState<{ translation: string; keyPoints: string[] } | null>(null)
  const [showTranslation, setShowTranslation] = useState(false)
  const [isAutoDraft, setIsAutoDraft] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  // auto-resize body textarea
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.style.height = 'auto'
      bodyRef.current.style.height = `${bodyRef.current.scrollHeight}px`
    }
  }, [result?.body])

  const handleReceivedMailPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (!pasted || !isEnglishDominated(pasted)) return

    setTranslating(true)
    setTranslation(null)
    setShowTranslation(false)

    try {
      const res = await fetch('/api/email/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasted }),
      })
      if (res.ok) {
        const data = await res.json()
        setTranslation(data)
        setShowTranslation(true)
      }
    } catch {
      // silently ignore translation errors
    } finally {
      setTranslating(false)
    }
  }

  const compose = async () => {
    if (!koreanDraft.trim() && !receivedMail.trim()) {
      toast.error('수신 메일 또는 답변 내용을 입력하세요.')
      return
    }
    setIsAutoDraft(false)
    setLoading(true)
    try {
      const payload: EmailComposeRequest = { receivedMail, koreanDraft, recipient, tone }
      const res = await fetch('/api/email/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '메일 생성에 실패했습니다.' }))
        toast.error(error ?? '메일 생성에 실패했습니다.')
        return
      }
      const data: EmailComposeResult = await res.json()
      setResult(data)
      if (!koreanDraft.trim()) setIsAutoDraft(true)

      const item: HistoryItem = {
        id: Date.now().toString(),
        subject: data.subject,
        body: data.body,
        recipient,
        tone,
        createdAt: new Date().toISOString(),
      }
      saveHistory(item)
      setHistory(loadHistory())
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!result) return
    const text = `Subject: ${result.subject}\n\n${result.body}`
    navigator.clipboard.writeText(text).then(() => toast.success('클립보드에 복사됐습니다.'))
  }

  const restoreHistory = (item: HistoryItem) => {
    setResult({ subject: item.subject, body: item.body })
    setRecipient(item.recipient)
    setTone(item.tone)
  }

  const toggleBtn = (active: boolean) =>
    active
      ? 'bg-accent text-white border-accent'
      : 'bg-bg-surface text-text-secondary border-border-color hover:border-accent/50 hover:text-text-primary'

  return (
    <>
      <Topbar title="메일 작성기" description="영문 비즈니스 이메일 자동 생성" />

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">

          {/* ── 좌측: 입력 영역 ── */}
          <div className="space-y-4">

            {/* 발신 대상 */}
            <Card className="bg-bg-card border-border-color">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wide">발신 대상</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-4 gap-2">
                  {RECIPIENTS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setRecipient(r)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${toggleBtn(recipient === r)}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 톤 선택 */}
            <Card className="bg-bg-card border-border-color">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wide">톤</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${toggleBtn(tone === t)}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 수신 메일 */}
            <Card className="bg-bg-card border-border-color">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wide">수신 메일 <span className="normal-case font-normal text-text-disabled">(선택)</span></CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Textarea
                  value={receivedMail}
                  onChange={(e) => { setReceivedMail(e.target.value); if (!e.target.value) { setTranslation(null); setShowTranslation(false) } }}
                  onPaste={handleReceivedMailPaste}
                  placeholder="상대방 메일을 여기에 붙여넣으세요 (영문 메일 붙여넣기 시 자동 번역됩니다)"
                  className="h-40 resize-none bg-bg-surface border-border-color text-text-primary text-sm placeholder:text-text-disabled"
                />
                {translating && (
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                    <Loader2 size={12} className="animate-spin" />
                    번역 중...
                  </div>
                )}
                {translation && (
                  <div className="mt-2 border border-border-color rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-bg-base text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span>📋 번역 결과 보기</span>
                      <span>{showTranslation ? '▲' : '▼'}</span>
                    </button>
                    {showTranslation && (
                      <div className="px-3 py-3 bg-bg-surface space-y-3">
                        <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">{translation.translation}</p>
                        {translation.keyPoints.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-text-muted mb-1">핵심 요청사항</p>
                            <ul className="space-y-0.5">
                              {translation.keyPoints.map((pt, i) => (
                                <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                                  <span className="text-accent flex-shrink-0">•</span>{pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 한국어 답변 */}
            <Card className="bg-bg-card border-border-color">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wide">답변 내용 <span className="normal-case font-normal text-risk-red">*</span></CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                <Textarea
                  value={koreanDraft}
                  onChange={(e) => setKoreanDraft(e.target.value)}
                  placeholder={`한국어로 답변 내용을 입력하세요.\n(비워두면 수신 메일 기반으로 자동 초안을 생성합니다)`}
                  className="h-[140px] resize-none bg-bg-surface border-border-color text-text-primary text-sm placeholder:text-text-disabled"
                />
                <Button
                  onClick={compose}
                  disabled={loading || (!koreanDraft.trim() && !receivedMail.trim())}
                  className="w-full bg-accent hover:bg-accent-hover text-white font-medium gap-2"
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> 생성 중...</>
                  ) : (
                    <><Mail size={15} /> 영문 메일 생성</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── 우측: 결과 영역 ── */}
          <div className="space-y-4">
            <Card className="bg-bg-card border-border-color min-h-[400px]">
              <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wide">생성 결과</CardTitle>
                {result && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={copyToClipboard}
                      className="h-7 text-xs gap-1.5 border-border-color text-text-secondary hover:text-text-primary">
                      <Copy size={12} /> 복사
                    </Button>
                    <Button size="sm" variant="outline" onClick={compose} disabled={loading}
                      className="h-7 text-xs gap-1.5 border-border-color text-text-secondary hover:text-text-primary">
                      <RotateCcw size={12} /> 재생성
                    </Button>
                  </div>
                )}
              </CardHeader>
              <Separator className="bg-border-color" />
              <CardContent className="px-4 py-4">
                {!result ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-3 text-text-disabled">
                    <Mail size={32} className="opacity-30" />
                    <p className="text-sm">생성된 메일이 여기에 표시됩니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isAutoDraft && (
                      <div className="flex items-center gap-1.5 text-xs text-text-muted bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 mb-3">
                        <span>🤖</span>
                        <span>자동 생성된 초안입니다. 내용을 검토 후 수정하세요.</span>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Subject</p>
                      <Input
                        value={result.subject}
                        onChange={(e) => setResult({ ...result, subject: e.target.value })}
                        className="bg-bg-surface border-border-color text-text-primary text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">Body</p>
                      <textarea
                        ref={bodyRef}
                        value={result.body}
                        onChange={(e) => {
                          setResult({ ...result, body: e.target.value })
                          e.target.style.height = 'auto'
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        className="w-full min-h-[200px] bg-bg-surface border border-border-color rounded-md text-text-primary text-sm leading-relaxed p-3 resize-none focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 히스토리 */}
            {history.length > 0 && (
              <Card className="bg-bg-card border-border-color">
                <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center gap-2">
                  <Clock size={13} className="text-text-muted" />
                  <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-wide">최근 생성 내역</CardTitle>
                </CardHeader>
                <Separator className="bg-border-color" />
                <CardContent className="px-4 py-2">
                  <div className="space-y-0.5">
                    {history.slice(0, MAX_HISTORY).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => restoreHistory(item)}
                        className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-black/[0.04] transition-colors text-left group"
                      >
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                          item.tone === 'Formal' ? 'bg-accent/10 text-accent' :
                          item.tone === 'Friendly' ? 'bg-emerald-500/10 text-emerald-600' :
                          'bg-black/[0.06] text-text-muted'
                        }`}>{item.recipient}</span>
                        <span className="text-xs text-text-primary truncate flex-1 group-hover:text-accent transition-colors">
                          {item.subject}
                        </span>
                        <span className="text-[10px] text-text-disabled flex-shrink-0">
                          {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
