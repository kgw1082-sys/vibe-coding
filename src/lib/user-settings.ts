// src/lib/user-settings.ts
const STORAGE_KEY = 'hanwha-global:settings'

export interface KeywordEntry {
  keyword: string
  level: 'red' | 'orange'
  description: string
}

export type CountryCode = 'US' | 'GB' | 'DE' | 'SG' | 'JP' | 'CN' | 'AE' | 'FR'

export const COUNTRIES: { code: CountryCode; flag: string; name: string; currency: string }[] = [
  { code: 'US', flag: '🇺🇸', name: '미국',      currency: 'USD' },
  { code: 'GB', flag: '🇬🇧', name: '영국',      currency: 'GBP' },
  { code: 'DE', flag: '🇩🇪', name: '독일',      currency: 'EUR' },
  { code: 'SG', flag: '🇸🇬', name: '싱가포르',  currency: 'SGD' },
  { code: 'JP', flag: '🇯🇵', name: '일본',      currency: 'JPY' },
  { code: 'CN', flag: '🇨🇳', name: '중국',      currency: 'CNY' },
  { code: 'AE', flag: '🇦🇪', name: 'UAE',       currency: 'AED' },
  { code: 'FR', flag: '🇫🇷', name: '프랑스',    currency: 'EUR' },
]

export interface UserSettings {
  newsTags: string[]
  customKeywords: KeywordEntry[]
  notifications: {
    newsRefresh: boolean
    redFlag: boolean
    lawUpdate: boolean
  }
  countryCode?: CountryCode
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
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      notifications: { ...DEFAULT_SETTINGS.notifications, ...(parsed?.notifications ?? {}) },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    console.error('Failed to save settings to localStorage')
  }
}
