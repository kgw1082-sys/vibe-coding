const STORAGE_KEY = 'hanwha-global:schedule'

export interface ScheduleEvent {
  id: string
  title: string
  date: string   // YYYY-MM-DD
  time?: string  // HH:MM
  description?: string
  color?: 'orange' | 'blue' | 'green' | 'red'
}

export function loadEvents(): ScheduleEvent[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveEvents(events: ScheduleEvent[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
}

export function getEventsForDate(date: string): ScheduleEvent[] {
  return loadEvents()
    .filter((e) => e.date === date)
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
}

export function addEvent(event: Omit<ScheduleEvent, 'id'>): ScheduleEvent {
  const newEvent = { ...event, id: crypto.randomUUID() }
  saveEvents([...loadEvents(), newEvent])
  return newEvent
}

export function deleteEvent(id: string): void {
  saveEvents(loadEvents().filter((e) => e.id !== id))
}

export function updateEvent(updated: ScheduleEvent): void {
  saveEvents(loadEvents().map((e) => (e.id === updated.id ? updated : e)))
}

export function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10)
}
