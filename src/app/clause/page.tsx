'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FlagCard from '@/components/clause/FlagCard'
import MissingCard from '@/components/clause/MissingCard'
import TextViewer from '@/components/clause/TextViewer'
import {
  Play, RotateCcw, FileUp, FileText, AlertTriangle,
  ClipboardList, Loader2, Sparkles, FlaskConical,
} from 'lucide-react'
import type { ClauseScanResult } from '@/types'

const SAMPLE_TEXT =
  `This General Liability policy excludes any loss, damage, or claim arising out of or in any way related to asbestos or asbestos-containing materials. Coverage shall not apply to any transaction involving a sanctioned entity as defined under OFAC regulations. The insurer reserves the right to apply absolute exclusion to any pollution-related claims.`

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW'

const LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; bar: string }> = {
  HIGH:   { label: 'HIGH',   color: 'text-risk-red',    bg: 'bg-risk-red/20',    bar: 'bg-risk-red' },
  MEDIUM: { label: 'MEDIUM', color: 'text-risk-orange', bg: 'bg-risk-orange/20', bar: 'bg-risk-orange' },
  LOW:    { label: 'LOW',    color: 'text-emerald-400', bg: 'bg-emerald-400/20', bar: 'bg-emerald-400' },
}

export default function ClausePage() {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileData, setFileData] = useState<{ base64: string; name: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClauseScanResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── 파일 업로드 ──────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(pdf|docx)$/i)) {
      toast.error('PDF 또는 DOCX 파일만 업로드 가능합니다.')
      return
    }
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = (reader.result as string).split(',')[1]
      setFileData({ base64: b64, name: file.name })
    }
    reader.readAsDataURL(file)
  }

  // ── 스캔 실행 ────────────────────────────────────────────────
  const handleScan = async () => {
    if (!text.trim() && !fileData) {
      toast.error('텍스트를 입력하거나 파일을 업로드해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/clause/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text:       text || undefined,
          fileBase64: fileData?.base64,
          fileName:   fileData?.name,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? '스캔 요청이 실패했습니다.')
      }
      const data: ClauseScanResult = await res.json()
      setResult(data)
      const redCount = data.flags.filter((f) => f.level === 'RED').length
      toast.success(`스캔 완료 — RED ${redCount}건 · 위험도 ${data.level}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '스캔 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // ── 초기화 ───────────────────────────────────────────────────
  const handleReset = () => {
    setText('')
    setFileName(null)
    setFileData(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const levelCfg = result ? LEVEL_CONFIG[result.level] : null
  const redCount    = result?.flags.filter((f) => f.level === 'RED').length    ?? 0
  const orangeCount = result?.flags.filter((f) => f.level === 'ORANGE').length ?? 0

  return (
    <>
      <Topbar
        title="Clause Finder"
        description="특약 원문 Red Flag 스크리닝"
        actions={
          <Button
            size="sm" variant="ghost"
            className="text-white/50 hover:text-white gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw size={14} />
            초기화
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* ── 입력 영역 ────────────────────────────────────────── */}
        <Card className="bg-bg-card border-white/10">
          <CardContent className="pt-4 pb-4 space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="특약 원문 텍스트를 여기에 붙여넣으세요..."
              className="min-h-28 bg-bg-surface border-white/10 text-white placeholder:text-white/25 focus-visible:ring-accent/50 resize-none text-sm font-mono leading-relaxed"
            />

            <div className="flex flex-wrap items-center gap-2">
              {/* 파일 업로드 */}
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-bg-surface text-xs text-white/55 hover:border-white/30 hover:text-white cursor-pointer transition-colors">
                <FileUp size={13} />
                PDF / DOCX 업로드
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>

              {fileName && (
                <span className="flex items-center gap-1 text-xs text-accent">
                  <FileText size={12} />
                  {fileName}
                </span>
              )}

              {/* 샘플 텍스트 */}
              <Button
                size="sm" variant="ghost"
                className="text-white/40 hover:text-white gap-1.5 text-xs"
                onClick={() => { setText(SAMPLE_TEXT); setFileName(null); setFileData(null) }}
              >
                <FlaskConical size={13} />
                샘플 텍스트
              </Button>

              {/* 스크리닝 버튼 */}
              <Button
                size="sm"
                disabled={loading || (!text.trim() && !fileData)}
                onClick={handleScan}
                className="ml-auto bg-accent hover:bg-accent/80 text-white gap-1.5 min-w-32"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" />스캔 중...</>
                  : <><Play size={14} />스크리닝 시작</>
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 하단 2열 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
          {/* 좌: 원문 뷰어 */}
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">원문 뷰어</p>
            <TextViewer
              text={result?.originalText ?? ''}
              highlights={result?.flags.map((f) => ({ keyword: f.keyword, level: f.level }))}
            />
          </div>

          {/* 우: 알럿 패널 */}
          <div className="space-y-3">
            {/* 위험도 점수 카드 */}
            <Card className="bg-bg-card border-white/10">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <AlertTriangle size={13} className="text-white/40" />
                <CardTitle className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">위험도 점수</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 레벨 배지 3개 */}
                <div className="flex gap-1.5">
                  {(['LOW', 'MEDIUM', 'HIGH'] as RiskLevel[]).map((lv) => {
                    const cfg = LEVEL_CONFIG[lv]
                    const active = result?.level === lv
                    return (
                      <div key={lv} className={`flex-1 text-center py-1.5 rounded-lg transition-all ${active ? cfg.bg : 'bg-white/5'}`}>
                        <span className={`text-xs font-bold ${active ? cfg.color : 'text-white/20'}`}>{lv}</span>
                      </div>
                    )
                  })}
                </div>

                {/* 프로그레스 바 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-white/40">위험 점수</span>
                    <span className={`text-sm font-bold ${levelCfg?.color ?? 'text-white/30'}`}>
                      {result?.score ?? 0} <span className="text-xs font-normal text-white/30">/ 100</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${levelCfg?.bar ?? 'bg-white/20'}`}
                      style={{ width: `${result?.score ?? 0}%` }}
                    />
                  </div>
                  <div className="flex gap-3 text-[10px] text-white/35">
                    <span className="text-risk-red">RED {redCount}건</span>
                    <span className="text-risk-orange">ORANGE {orangeCount}건</span>
                    <span>누락 {result?.missingItems.length ?? 0}건</span>
                  </div>
                </div>

                {/* AI 분석 요약 */}
                {result && (
                  <div className="space-y-2 pt-1 border-t border-white/10">
                    <div className="flex items-start gap-1.5">
                      <Sparkles size={12} className="text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-accent mb-1">AI 분석 요약</p>
                        <p className="text-xs text-white/55 leading-relaxed">{result.aiSummary}</p>
                      </div>
                    </div>
                    <div className="bg-bg-surface rounded-lg px-3 py-2">
                      <p className="text-[10px] font-semibold text-white/40 mb-0.5">인수 권고사항</p>
                      <p className="text-xs text-white/65 leading-relaxed">{result.recommendation}</p>
                    </div>
                  </div>
                )}

                {!result && (
                  <p className="text-[11px] text-white/25 text-center pt-1">스크리닝 전 미리보기</p>
                )}
              </CardContent>
            </Card>

            {/* Flag 목록 */}
            {result && result.flags.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
                  발견된 조항 ({result.flags.length}건)
                </p>
                {result.flags.map((flag, i) => (
                  <FlagCard key={i} flag={flag} />
                ))}
              </div>
            )}

            {/* 누락 항목 목록 */}
            {result && result.missingItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                  <ClipboardList size={11} />
                  누락 체크 항목 ({result.missingItems.length}건)
                </p>
                {result.missingItems.map((item, i) => (
                  <MissingCard key={i} item={item} />
                ))}
              </div>
            )}

            {/* 빈 상태 */}
            {!result && (
              <Card className="bg-bg-card border-white/10">
                <CardContent className="py-8 text-center">
                  <AlertTriangle size={20} className="text-white/15 mx-auto mb-2" />
                  <p className="text-xs text-white/30">스크리닝 후 Flag 목록이 표시됩니다</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
