# localStorage Settings · API Error Handling · Vercel Deployment

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist user settings (news tags, keywords, notifications) in localStorage, apply consistent API error handling across all routes, and configure the project for Vercel deployment.

**Architecture:** A `useUserSettings` hook wraps all localStorage reads/writes so components share a single contract. API routes use a shared `apiError` helper that returns typed `NextResponse` objects for 503/429/500. Vercel config adds function timeouts and Next.js config adds image domains and external packages.

**Tech Stack:** Next.js 14 App Router, TypeScript, Upstash Redis (news cache only), sonner (toast), Vercel

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/lib/user-settings.ts` | localStorage get/set + UserSettings type |
| Create | `src/lib/api-error.ts` | shared API error response helpers |
| Modify | `src/app/settings/page.tsx` | load + save settings via hook |
| Modify | `src/app/news/page.tsx` | seed initial tag filter from saved settings |
| Modify | `src/app/api/news/route.ts` | use apiError helpers |
| Modify | `src/app/api/clause/scan/route.ts` | use apiError helpers |
| Modify | `src/app/api/legal/query/route.ts` | use apiError helpers |
| Modify | `src/app/api/legal/search/route.ts` | use apiError helpers |
| Modify | `next.config.mjs` | image domains + serverExternalPackages |
| Create | `vercel.json` | function maxDuration |
| Create | `README.md` | project docs |

---

## Task 1: UserSettings localStorage library

**Files:**
- Create: `src/lib/user-settings.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/user-settings.ts
const STORAGE_KEY = 'us-expat-hub:settings'

export interface KeywordEntry {
  keyword: string
  level: 'red' | 'orange'
  description: string
}

export interface UserSettings {
  newsTags: string[]
  customKeywords: KeywordEntry[]
  notifications: {
    newsRefresh: boolean
    redFlag: boolean
    lawUpdate: boolean
  }
}

const DEFAULT_SETTINGS: UserSettings = {
  newsTags: ['P&C Insurance', 'Reinsurance', 'Cyber Risk'],
  customKeywords: [],
  notifications: {
    newsRefresh: true,
    redFlag: true,
    lawUpdate: true,
  },
}

export function loadSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/user-settings.ts
git commit -m "feat: add localStorage user-settings lib"
```

---

## Task 2: Shared API error helper

**Files:**
- Create: `src/lib/api-error.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/api-error.ts
import { NextResponse } from 'next/server'

export function missingApiKey(service = '서비스') {
  return NextResponse.json(
    { error: `${service} 설정이 필요합니다` },
    { status: 503 },
  )
}

export function rateLimited() {
  return NextResponse.json(
    { error: '잠시 후 다시 시도해 주세요' },
    { status: 429 },
  )
}

export function internalError(message = '서버 오류가 발생했습니다') {
  return NextResponse.json({ error: message }, { status: 500 })
}

/** Returns true if the error looks like an Anthropic rate-limit */
export function isRateLimit(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    return (err as { status: number }).status === 429
  }
  return false
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/api-error.ts
git commit -m "feat: add shared API error helpers"
```

---

## Task 3: Apply error helpers to /api/news

**Files:**
- Modify: `src/app/api/news/route.ts`

- [ ] **Step 1: Replace the existing GET handler's error paths**

Find the `export async function GET` block. Replace the entire handler with:

```ts
import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { fetchNews } from '@/lib/newsapi'
import redis from '@/lib/redis'
import anthropic from '@/lib/anthropic'
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'
import type { NewsArticle, NewsResponse } from '@/types'

const CACHE_TTL = 3600

async function generateInsight(article: NewsArticle): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return ''
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `다음 보험 관련 기사를 미국 파견 주재원 관점에서 한국어로 한 문장(30자 이내)으로 핵심 인사이트를 작성하라. 문장만 반환하라.\n\n제목: ${article.title}\n설명: ${article.description}`,
      }],
    })
    return msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
  } catch {
    return ''
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tag = searchParams.get('tag') || '전체'
    const cacheKey = `news:${createHash('md5').update(tag).digest('hex')}`

    const cached = await redis.get<NewsResponse>(cacheKey).catch(() => null)
    if (cached) return NextResponse.json(cached)

    if (!process.env.NEWSAPI_KEY) return missingApiKey('뉴스 API')

    const articles = await fetchNews(tag)
    const withInsights = await Promise.all(
      articles.map(async (a) => ({ ...a, insight: await generateInsight(a) }))
    )
    const result: NewsResponse = { articles: withInsights, generatedAt: new Date().toISOString(), tag }
    await redis.set(cacheKey, result, { ex: CACHE_TTL }).catch(() => null)
    return NextResponse.json(result)
  } catch (err) {
    if (isRateLimit(err)) return rateLimited()
    console.error('[/api/news]', err)
    return internalError()
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/news/route.ts
git commit -m "feat: apply error helpers to /api/news"
```

---

## Task 4: Apply error helpers to /api/clause/scan

**Files:**
- Modify: `src/app/api/clause/scan/route.ts`

- [ ] **Step 1: Add imports and wrap the handler**

At the top of the file, add:
```ts
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'
```

Find the block that checks `if (!process.env.ANTHROPIC_API_KEY)` and replace it:
```ts
if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 분석')
```

Wrap the entire `POST` handler body in `try { ... } catch (err) { if (isRateLimit(err)) return rateLimited(); console.error('[/api/clause/scan]', err); return internalError() }` — keep all existing logic inside the try block, only add the catch.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/clause/scan/route.ts
git commit -m "feat: apply error helpers to /api/clause/scan"
```

---

## Task 5: Apply error helpers to /api/legal/query and /api/legal/search

**Files:**
- Modify: `src/app/api/legal/query/route.ts`
- Modify: `src/app/api/legal/search/route.ts`

- [ ] **Step 1: Update legal/query**

Add import:
```ts
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'
```

Replace the `if (!process.env.ANTHROPIC_API_KEY)` return with:
```ts
if (!process.env.ANTHROPIC_API_KEY) return missingApiKey('AI 분석')
```

Wrap the Claude call in try/catch:
```ts
} catch (err) {
  if (isRateLimit(err)) return rateLimited()
  console.error('[/api/legal/query]', err)
  // graceful degradation: return rule-based fallback
  return NextResponse.json({ ...MOCK_RESULT, question } satisfies LegalQueryResult)
}
```

- [ ] **Step 2: Update legal/search**

Add import:
```ts
import { missingApiKey, rateLimited, internalError, isRateLimit } from '@/lib/api-error'
```

Replace `if (!process.env.CONGRESS_API_KEY)`:
```ts
if (!process.env.CONGRESS_API_KEY) return missingApiKey('Congress API')
```

Wrap the outer handler in try/catch — on error return `STATIC_EXAMPLES` as graceful degradation:
```ts
} catch (err) {
  if (isRateLimit(err)) return rateLimited()
  console.error('[/api/legal/search]', err)
  return NextResponse.json(STATIC_EXAMPLES)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/legal/query/route.ts src/app/api/legal/search/route.ts
git commit -m "feat: apply error helpers to legal API routes"
```

---

## Task 6: Settings page — localStorage persistence

**Files:**
- Modify: `src/app/settings/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tag, AlertTriangle, Bell, X, Plus } from 'lucide-react'
import { NEWS_TAGS } from '@/lib/mock-data'
import { RED_FLAG_KEYWORDS, ORANGE_FLAG_KEYWORDS } from '@/lib/clause-keywords'
import { loadSettings, saveSettings } from '@/lib/user-settings'
import type { UserSettings, KeywordEntry } from '@/lib/user-settings'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [newKeyword, setNewKeyword] = useState('')
  const [newKeywordLevel, setNewKeywordLevel] = useState<'red' | 'orange'>('red')
  const [newKeywordDesc, setNewKeywordDesc] = useState('')

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const persist = useCallback((next: UserSettings) => {
    setSettings(next)
    try {
      saveSettings(next)
      toast.success('설정이 저장되었습니다')
    } catch {
      toast.error('설정 저장에 실패했습니다')
    }
  }, [])

  const toggleTag = (tag: string) => {
    if (!settings) return
    const newsTags = settings.newsTags.includes(tag)
      ? settings.newsTags.filter((t) => t !== tag)
      : [...settings.newsTags, tag]
    persist({ ...settings, newsTags })
  }

  const toggleNotification = (key: keyof UserSettings['notifications']) => {
    if (!settings) return
    persist({
      ...settings,
      notifications: { ...settings.notifications, [key]: !settings.notifications[key] },
    })
  }

  const addKeyword = () => {
    if (!settings || !newKeyword.trim()) return
    const entry: KeywordEntry = {
      keyword: newKeyword.trim(),
      level: newKeywordLevel,
      description: newKeywordDesc.trim(),
    }
    persist({ ...settings, customKeywords: [...settings.customKeywords, entry] })
    setNewKeyword('')
    setNewKeywordDesc('')
  }

  const removeKeyword = (index: number) => {
    if (!settings) return
    const customKeywords = settings.customKeywords.filter((_, i) => i !== index)
    persist({ ...settings, customKeywords })
  }

  if (!settings) return null

  return (
    <>
      <Topbar title="설정" description="US Expat Hub 환경 설정" />

      <div className="flex-1 overflow-y-auto p-5 space-y-4 max-w-2xl">

        {/* 뉴스 관심 태그 */}
        <Card className="bg-bg-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
              <Tag size={14} className="text-accent" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">뉴스 관심 태그</CardTitle>
              <p className="text-xs text-white/40">선택한 태그의 뉴스만 피드에 표시됩니다</p>
            </div>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {NEWS_TAGS.filter((t) => t !== '전체').map((tag) => {
                const active = settings.newsTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-accent/20 text-accent border-accent/40'
                        : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {tag}
                    {active && <X size={10} />}
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-white/30">{settings.newsTags.length}개 태그 선택됨</p>
          </CardContent>
        </Card>

        {/* Red Flag 키워드 사전 */}
        <Card className="bg-bg-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-risk-red/15 flex items-center justify-center">
              <AlertTriangle size={14} className="text-risk-red" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">Red Flag 키워드 사전</CardTitle>
              <p className="text-xs text-white/40">Clause Finder 스크리닝에 사용되는 키워드 목록</p>
            </div>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent className="space-y-4">
            {/* 기본 키워드 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-risk-red flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-red inline-block" />
                RED — 기본 키워드
              </p>
              <div className="flex flex-wrap gap-1.5">
                {RED_FLAG_KEYWORDS.map((kw) => (
                  <Badge key={kw} className="text-[11px] bg-risk-red/10 text-risk-red border border-risk-red/20">{kw}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-risk-orange flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-risk-orange inline-block" />
                ORANGE — 기본 키워드
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ORANGE_FLAG_KEYWORDS.map((kw) => (
                  <Badge key={kw} className="text-[11px] bg-risk-orange/10 text-risk-orange border border-risk-orange/20">{kw}</Badge>
                ))}
              </div>
            </div>

            {/* 사용자 추가 키워드 */}
            {settings.customKeywords.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-white/60">사용자 추가 키워드</p>
                <div className="space-y-1.5">
                  {settings.customKeywords.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.level === 'red' ? 'bg-risk-red' : 'bg-risk-orange'}`} />
                      <span className="text-xs text-white font-medium flex-1">{entry.keyword}</span>
                      {entry.description && <span className="text-[11px] text-white/40 flex-1">{entry.description}</span>}
                      <button onClick={() => removeKeyword(i)} className="text-white/30 hover:text-white/70 transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 키워드 추가 폼 */}
            <div className="space-y-2 pt-1">
              <p className="text-xs text-white/40">새 키워드 추가</p>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="키워드"
                  className="bg-white/5 border-white/10 text-white text-xs h-8"
                  onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                />
                <select
                  value={newKeywordLevel}
                  onChange={(e) => setNewKeywordLevel(e.target.value as 'red' | 'orange')}
                  className="bg-white/5 border border-white/10 text-white text-xs rounded-md px-2 h-8"
                >
                  <option value="red">RED</option>
                  <option value="orange">ORANGE</option>
                </select>
              </div>
              <Input
                value={newKeywordDesc}
                onChange={(e) => setNewKeywordDesc(e.target.value)}
                placeholder="설명 (선택)"
                className="bg-white/5 border-white/10 text-white text-xs h-8"
              />
              <Button
                size="sm"
                onClick={addKeyword}
                disabled={!newKeyword.trim()}
                className="bg-accent hover:bg-accent/80 text-white gap-1.5 text-xs"
              >
                <Plus size={12} />
                추가
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card className="bg-bg-card border-white/10">
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-400/15 flex items-center justify-center">
              <Bell size={14} className="text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-white">알림 설정</CardTitle>
              <p className="text-xs text-white/40">수신할 알림 유형을 선택하세요</p>
            </div>
          </CardHeader>
          <Separator className="bg-white/10 mb-3" />
          <CardContent className="space-y-0">
            {([
              { key: 'newsRefresh' as const, label: '새 기사 알림', desc: '관심 태그에 새 기사가 등록되면 알림을 받습니다' },
              { key: 'redFlag' as const, label: 'Red Flag 감지', desc: 'Clause 스크리닝에서 RED 등급 조항 발견 시 알림' },
              { key: 'lawUpdate' as const, label: '법령 개정 알림', desc: '관심 주의 보험 법령 변경사항을 알려드립니다' },
            ]).map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-white font-medium">{label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                  </div>
                  <Switch
                    checked={settings.notifications[key]}
                    onCheckedChange={() => toggleNotification(key)}
                    className="data-[state=checked]:bg-accent"
                  />
                </div>
                {i < arr.length - 1 && <Separator className="bg-white/5" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: persist settings page state in localStorage"
```

---

## Task 7: News page — seed tag filter from saved settings

**Files:**
- Modify: `src/app/news/page.tsx`

- [ ] **Step 1: Replace the initial `selectedTag` state**

Find the line that initializes `selectedTag` (currently something like `useState<string>('전체')`).

Replace it with:

```ts
import { loadSettings } from '@/lib/user-settings'

// inside the component, replace the existing useState for selectedTag:
const [selectedTag, setSelectedTag] = useState<string>(() => {
  const saved = loadSettings()
  return saved.newsTags.length > 0 ? saved.newsTags[0] : '전체'
})
```

- [ ] **Step 2: Wrap all fetch calls in try/catch with toast**

Find every `fetch('/api/news` call (or `fetchNews`) in the component. Ensure each is wrapped:

```ts
try {
  const res = await fetch(`/api/news?tag=${encodeURIComponent(selectedTag)}`)
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: '뉴스를 불러오지 못했습니다' }))
    toast.error(error ?? '뉴스를 불러오지 못했습니다')
    return
  }
  const data = await res.json()
  // ... existing handling
} catch {
  toast.error('네트워크 오류가 발생했습니다')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/news/page.tsx
git commit -m "feat: seed news tag filter from saved settings"
```

---

## Task 8: Update next.config.mjs

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Replace the file**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  experimental: {
    serverExternalPackages: ['pdf-parse'],
  },
}

export default nextConfig
```

- [ ] **Step 2: Commit**

```bash
git add next.config.mjs
git commit -m "chore: configure next.config — image domains + serverExternalPackages"
```

---

## Task 9: Create vercel.json

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Create the file**

```json
{
  "functions": {
    "app/api/clause/scan/route.ts": { "maxDuration": 30 },
    "app/api/legal/query/route.ts": { "maxDuration": 30 }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add vercel.json with function timeout config"
```

---

## Task 10: Write README.md

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create the file**

```markdown
# US Expat Hub

미국 파견 주재원을 위한 보험 인텔리전스 플랫폼.

## 주요 기능

- **뉴스 피드** — 관심 태그 기반 보험 업계 뉴스 + Claude AI 인사이트
- **Clause Finder** — 특약 텍스트 업로드 → RED/ORANGE 리스크 조항 자동 탐지
- **법령 조회** — 미국 보험법령 키워드 검색 + AI 위반 여부 판단
- **설정** — 관심 태그·키워드 관리 (브라우저 localStorage 저장)

## 로컬 실행

### 1. 저장소 클론

\`\`\`bash
git clone https://github.com/kgw1082-sys/vibe-coding
cd vibe-coding
pnpm install
\`\`\`

### 2. 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 채웁니다:

\`\`\`env
# 필수
ANTHROPIC_API_KEY=sk-ant-...

# 선택 (없으면 해당 기능 비활성화)
NEWSAPI_KEY=...
CONGRESS_API_KEY=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
\`\`\`

| 키 | 발급처 |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `NEWSAPI_KEY` | [newsapi.org/register](https://newsapi.org/register) |
| `CONGRESS_API_KEY` | [api.congress.gov/sign-up](https://api.congress.gov/sign-up/) |
| `UPSTASH_REDIS_REST_URL` + `TOKEN` | [upstash.com](https://upstash.com/) — 무료 플랜 |

### 3. 개발 서버 시작

\`\`\`bash
pnpm dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## Vercel 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkgw1082-sys%2Fvibe-coding)

1. 위 버튼 클릭 → Vercel 로그인
2. **Environment Variables** 섹션에 위 환경변수 입력
3. **Deploy** 클릭

> `app/api/clause/scan` 및 `app/api/legal/query` 함수는 `vercel.json`에 의해 최대 30초 실행 시간이 허용됩니다.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and deployment guide"
```

---

## Task 11: Smoke test

- [ ] **Step 1: Run the dev server**

```bash
pnpm dev
```

- [ ] **Step 2: Check settings persistence**

1. http://localhost:3000/settings 접속
2. 태그 하나 클릭 → toast "설정이 저장되었습니다" 확인
3. 페이지 새로고침 → 태그 선택 상태 유지 확인
4. 키워드 추가 폼에 "arbitration" / RED / "중재조항" 입력 → 추가 버튼
5. 새로고침 → 추가된 키워드 표시 확인

- [ ] **Step 3: Check news page seeding**

1. 설정에서 태그 "Cyber Risk"만 선택
2. http://localhost:3000/news 접속 → 초기 필터가 "Cyber Risk"인지 확인

- [ ] **Step 4: Check API error handling**

1. `.env.local`에서 `NEWSAPI_KEY` 주석 처리
2. 뉴스 페이지 새로고침 → "뉴스 API 설정이 필요합니다" toast 확인
3. 복원 후 재확인

- [ ] **Step 5: Commit any fixes, then final check**

```bash
pnpm build
```

빌드 오류 없으면 완료.
