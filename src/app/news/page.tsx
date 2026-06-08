'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { RefreshCw, Sparkles, Bookmark, BookmarkCheck, ExternalLink, Plus, X, AlertCircle } from 'lucide-react'
import { NEWS_TAGS } from '@/lib/mock-data'
import { loadSettings } from '@/lib/user-settings'
import type { NewsArticle } from '@/types'

// ── 스켈레톤 카드 ───────────────────────────────────────────────────────
function NewsCardSkeleton() {
  return (
    <Card className="bg-bg-card border-border-color">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full bg-black/[0.08]" />
          <Skeleton className="h-5 w-16 rounded-full bg-black/[0.08]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full bg-black/[0.08]" />
          <Skeleton className="h-4 w-4/5 bg-black/[0.08]" />
        </div>
        <Skeleton className="h-3 w-28 bg-black/[0.08]" />
        <div className="border-t border-border-color/50 pt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Skeleton className="h-3 w-3 rounded-full bg-accent/20" />
            <Skeleton className="h-3 w-16 bg-black/[0.08]" />
          </div>
          <Skeleton className="h-3 w-full bg-black/[0.08]" />
          <Skeleton className="h-3 w-3/4 bg-black/[0.08]" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── 뉴스 카드 ───────────────────────────────────────────────────────────
function NewsCard({ article }: { article: NewsArticle }) {
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    const saved: string[] = JSON.parse(localStorage.getItem('bookmarked_news') ?? '[]')
    setBookmarked(saved.includes(article.id))
  }, [article.id])

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    const saved: string[] = JSON.parse(localStorage.getItem('bookmarked_news') ?? '[]')
    const next = bookmarked ? saved.filter((id) => id !== article.id) : [...saved, article.id]
    localStorage.setItem('bookmarked_news', JSON.stringify(next))
    setBookmarked(!bookmarked)
    toast.success(bookmarked ? '북마크 제거' : '북마크 저장됨')
  }

  const formattedDate = (() => {
    try {
      return new Date(article.publishedAt).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'short', day: 'numeric',
      })
    } catch {
      return article.publishedAt
    }
  })()

  return (
    <Card
      className="bg-bg-card border-border-color hover:border-accent/30 transition-all cursor-pointer group"
      onClick={() => window.open(article.url, '_blank', 'noopener')}
    >
      <CardContent className="pt-4 pb-4 space-y-2">
        {/* 태그 */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.map((tag) => (
              <Badge key={tag} className="text-[10px] bg-accent/15 text-accent border-0 px-2 py-0.5">{tag}</Badge>
            ))}
          </div>
        )}

        {/* 제목 */}
        <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {article.title}
        </p>

        {/* 설명 */}
        {article.description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{article.description}</p>
        )}

        {/* 출처 · 날짜 · 액션 */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-text-disabled">
            {article.source} · {formattedDate}
          </p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleBookmark}
              className="p-1 rounded text-text-disabled hover:text-accent transition-colors"
              title={bookmarked ? '북마크 제거' : '북마크'}
            >
              {bookmarked
                ? <BookmarkCheck size={13} className="text-accent" />
                : <Bookmark size={13} />}
            </button>
            <ExternalLink size={11} className="text-text-disabled" />
          </div>
        </div>

        {/* AI 인사이트 */}
        {article.insight && (
          <div className="border-t border-border-color/50 pt-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles size={11} className="text-accent" />
              <span className="text-[10px] font-semibold text-accent">AI 인사이트</span>
            </div>
            <p className="text-[11px] text-text-secondary leading-relaxed">{article.insight}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── 태그 추가 모달 ──────────────────────────────────────────────────────
function AddTagModal({ onAdd, onClose }: { onAdd: (tag: string) => void; onClose: () => void }) {
  const [value, setValue] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-bg-card border border-border-color rounded-xl p-5 w-full max-w-xs space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">태그 추가</p>
          <button onClick={onClose}><X size={16} className="text-text-disabled hover:text-text-primary" /></button>
        </div>
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); onClose() } }}
          placeholder="새 태그 이름 (예: Flood)"
          className="bg-bg-surface border-border-color text-text-primary placeholder:text-text-disabled focus-visible:ring-accent/50"
        />
        <div className="flex gap-2">
          <Button
            size="sm" variant="ghost" className="flex-1 text-text-secondary"
            onClick={onClose}
          >취소</Button>
          <Button
            size="sm"
            className="flex-1 bg-accent hover:bg-accent/80 text-white"
            disabled={!value.trim()}
            onClick={() => { if (value.trim()) { onAdd(value.trim()); onClose() } }}
          >추가</Button>
        </div>
      </div>
    </div>
  )
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────
export default function NewsPage() {
  const [selectedTag, setSelectedTag] = useState<string>(() => {
    const saved = loadSettings()
    return saved.newsTags.length > 0 ? saved.newsTags[0] : '전체'
  })
  const [sortBy, setSortBy]           = useState<'publishedAt' | 'relevancy'>('publishedAt')
  const [articles, setArticles]       = useState<NewsArticle[]>([])
  const [domestic, setDomestic]       = useState<NewsArticle[]>([])
  const [cachedAt, setCachedAt]       = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [tags, setTags]               = useState<string[]>(NEWS_TAGS)
  const [showAddModal, setShowAddModal] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchArticles = async (tag: string, sort: 'publishedAt' | 'relevancy') => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    setLoading(true)
    setError(null)
    try {
      const storedToken = localStorage.getItem('auth-token')
      const headers: Record<string, string> = storedToken ? { Authorization: `Bearer ${storedToken}` } : {}
      // 국가 설정 가져오기
      const settingsRes = await fetch('/api/settings', { headers }).catch(() => null)
      const settings = settingsRes?.ok ? await settingsRes.json() : null
      const country = settings?.countryCode

      const params = new URLSearchParams({ tag, sortBy: sort, ...(country ? { country } : {}) })
      const res = await fetch(`/api/news?${params}`, { signal: abortRef.current.signal })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: '뉴스를 불러오지 못했습니다' }))
        toast.error(body.error ?? '뉴스를 불러오지 못했습니다')
        setError(body.error ?? '뉴스를 불러올 수 없습니다.')
        setArticles([])
        return
      }
      const data = await res.json()
      setArticles(data.international ?? data.articles ?? [])
      setDomestic(data.domestic ?? [])
      setCachedAt(data.cachedAt)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      toast.error('네트워크 오류가 발생했습니다')
      setError('뉴스를 불러올 수 없습니다.')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchArticles(selectedTag, sortBy) }, [selectedTag, sortBy])

  const handleTagChange = (tag: string) => {
    setSelectedTag(tag)
  }

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag])
      setSelectedTag(tag)
    }
  }

  const formattedCachedAt = cachedAt
    ? new Date(cachedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <>
      {showAddModal && (
        <AddTagModal onAdd={handleAddTag} onClose={() => setShowAddModal(false)} />
      )}

      <Topbar
        title="뉴스 피드"
        description="최신 보험 업계 뉴스 및 AI 인사이트"
        actions={
          <Button
            size="sm" variant="ghost"
            className="text-text-secondary hover:text-text-primary gap-1.5"
            onClick={() => fetchArticles(selectedTag, sortBy)}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            새로고침
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* ── 태그 필터 바 ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTag === tag
                  ? 'bg-accent text-white border-accent'
                  : 'bg-bg-card text-text-secondary border-border-color hover:border-border-color hover:text-text-primary'
              }`}
            >
              {tag}
            </button>
          ))}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-border-color text-text-disabled hover:border-accent/50 hover:text-accent transition-colors flex items-center gap-1"
          >
            <Plus size={11} />
            태그 추가
          </button>
        </div>

        {/* ── 정렬 툴바 ────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            {loading ? (
              <span className="text-text-disabled">불러오는 중...</span>
            ) : (
              <>
                <span className="text-text-primary font-medium">{articles.length}</span>개 기사
                {selectedTag !== '전체' && (
                  <span className="ml-1 text-accent">· {selectedTag}</span>
                )}
                {formattedCachedAt && (
                  <span className="ml-1.5 text-text-disabled">(업데이트: {formattedCachedAt})</span>
                )}
              </>
            )}
          </p>
          <Select value={sortBy} onValueChange={(v) => v !== null && setSortBy(v as 'publishedAt' | 'relevancy')}>
            <SelectTrigger className="w-32 h-8 text-xs bg-bg-card border-border-color text-text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-card border-border-color text-text-primary">
              <SelectItem value="publishedAt" className="text-xs">최신순</SelectItem>
              <SelectItem value="relevancy"   className="text-xs">관련도순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── 에러 상태 ────────────────────────────────────────── */}
        {error && !loading && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-risk-red/10 border border-risk-red/20">
            <AlertCircle size={16} className="text-risk-red flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-risk-red font-medium">{error}</p>
              <p className="text-xs text-risk-red/60 mt-0.5">API 키 또는 네트워크를 확인하세요.</p>
            </div>
            <Button
              size="sm" variant="ghost"
              className="text-risk-red/80 hover:text-risk-red"
              onClick={() => fetchArticles(selectedTag, sortBy)}
            >
              재시도
            </Button>
          </div>
        )}

        {/* ── 해외 뉴스 그리드 ─────────────────────────────────── */}
        {selectedTag !== '전체' && (
          <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            📌 <span className="text-accent">{selectedTag}</span> 관련 기사
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <NewsCardSkeleton key={i} />)
            : articles.map((article) => <NewsCard key={article.id} article={article} />)
          }
        </div>

        {/* ── 국내 관련 뉴스 ───────────────────────────────────── */}
        {!loading && domestic.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-1.5">
              🇰🇷 국내 관련 뉴스
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {domestic.map((article) => <NewsCard key={article.id} article={article} />)}
            </div>
          </div>
        )}

        {/* ── 빈 상태 ──────────────────────────────────────────── */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-text-secondary">해당 태그의 뉴스가 없습니다.</p>
            <Button
              size="sm" variant="ghost"
              className="mt-3 text-text-secondary hover:text-text-primary"
              onClick={() => handleTagChange('전체')}
            >
              전체 보기
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
