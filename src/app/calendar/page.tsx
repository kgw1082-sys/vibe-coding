'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import Topbar from '@/components/layout/Topbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Plus, Trash2, Clock, X } from 'lucide-react'
import {
  loadEvents, addEvent, deleteEvent, updateEvent, toDateStr,
  type ScheduleEvent,
} from '@/lib/schedule'

const COLORS: { key: ScheduleEvent['color']; label: string; bg: string; dot: string }[] = [
  { key: 'orange', label: '주황',  bg: 'bg-accent/15 text-accent',          dot: 'bg-accent' },
  { key: 'blue',   label: '파랑',  bg: 'bg-blue-100 text-blue-700',          dot: 'bg-blue-500' },
  { key: 'green',  label: '초록',  bg: 'bg-emerald-100 text-emerald-700',    dot: 'bg-emerald-500' },
  { key: 'red',    label: '빨강',  bg: 'bg-risk-red/10 text-risk-red',       dot: 'bg-risk-red' },
]

function colorStyle(color?: ScheduleEvent['color']) {
  return COLORS.find((c) => c.key === color) ?? COLORS[0]
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface EventModal {
  open: boolean
  date: string
  editing: ScheduleEvent | null
}

const EMPTY_FORM = { title: '', time: '', description: '', color: 'orange' as ScheduleEvent['color'] }

export default function CalendarPage() {
  const today = toDateStr(new Date())
  const [current, setCurrent] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() })
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [modal, setModal] = useState<EventModal>({ open: false, date: today, editing: null })
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const refresh = useCallback(() => setEvents(loadEvents()), [])

  useEffect(() => { refresh() }, [refresh])

  const eventsOnDate = (date: string) => events.filter((e) => e.date === date)
  const selectedEvents = eventsOnDate(selectedDate).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))

  const prevMonth = () => setCurrent((c) => {
    const d = new Date(c.year, c.month - 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const nextMonth = () => setCurrent((c) => {
    const d = new Date(c.year, c.month + 1)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const openAdd = (date: string) => {
    setModal({ open: true, date, editing: null })
    setForm(EMPTY_FORM)
  }

  const openEdit = (event: ScheduleEvent) => {
    setModal({ open: true, date: event.date, editing: event })
    setForm({ title: event.title, time: event.time ?? '', description: event.description ?? '', color: event.color ?? 'orange' })
  }

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('일정 제목을 입력하세요.'); return }
    setSaving(true)
    try {
      if (modal.editing) {
        updateEvent({ ...modal.editing, ...form, title: form.title.trim() })
        toast.success('일정이 수정됐습니다.')
      } else {
        addEvent({ ...form, title: form.title.trim(), date: modal.date })
        toast.success('일정이 추가됐습니다.')
      }
      refresh()
      setModal((m) => ({ ...m, open: false }))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    deleteEvent(id)
    refresh()
    toast.success('일정이 삭제됐습니다.')
  }

  // build calendar grid
  const daysInMonth = getDaysInMonth(current.year, current.month)
  const firstDay = getFirstDayOfWeek(current.year, current.month)
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <>
      <Topbar title="캘린더" description="일정 관리" />
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 max-w-5xl">

          {/* ── 캘린더 ── */}
          <div>
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-black/[0.06] transition-colors">
                <ChevronLeft size={18} className="text-text-secondary" />
              </button>
              <h2 className="text-base font-bold text-text-primary">
                {current.year}년 {current.month + 1}월
              </h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-black/[0.06] transition-colors">
                <ChevronRight size={18} className="text-text-secondary" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map((d, i) => (
                <div key={d} className={`text-center text-xs font-semibold py-2 ${i === 0 ? 'text-risk-red' : i === 6 ? 'text-blue-500' : 'text-text-muted'}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} />
                const dateStr = `${current.year}-${String(current.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayEvents = eventsOnDate(dateStr)
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDate
                const isSun = idx % 7 === 0
                const isSat = idx % 7 === 6

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative min-h-[56px] p-1.5 rounded-lg text-left transition-colors border ${
                      isSelected
                        ? 'bg-accent/10 border-accent/40'
                        : isToday
                        ? 'bg-accent/5 border-accent/20'
                        : 'border-transparent hover:bg-black/[0.04]'
                    }`}
                  >
                    <span className={`text-xs font-semibold block mb-1 ${
                      isToday ? 'w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center text-[10px]' :
                      isSun ? 'text-risk-red' : isSat ? 'text-blue-500' : 'text-text-primary'
                    }`}>
                      {isToday ? (
                        <span className="w-5 h-5 bg-accent text-white rounded-full inline-flex items-center justify-center text-[10px] font-bold">{day}</span>
                      ) : day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <div key={e.id} className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${colorStyle(e.color).bg}`}>
                          {e.time && <span className="opacity-70">{e.time} </span>}{e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-text-disabled px-1">+{dayEvents.length - 2}개</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── 선택 날짜 일정 ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </h3>
              <Button size="sm" onClick={() => openAdd(selectedDate)}
                className="h-7 text-xs gap-1 bg-accent hover:bg-accent-hover text-white">
                <Plus size={12} /> 추가
              </Button>
            </div>

            {selectedEvents.length === 0 ? (
              <Card className="bg-bg-card border-border-color">
                <CardContent className="py-8 flex flex-col items-center gap-2 text-text-disabled">
                  <Clock size={24} className="opacity-40" />
                  <p className="text-sm">등록된 일정이 없습니다</p>
                  <button onClick={() => openAdd(selectedDate)} className="text-xs text-accent hover:underline">
                    + 일정 추가하기
                  </button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((event) => {
                  const cs = colorStyle(event.color)
                  return (
                    <Card key={event.id} className="bg-bg-card border-border-color">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start gap-3">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cs.dot}`} />
                          <div className="flex-1 min-w-0">
                            {event.time && (
                              <p className="text-[11px] text-text-muted font-medium mb-0.5">{event.time}</p>
                            )}
                            <p className="text-sm font-semibold text-text-primary">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => openEdit(event)}
                              className="text-text-disabled hover:text-text-primary transition-colors p-1 rounded">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button onClick={() => handleDelete(event.id)}
                              className="text-text-disabled hover:text-risk-red transition-colors p-1 rounded">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 일정 추가/편집 모달 ── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface rounded-2xl border border-border-color shadow-lg w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-color">
              <h3 className="font-semibold text-text-primary text-sm">
                {modal.editing ? '일정 수정' : '일정 추가'}
              </h3>
              <button onClick={() => setModal((m) => ({ ...m, open: false }))}
                className="text-text-disabled hover:text-text-primary transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">날짜</p>
                <Input type="date" value={modal.date}
                  onChange={(e) => setModal((m) => ({ ...m, date: e.target.value }))}
                  className="bg-bg-base border-border-color text-text-primary text-sm" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">제목 *</p>
                <Input placeholder="일정 제목" value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="bg-bg-base border-border-color text-text-primary text-sm" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">시간</p>
                <Input type="time" value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="bg-bg-base border-border-color text-text-primary text-sm" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-1">메모</p>
                <Input placeholder="간단한 메모 (선택)" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="bg-bg-base border-border-color text-text-primary text-sm" />
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary mb-2">색상</p>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button key={c.key} onClick={() => setForm((f) => ({ ...f, color: c.key }))}
                      className={`w-6 h-6 rounded-full ${c.dot} transition-transform ${form.color === c.key ? 'scale-125 ring-2 ring-offset-1 ring-current' : ''}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setModal((m) => ({ ...m, open: false }))}
                  className="flex-1 border-border-color text-text-secondary hover:text-text-primary text-sm">
                  취소
                </Button>
                <Button onClick={handleSave} disabled={saving || !form.title.trim()}
                  className="flex-1 bg-accent hover:bg-accent-hover text-white text-sm">
                  {modal.editing ? '수정' : '추가'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
