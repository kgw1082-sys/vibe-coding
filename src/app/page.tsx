import Link from 'next/link'
import Topbar from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Newspaper, FileSearch, Scale, AlertTriangle, TrendingUp, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react'
import { MOCK_RECENT_NEWS, MOCK_RECENT_FLAGS } from '@/lib/mock-data'

const STAT_CARDS = [
  { label: '새 뉴스', value: '24', sub: '오늘 기준', icon: Newspaper, color: 'text-accent', bg: 'bg-accent/10' },
  { label: '분석 완료 특약', value: '12', sub: '이번 주', icon: FileSearch, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Red Flag 건수', value: '3', sub: '미해결', icon: AlertTriangle, color: 'text-risk-red', bg: 'bg-risk-red/10' },
  { label: '법령 질의', value: '8', sub: '이번 달', icon: Scale, color: 'text-purple-400', bg: 'bg-purple-400/10' },
]

const QUICK_ACCESS = [
  {
    href: '/news',
    icon: Newspaper,
    color: 'text-accent',
    bg: 'bg-accent/10',
    title: '뉴스 피드',
    description: '최신 보험 업계 뉴스를 확인하고 AI 인사이트를 받아보세요.',
    cta: '뉴스 보기',
  },
  {
    href: '/clause',
    icon: FileSearch,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    title: 'Clause Finder',
    description: '특약 원문을 업로드하고 Red Flag 조항을 즉시 스크리닝합니다.',
    cta: '스크리닝 시작',
  },
  {
    href: '/legal',
    icon: Scale,
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    title: '법령 조회',
    description: '미국 주별 보험 법령을 자연어로 질의하고 조항을 직접 검색합니다.',
    cta: '법령 조회',
  },
]

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="대시보드"
        description="US Expat Insurance Intelligence"
        actions={
          <Button size="sm" variant="ghost" className="text-text-muted hover:text-text-primary gap-1.5">
            <RefreshCw size={14} />
            새로고침
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* 통계 카드 4개 */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {STAT_CARDS.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <Card key={label} className="bg-bg-card border-border-color">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-text-muted mb-1">{label}</p>
                    <p className="text-2xl font-bold text-text-primary">{value}</p>
                    <p className="text-[11px] text-text-disabled mt-0.5">{sub}</p>
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                    <Icon size={18} className={color} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 빠른 접근 카드 3개 */}
        <div>
          <p className="text-xs font-semibold text-text-disabled uppercase tracking-widest mb-3">빠른 접근</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_ACCESS.map(({ href, icon: Icon, color, bg, title, description, cta }) => (
              <Link key={href} href={href}>
                <Card className="bg-bg-card border-border-color hover:border-accent/30 hover:bg-bg-card/80 transition-all cursor-pointer h-full">
                  <CardContent className="pt-5 pb-5">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon size={20} className={color} />
                    </div>
                    <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed mb-3">{description}</p>
                    <span className={`text-xs font-medium ${color} flex items-center gap-1`}>
                      {cta} <ChevronRight size={12} />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* 하단 2열 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* 최근 뉴스 */}
          <Card className="bg-bg-card border-border-color">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-widest">최근 뉴스</CardTitle>
              <Link href="/news" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                전체 보기 <ChevronRight size={11} />
              </Link>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              {MOCK_RECENT_NEWS.map((article, i) => (
                <div key={article.id} className={`py-3 ${i < MOCK_RECENT_NEWS.length - 1 ? 'border-b border-border-color/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    <TrendingUp size={13} className="text-accent flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-text-primary font-medium line-clamp-2 leading-snug">{article.title}</p>
                      <p className="text-[10px] text-text-disabled mt-1">
                        {article.source} · {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 최근 Flag 목록 */}
          <Card className="bg-bg-card border-border-color">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-text-secondary uppercase tracking-widest">최근 Flag</CardTitle>
              <Link href="/clause" className="text-xs text-accent hover:underline flex items-center gap-0.5">
                전체 보기 <ChevronRight size={11} />
              </Link>
            </CardHeader>
            <CardContent className="space-y-0 pt-0">
              {MOCK_RECENT_FLAGS.map((flag, i) => (
                <div key={i} className={`py-3 ${i < MOCK_RECENT_FLAGS.length - 1 ? 'border-b border-border-color/50' : ''}`}>
                  <div className="flex items-start gap-2">
                    {flag.level === 'RED'
                      ? <AlertTriangle size={13} className="text-risk-red flex-shrink-0 mt-0.5" />
                      : <AlertCircle size={13} className="text-risk-orange flex-shrink-0 mt-0.5" />
                    }
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs text-text-primary font-medium">{flag.keyword}</span>
                        <Badge className={`text-[10px] px-1 py-0 border-0 ${flag.level === 'RED' ? 'bg-risk-red/20 text-risk-red' : 'bg-risk-orange/20 text-risk-orange'}`}>
                          {flag.level}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-text-disabled truncate">{flag.clauseTitle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
