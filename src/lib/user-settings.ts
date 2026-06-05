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
