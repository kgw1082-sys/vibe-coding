'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Scale, MessageSquare, Search, AlertCircle, Sparkles,
  ExternalLink, Loader2, CheckCircle2, AlertTriangle, XCircle, HelpCircle,
} from 'lucide-react'
import { US_STATES, LEGAL_CATEGORIES } from '@/lib/mock-data'
import type { LegalQueryResult, LawSearchResult } from '@/types'

// ── Verdict 배지 ────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  violation: { label: '위반 가능성', icon: XCircle,      color: 'text-risk-red',    bg: 'bg-risk-red/15 border-risk-red/30' },
  caution:   { label: '주의 필요',   icon: AlertTriangle, color: 'text-risk-orange', bg: 'bg-risk-orange/15 border-risk-orange/30' },
  ok:        { label: '문제없음',    icon: CheckCircle2,  color: 'text-emerald-400', bg: 'bg-emerald-400/15 border-emerald-400/30' },
  unknown:   { label: '판단 불가',   icon: HelpCircle,    color: 'text-white/40',    bg: 'bg-white/5 border-white/10' },
}

function VerdictBadge({ verdict }: { verdict: LegalQueryResult['verdict'] }) {
  const cfg = VERDICT_CONFIG[verdict]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${cfg.color} ${cfg.bg}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

// ── 답변 스켈레톤 ──────────────────────────────────────────────────────
function AnswerSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-20 rounded-lg bg-white/10" />
        <Skeleton className="h-4 w-16 rounded-full bg-white/10" />
      </div>
      <Skeleton className="h-4 w-full bg-white/10" />
      <Skeleton className="h-4 w-5/6 bg-white/10" />
      <Skeleton className="h-4 w-4/5 bg-white/10" />
      <Separator className="bg-white/10 my-2" />
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">관련 법령</p>
      {[1, 2].map((i) => (
        <div key={i} className="p-2.5 rounded-lg bg-white/5 space-y-1.5">
          <Skeleton className="h-3.5 w-32 bg-white/10" />
          <Skeleton className="h-3 w-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

// ── 검색 결과 스켈레톤 ─────────────────────────────────────────────────
function SearchSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-bg-card border-white/10">
          <CardContent className="pt-4 pb-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-40 bg-white/10" />
              <Skeleton className="h-5 w-20 rounded-full bg-white/10" />
            </div>
            <Skeleton className="h-3 w-full bg-white/10" />
            <Skeleton className="h-3 w-4/5 bg-white/10" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-1.5 flex-1 rounded-full bg-white/10" />
              <Skeleton className="h-3 w-16 bg-white/10" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}

// ── 법령 칩 ────────────────────────────────────────────────────────────
function LawChip({ law }: { law: { name: string; citation: string; url?: string; snippet: string } }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent hover:bg-accent/20 transition-colors">
      <Scale size={11} />
      <span className="font-semibold">{law.citation || law.name}</span>
      {law.url && <ExternalLink size={10} className="opacity-60" />}
    </span>
  )
  if (law.url) {
    return <a href={law.url} target="_blank" rel="noopener noreferrer">{inner}</a>
  }
  return inner
}

// ── 법령 검색 결과 카드 ────────────────────────────────────────────────
function LawResultCard({ result }: { result: LawSearchResult }) {
  return (
    <Card className="bg-bg-card border-white/10 hover:border-accent/30 transition-colors">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-white leading-snug">{result.lawName}</h3>
          <Badge className="text-[10px] bg-accent/20 text-accent border-0 flex-shrink-0 whitespace-nowrap">
            {result.articleNumber}
          </Badge>
        </div>
        <p className="text-xs text-white/60 leading-relaxed">{result.content}</p>

        <div className="flex items-center justify-between mt-3 gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${result.relevanceScore * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-white/30 flex-shrink-0">
              {Math.round(result.relevanceScore * 100)}%
            </span>
          </div>
          {result.source && (
            <span className="text-[10px] text-white/25 flex-shrink-0">{result.source}</span>
          )}
          {result.url && (
            <a
              href={result.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-accent/60 hover:text-accent flex items-center gap-1 flex-shrink-0"
            >
              원문 <ExternalLink size={10} />
            </a>
          )}
        </div>
        {result.updatedAt && (
          <p className="text-[10px] text-white/20 mt-1">최종 개정: {result.updatedAt}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────
export default function LegalPage() {
  const [state,    setState]    = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [query,    setQuery]    = useState('')
  const [queryLoading, setQueryLoading] = useState(false)
  const [queryResult,  setQueryResult]  = useState<LegalQueryResult | null>(null)

  const [searchInput,   setSearchInput]   = useState('')
  const [searchScope,   setSearchScope]   = useState<string>('all')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<LawSearchResult[] | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // ── 자연어 질의 ──────────────────────────────────────────────────────
  const handleQuery = async () => {
    if (!query.trim()) return
    setQueryLoading(true)
    setQueryResult(null)
    try {
      const res = await fetch('/api/legal/query', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: state ?? undefined, category: category ?? undefined, question: query }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? '서버 오류')
      }
      const data: LegalQueryResult = await res.json()
      setQueryResult(data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '요청 중 오류가 발생했습니다.')
    } finally {
      setQueryLoading(false)
    }
  }

  // ── 법령 검색 ────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchInput.trim()) return
    setSearchLoading(true)
    setSearchResults(null)
    try {
      const params = new URLSearchParams({ q: searchInput.trim(), scope: searchScope })
      const res = await fetch(`/api/legal/search?${params}`)
      if (!res.ok) throw new Error('서버 오류')
      const data: { results: LawSearchResult[] } = await res.json()
      setSearchResults(data.results)
      if (data.results.length === 0) {
        toast.info('검색 결과가 없습니다.')
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '검색 중 오류가 발생했습니다.')
    } finally {
      setSearchLoading(false)
    }
  }

  return (
    <>
      <Topbar title="법령 조회" description="미국 주별 보험 법령 질의 및 검색" />

      <div className="flex-1 overflow-y-auto p-5">
        <Tabs defaultValue="nlq" className="!flex-col gap-4">
          <TabsList className="bg-bg-card border border-white/10 p-1 h-auto">
            <TabsTrigger
              value="nlq"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white text-white/50 gap-1.5 px-4 py-2"
            >
              <MessageSquare size={13} />
              자연어 질의
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="text-xs data-[state=active]:bg-accent data-[state=active]:text-white text-white/50 gap-1.5 px-4 py-2"
            >
              <Search size={13} />
              법령 직접 검색
            </TabsTrigger>
          </TabsList>

          {/* ── 자연어 질의 탭 ──────────────────────────────────────── */}
          <TabsContent value="nlq" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 좌: 입력 */}
              <div className="space-y-3">
                <Card className="bg-bg-card border-white/10">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-medium">주(State) 선택</label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="bg-bg-surface border-white/10 text-white text-sm h-9">
                          <SelectValue placeholder="주를 선택하세요 (선택 사항)" />
                        </SelectTrigger>
                        <SelectContent className="bg-bg-card border-white/10 text-white max-h-60">
                          {US_STATES.map((s) => (
                            <SelectItem key={s} value={s} className="text-sm focus:bg-accent/20 focus:text-white">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-medium">카테고리</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-bg-surface border-white/10 text-white text-sm h-9">
                          <SelectValue placeholder="카테고리 선택 (선택 사항)" />
                        </SelectTrigger>
                        <SelectContent className="bg-bg-card border-white/10 text-white">
                          {LEGAL_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c} className="text-sm focus:bg-accent/20 focus:text-white">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/50 font-medium">질의 내용</label>
                      <Textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleQuery() }}
                        placeholder="예: 캘리포니아 주에서 해외 거주자의 생명보험 계약 시 고지 의무 범위는?"
                        className="min-h-28 bg-bg-surface border-white/10 text-white placeholder:text-white/25 focus-visible:ring-accent/50 resize-none text-sm"
                      />
                      <p className="text-[10px] text-white/20">Ctrl+Enter로 바로 요청</p>
                    </div>

                    <Button
                      disabled={!query.trim() || queryLoading}
                      onClick={handleQuery}
                      className="w-full bg-accent hover:bg-accent/80 text-white gap-2"
                    >
                      {queryLoading
                        ? <><Loader2 size={14} className="animate-spin" />분석 중...</>
                        : <><Sparkles size={15} />법령 분석 요청</>}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* 우: 답변 */}
              <div className="space-y-3">
                <Card className="bg-bg-card border-white/10">
                  <CardHeader className="pb-2 flex flex-row items-center gap-2">
                    <Scale size={14} className="text-white/40" />
                    <CardTitle className="text-xs font-semibold text-white/50 uppercase tracking-widest">AI 법령 답변</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {queryLoading && <AnswerSkeleton />}

                    {!queryLoading && !queryResult && (
                      <div className="flex flex-col items-center justify-center min-h-52 text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                          <MessageSquare size={22} className="text-white/20" />
                        </div>
                        <div>
                          <p className="text-sm text-white/40 font-medium">아직 질의 내용이 없습니다</p>
                          <p className="text-xs text-white/25 mt-1">
                            주, 카테고리, 질의 내용을 입력하고<br />
                            법령 분석 요청 버튼을 클릭하세요
                          </p>
                        </div>
                      </div>
                    )}

                    {!queryLoading && queryResult && (
                      <div className="space-y-3 pt-1">
                        {/* 판정 배지 + 신뢰도 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <VerdictBadge verdict={queryResult.verdict} />
                          <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            queryResult.confidence === 'HIGH'   ? 'bg-emerald-400/15 text-emerald-400' :
                            queryResult.confidence === 'MEDIUM' ? 'bg-risk-orange/15 text-risk-orange' :
                                                                  'bg-white/10 text-white/30'
                          }`}>
                            신뢰도 {queryResult.confidence}
                          </span>
                        </div>

                        {/* 답변 본문 */}
                        <div className="flex items-start gap-2">
                          <Sparkles size={13} className="text-accent flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-white/75 leading-relaxed">{queryResult.answer}</p>
                        </div>

                        {/* 관련 법령 칩 */}
                        {queryResult.laws.length > 0 && (
                          <>
                            <Separator className="bg-white/10" />
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">관련 법령</p>
                              <div className="flex flex-wrap gap-2">
                                {queryResult.laws.map((law, i) => (
                                  <LawChip key={i} law={law} />
                                ))}
                              </div>
                              {/* 법령 스니펫 목록 */}
                              <div className="space-y-1.5 mt-2">
                                {queryResult.laws.map((law, i) => (
                                  <div key={i} className="px-3 py-2 rounded-lg bg-bg-surface border border-white/5">
                                    <p className="text-[10px] font-semibold text-accent mb-0.5">{law.citation || law.name}</p>
                                    <p className="text-xs text-white/50 leading-relaxed">{law.snippet}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 면책 고지 */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-risk-orange/10 border border-risk-orange/20">
                  <AlertCircle size={14} className="text-risk-orange flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-risk-orange/80 leading-relaxed">
                    <span className="font-semibold">면책 고지:</span> 이 답변은 AI가 생성한 참고 정보이며 법률적 조언이 아닙니다.
                    실제 법적 사안에는 반드시 자격 있는 변호사와 상담하시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── 법령 직접 검색 탭 ───────────────────────────────────── */}
          <TabsContent value="search" className="mt-0 space-y-4">
            {/* 검색 입력 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <Input
                  ref={searchInputRef}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  placeholder="법령명, 조문 번호, 키워드 (예: FBAR, IRC 911, workers comp)"
                  className="pl-9 bg-bg-card border-white/10 text-white placeholder:text-white/25 focus-visible:ring-accent/50"
                />
              </div>
              <Select value={searchScope} onValueChange={(v) => v !== null && setSearchScope(v)}>
                <SelectTrigger className="w-24 h-10 text-xs bg-bg-card border-white/10 text-white flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-card border-white/10 text-white">
                  <SelectItem value="all"     className="text-xs">전체</SelectItem>
                  <SelectItem value="federal" className="text-xs">연방</SelectItem>
                  <SelectItem value="state"   className="text-xs">주법</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                disabled={!searchInput.trim() || searchLoading}
                className="bg-accent hover:bg-accent/80 text-white gap-1.5 flex-shrink-0"
              >
                {searchLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Search size={14} />}
                검색
              </Button>
            </div>

            {/* 검색 결과 */}
            <div className="space-y-3">
              {searchLoading && <SearchSkeleton />}

              {!searchLoading && searchResults === null && (
                <Card className="bg-bg-card border-white/10">
                  <CardContent className="py-12 text-center">
                    <Scale size={24} className="text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">검색어를 입력하고 검색 버튼을 클릭하세요</p>
                    <p className="text-xs text-white/20 mt-1">연방법(Congress.gov, eCFR) 및 AI 보완 검색 지원</p>
                  </CardContent>
                </Card>
              )}

              {!searchLoading && searchResults !== null && searchResults.length === 0 && (
                <Card className="bg-bg-card border-white/10">
                  <CardContent className="py-10 text-center">
                    <p className="text-sm text-white/40">검색 결과가 없습니다.</p>
                    <Button
                      size="sm" variant="ghost"
                      className="mt-2 text-white/30 hover:text-white text-xs"
                      onClick={() => { setSearchInput(''); searchInputRef.current?.focus() }}
                    >
                      다시 검색
                    </Button>
                  </CardContent>
                </Card>
              )}

              {!searchLoading && searchResults && searchResults.length > 0 && (
                <>
                  <p className="text-xs text-white/35">
                    <span className="text-white font-medium">{searchResults.length}</span>건 검색됨
                  </p>
                  {searchResults.map((result, i) => (
                    <LawResultCard key={i} result={result} />
                  ))}
                </>
              )}
            </div>

            {/* 면책 고지 */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-risk-orange/10 border border-risk-orange/20">
              <AlertCircle size={14} className="text-risk-orange flex-shrink-0 mt-0.5" />
              <p className="text-xs text-risk-orange/80 leading-relaxed">
                <span className="font-semibold">면책 고지:</span> 검색 결과는 참고용이며 법적 효력이 없습니다.
                최신 법령은 공식 출처(IRS, Congress.gov 등)를 반드시 확인하세요.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
