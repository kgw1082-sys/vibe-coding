import type { NewsArticle, FlagItem, LawSearchResult } from '@/types'

export const NEWS_TAGS = ['전체', 'P&C Insurance', 'Reinsurance', 'Insurtech', 'Surety', 'Cyber Risk', 'Nat CAT']

export const MOCK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'Florida Property Insurance Market Faces Another Crisis as Reinsurance Costs Surge',
    description: 'Reinsurers are significantly increasing rates for Florida property coverage following back-to-back hurricane seasons, leaving residents with fewer coverage options.',
    url: '#',
    publishedAt: '2026-06-04T10:30:00Z',
    source: 'Insurance Journal',
    tags: ['P&C Insurance', 'Reinsurance', 'Nat CAT'],
  },
  {
    id: '2',
    title: 'Cyber Insurance Premiums Stabilize After Three Years of Double-Digit Increases',
    description: 'After years of rapid premium growth driven by ransomware claims, the cyber insurance market is showing signs of stabilization as carriers improve risk selection.',
    url: '#',
    publishedAt: '2026-06-03T14:00:00Z',
    source: 'Risk & Insurance',
    tags: ['Cyber Risk'],
  },
  {
    id: '3',
    title: 'Insurtech Startups Raise $2.1B in Q1 2026 Amid Market Consolidation',
    description: 'Venture capital continues to flow into insurance technology despite broader tech market headwinds, with embedded insurance and AI underwriting leading the charge.',
    url: '#',
    publishedAt: '2026-06-02T09:15:00Z',
    source: 'InsurTech News',
    tags: ['Insurtech'],
  },
  {
    id: '4',
    title: 'Construction Surety Bond Demand Surges with Infrastructure Bill Projects',
    description: 'Federal infrastructure spending has driven unprecedented demand for performance and payment bonds, straining surety capacity in key markets.',
    url: '#',
    publishedAt: '2026-06-01T11:00:00Z',
    source: 'Surety & Fidelity Association',
    tags: ['Surety'],
  },
  {
    id: '5',
    title: 'Global Reinsurance Capacity Tightens Ahead of Atlantic Hurricane Season',
    description: 'Major reinsurers are reducing aggregate exposure in peak catastrophe zones as climate-driven volatility shows no signs of abating.',
    url: '#',
    publishedAt: '2026-05-31T16:45:00Z',
    source: 'Reuters Insurance',
    tags: ['Reinsurance', 'Nat CAT'],
  },
  {
    id: '6',
    title: 'AI-Powered Underwriting Tools Gain Traction in Commercial Lines',
    description: 'Insurance carriers are deploying machine learning models to improve risk selection accuracy, with early adopters reporting loss ratios improving by 3–5 points.',
    url: '#',
    publishedAt: '2026-05-30T08:30:00Z',
    source: 'Digital Insurance',
    tags: ['Insurtech', 'P&C Insurance'],
  },
]

export const MOCK_RECENT_NEWS = MOCK_NEWS_ARTICLES.slice(0, 4)

export type FlagItemWithMeta = FlagItem & { clauseTitle: string }

export const MOCK_RECENT_FLAGS: FlagItemWithMeta[] = [
  {
    keyword: 'Nuclear',
    level: 'RED',
    context: '...including but not limited to Nuclear reaction, radiation or contamination...',
    position: 142,
    clauseTitle: 'Commercial General Liability Policy',
  },
  {
    keyword: 'Absolute Exclusion',
    level: 'RED',
    context: '...this Absolute Exclusion applies regardless of any other provision...',
    position: 88,
    clauseTitle: 'Property All Risk Policy',
  },
  {
    keyword: 'Jurisdiction',
    level: 'ORANGE',
    context: '...exclusive Jurisdiction of the courts of the State of Delaware...',
    position: 215,
    clauseTitle: "Directors & Officers Policy",
  },
  {
    keyword: 'Notice of Loss',
    level: 'ORANGE',
    context: '...written Notice of Loss must be provided within 30 days...',
    position: 301,
    clauseTitle: 'Marine Cargo Policy',
  },
]

export const MOCK_LAW_RESULTS: LawSearchResult[] = [
  {
    lawName: 'California Insurance Code',
    articleNumber: '§ 10113.72',
    content:
      'Every individual life insurance policy issued or delivered in this state shall contain a provision for a grace period of not less than 60 days from the date a premium payment is due.',
    relevanceScore: 0.93,
  },
  {
    lawName: 'New York Insurance Law',
    articleNumber: '§ 3425',
    content:
      'No insurer shall cancel or refuse to renew a policy of motor vehicle liability insurance except upon the grounds and procedures set forth in this section, with written notice no less than 30 days prior.',
    relevanceScore: 0.87,
  },
]

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
]

export const LEGAL_CATEGORIES = [
  '생명보험', '손해보험', '책임보험', '자동차보험', '해상보험',
  '재보험', '보증보험', '건강보험', '세금 / FBAR', '비자 / 이민',
]
