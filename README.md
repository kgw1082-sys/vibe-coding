# US Expat Hub

미국 파견 주재원을 위한 보험 인텔리전스 플랫폼.

## 주요 기능

- **뉴스 피드** — 관심 태그 기반 보험 업계 뉴스 + Claude AI 인사이트
- **Clause Finder** — 특약 텍스트 업로드 → RED/ORANGE 리스크 조항 자동 탐지
- **법령 조회** — 미국 보험법령 키워드 검색 + AI 위반 여부 판단
- **설정** — 관심 태그·키워드 관리 (브라우저 localStorage 저장)

## 로컬 실행

### 1. 저장소 클론

```bash
git clone https://github.com/kgw1082-sys/vibe-coding
cd vibe-coding
pnpm install
```

### 2. 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 아래 값을 채웁니다:

```env
# 필수
ANTHROPIC_API_KEY=sk-ant-...

# 선택 (없으면 해당 기능 비활성화)
NEWSAPI_KEY=...
CONGRESS_API_KEY=...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

| 키 | 발급처 |
|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| `NEWSAPI_KEY` | [newsapi.org/register](https://newsapi.org/register) |
| `CONGRESS_API_KEY` | [api.congress.gov/sign-up](https://api.congress.gov/sign-up/) |
| `UPSTASH_REDIS_REST_URL` + `TOKEN` | [upstash.com](https://upstash.com/) — 무료 플랜 |

### 3. 개발 서버 시작

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

## Vercel 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkgw1082-sys%2Fvibe-coding)

1. 위 버튼 클릭 → Vercel 로그인
2. **Environment Variables** 섹션에 위 환경변수 입력
3. **Deploy** 클릭

> `app/api/clause/scan` 및 `app/api/legal/query` 함수는 `vercel.json`에 의해 최대 30초 실행 시간이 허용됩니다.
