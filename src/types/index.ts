export interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
  tags: string[]
  insight?: string  // Claude AI 한줄 인사이트
}

export interface NewsResponse {
  articles: NewsArticle[]
  cachedAt: string
}

export interface LegalQueryRequest {
  state?: string
  category?: string
  question: string
}

export interface LawRef {
  name: string
  citation: string
  url?: string
  snippet: string
}

export interface LegalQueryResult {
  question: string
  answer: string
  verdict: 'violation' | 'caution' | 'ok' | 'unknown'
  laws: LawRef[]
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface FlagItem {
  keyword: string
  level: 'RED' | 'ORANGE'
  context: string
  position: number
  guidance?: string
}

export interface MissingItem {
  keyword: string
  description: string
}

export interface ClauseScanResult {
  originalText: string
  flags: FlagItem[]
  missingItems: MissingItem[]
  score: number
  level: 'HIGH' | 'MEDIUM' | 'LOW'
  aiSummary: string
  recommendation: string
}

export interface LegalAnswer {
  question: string
  answer: string
  sources: LegalSource[]
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface LegalSource {
  title: string
  url?: string
  excerpt: string
}

export interface LawSearchResult {
  lawName: string
  articleNumber: string
  content: string
  relevanceScore: number
  source?: string
  url?: string
  updatedAt?: string
}
