'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { GlossaryEntry, GlossaryCategory, GLOSSARY_SEED } from '@/lib/glossary-seed'
import Topbar from '@/components/layout/Topbar'

const CATEGORIES = ['전체', 'P&C', 'Life', 'Reinsurance', 'Legal', 'General'] as const

type AutocompleteItem = { id: string; term: string; koreanName: string }

export default function GlossaryPage() {
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [selected, setSelected] = useState<GlossaryEntry | null>(null)
  const [category, setCategory] = useState<string>('전체')
  const [search, setSearch] = useState<string>('')
  const [autocomplete, setAutocomplete] = useState<AutocompleteItem[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [modalEntry, setModalEntry] = useState<Partial<GlossaryEntry>>({})
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit state
  const [editDefinition, setEditDefinition] = useState('')
  const [editExample, setEditExample] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/glossary')
      .then(r => r.json())
      .then(setEntries)
      .catch(() => setEntries(GLOSSARY_SEED))
  }, [])

  const filtered = entries.filter(e => {
    const matchCat = category === '전체' || e.category === category
    const matchSearch =
      !search ||
      e.term.toLowerCase().includes(search.toLowerCase()) ||
      e.koreanName.includes(search)
    return matchCat && matchSearch
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setAutocomplete([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/glossary?q=${encodeURIComponent(value)}&autocomplete=true`)
        const data = await res.json()
        setAutocomplete(data)
      } catch {
        setAutocomplete([])
      }
    }, 300)
  }, [])

  const handleAutocompleteSelect = (item: AutocompleteItem) => {
    setSearch(item.term)
    setAutocomplete([])
    const found = entries.find(e => e.id === item.id)
    if (found) setSelected(found)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setAutocomplete([])
    }
  }

  const startEdit = () => {
    if (!selected) return
    setEditDefinition(selected.definition)
    setEditExample(selected.example)
    setEditing(true)
  }

  const cancelEdit = () => setEditing(false)

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true)
    const updated: GlossaryEntry = {
      ...selected,
      definition: editDefinition,
      example: editExample,
      updatedAt: new Date().toISOString(),
    }
    try {
      let saved: GlossaryEntry
      if (selected.isCustom) {
        const res = await fetch(`/api/glossary/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: updated }),
        })
        saved = await res.json()
      } else {
        const res = await fetch('/api/glossary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: { ...updated, isCustom: true } }),
        })
        saved = await res.json()
      }
      setEntries(prev => {
        const idx = prev.findIndex(e => e.id === selected.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = saved
          return next
        }
        return [...prev, saved]
      })
      setSelected(saved)
      setEditing(false)
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleAIRegenerate = async () => {
    if (!selected) return
    setGenerating(true)
    try {
      const res = await fetch('/api/glossary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: selected.term }),
      })
      const data: Partial<GlossaryEntry> = await res.json()
      const updated: GlossaryEntry = {
        ...selected,
        definition: data.definition ?? selected.definition,
        example: data.example ?? selected.example,
        relatedTerms: data.relatedTerms ?? selected.relatedTerms,
        updatedAt: new Date().toISOString(),
      }
      // Auto-save
      let saved: GlossaryEntry
      if (selected.isCustom) {
        const putRes = await fetch(`/api/glossary/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: updated }),
        })
        saved = await putRes.json()
      } else {
        const postRes = await fetch('/api/glossary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry: { ...updated, isCustom: true } }),
        })
        saved = await postRes.json()
      }
      setEntries(prev => {
        const idx = prev.findIndex(e => e.id === selected.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = saved
          return next
        }
        return [...prev, saved]
      })
      setSelected(saved)
      toast.success('AI 재생성 완료되었습니다.')
    } catch {
      toast.error('AI 재생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!selected.isCustom) {
      toast.error('기본 용어는 삭제할 수 없습니다. AI로 재생성하거나 편집하세요.')
      return
    }
    if (!window.confirm(`"${selected.term}" 용어를 삭제하시겠습니까?`)) return
    try {
      await fetch(`/api/glossary/${selected.id}`, { method: 'DELETE' })
      setEntries(prev => prev.filter(e => e.id !== selected.id))
      setSelected(null)
      toast.success('삭제되었습니다.')
    } catch {
      toast.error('삭제에 실패했습니다.')
    }
  }

  const handleRelatedTermClick = (term: string) => {
    const found = entries.find(e => e.term.toLowerCase() === term.toLowerCase())
    if (found) {
      setSelected(found)
      setEditing(false)
    }
  }

  // Modal handlers
  const openModal = () => {
    setModalEntry({ category: 'General', relatedTerms: [] })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalEntry({})
  }

  const handleModalAIGenerate = async () => {
    if (!modalEntry.term) return
    setGenerating(true)
    try {
      const res = await fetch('/api/glossary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: modalEntry.term }),
      })
      const data: Partial<GlossaryEntry> = await res.json()
      setModalEntry(prev => ({
        ...prev,
        koreanName: data.koreanName ?? prev.koreanName,
        definition: data.definition ?? prev.definition,
        example: data.example ?? prev.example,
        relatedTerms: data.relatedTerms ?? prev.relatedTerms,
        category: data.category ?? prev.category,
      }))
    } catch {
      toast.error('AI 생성에 실패했습니다.')
    } finally {
      setGenerating(false)
    }
  }

  const handleModalSave = async () => {
    if (!modalEntry.term) {
      toast.error('영문 용어를 입력해주세요.')
      return
    }
    setSaving(true)
    const entry: GlossaryEntry = {
      id: modalEntry.term.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      term: modalEntry.term ?? '',
      koreanName: modalEntry.koreanName ?? '',
      definition: modalEntry.definition ?? '',
      example: modalEntry.example ?? '',
      relatedTerms: modalEntry.relatedTerms ?? [],
      category: (modalEntry.category as GlossaryCategory) ?? 'General',
      isCustom: true,
      updatedAt: new Date().toISOString(),
    }
    try {
      const res = await fetch('/api/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      })
      const saved: GlossaryEntry = await res.json()
      setEntries(prev => [...prev, saved])
      setSelected(saved)
      closeModal()
      toast.success('용어가 추가되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const relatedTermsString = (modalEntry.relatedTerms ?? []).join(', ')

  return (
    <div className="flex flex-col h-screen bg-bg-base">
      <Topbar title="보험 용어 사전" description="보험 전문 용어를 검색하고 관리하세요" />

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[280px_1fr]">
        {/* Left Panel */}
        <div className="flex flex-col border-r border-border-color bg-bg-card overflow-hidden">
          {/* Search + Add Button */}
          <div className="p-3 space-y-2 border-b border-border-color">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="용어 검색..."
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="bg-bg-surface text-text-primary placeholder:text-text-disabled text-sm"
                />
                {autocomplete.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-bg-surface border border-border-color rounded-lg shadow-md overflow-hidden">
                    {autocomplete.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAutocompleteSelect(item)}
                        className="w-full text-left px-3 py-2 hover:bg-bg-card text-sm text-text-primary"
                      >
                        <span className="font-medium">{item.term}</span>
                        <span className="ml-2 text-xs text-text-muted">{item.koreanName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={openModal}
                className="bg-accent hover:bg-accent/90 text-white text-xs whitespace-nowrap"
              >
                + 용어 추가
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="px-3 py-2 border-b border-border-color overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={
                    category === cat
                      ? 'bg-accent text-white rounded-full px-3 py-1 text-xs font-medium'
                      : 'text-text-muted text-xs px-3 py-1 hover:text-text-primary rounded-full transition-colors'
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Term List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-text-disabled text-sm">검색 결과가 없습니다.</div>
            ) : (
              filtered.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => { setSelected(entry); setEditing(false) }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selected?.id === entry.id
                      ? 'bg-accent/10 border-accent/30'
                      : 'bg-bg-surface border-border-color hover:border-accent/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-primary">{entry.term}</span>
                    {entry.isCustom && (
                      <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                        사용자
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text-muted">{entry.koreanName}</span>
                  <div className="mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/[0.06] text-text-disabled">
                      {entry.category}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col bg-bg-base overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-disabled">
              <div className="text-5xl mb-4">📖</div>
              <p className="text-base">용어를 선택하세요</p>
              <p className="text-sm mt-1">왼쪽 목록에서 용어를 클릭하면 상세 정보가 표시됩니다.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">{selected.term}</h1>
                  <p className="text-text-muted mt-1">{selected.koreanName}</p>
                </div>
                <Badge className="bg-bg-card text-text-secondary border border-border-color">
                  {selected.category}
                </Badge>
              </div>

              <Separator className="border-border-color" />

              {/* Definition */}
              <div>
                <h2 className="text-sm font-semibold text-text-secondary mb-2">설명</h2>
                {editing ? (
                  <Textarea
                    value={editDefinition}
                    onChange={e => setEditDefinition(e.target.value)}
                    className="min-h-[100px] bg-bg-surface text-text-primary text-sm"
                  />
                ) : (
                  <p className="text-sm text-text-primary leading-relaxed">{selected.definition}</p>
                )}
              </div>

              <Separator className="border-border-color" />

              {/* Example */}
              <div>
                <h2 className="text-sm font-semibold text-text-secondary mb-2">영문 예문</h2>
                {editing ? (
                  <Textarea
                    value={editExample}
                    onChange={e => setEditExample(e.target.value)}
                    className="min-h-[80px] bg-bg-surface text-text-primary text-sm"
                  />
                ) : (
                  <blockquote className="border-l-4 border-accent bg-accent/5 p-4 rounded text-sm italic text-text-primary leading-relaxed">
                    {selected.example}
                  </blockquote>
                )}
              </div>

              {/* Related Terms */}
              {selected.relatedTerms.length > 0 && (
                <>
                  <Separator className="border-border-color" />
                  <div>
                    <h2 className="text-sm font-semibold text-text-secondary mb-2">관련 용어</h2>
                    <div className="flex flex-wrap gap-2">
                      {selected.relatedTerms.map(term => (
                        <button
                          key={term}
                          onClick={() => handleRelatedTermClick(term)}
                          className="text-xs px-2.5 py-1 rounded-full bg-bg-card border border-border-color text-text-primary hover:border-accent/40 hover:text-accent transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator className="border-border-color" />

              {/* Action Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                {editing ? (
                  <>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                      disabled={saving}
                      className="bg-accent hover:bg-accent/90 text-white"
                    >
                      {saving ? '저장 중...' : '저장'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      className="border-border-color text-text-secondary"
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEdit}
                      className="border-border-color text-text-secondary hover:text-text-primary"
                    >
                      ✏️ 편집
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAIRegenerate}
                      disabled={generating}
                      className="border-border-color text-text-secondary hover:text-text-primary"
                    >
                      {generating ? '⏳ 생성 중...' : '🤖 AI 재생성'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDelete}
                      className="border-border-color text-red-500 hover:text-red-600 hover:border-red-300"
                    >
                      🗑️ 삭제
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Term Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-bg-surface rounded-xl border border-border-color shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border-color">
              <h2 className="text-base font-semibold text-text-primary">용어 추가</h2>
              <button
                onClick={closeModal}
                className="text-text-muted hover:text-text-primary text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Term */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">영문 용어 *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Subrogation"
                    value={modalEntry.term ?? ''}
                    onChange={e => setModalEntry(prev => ({ ...prev, term: e.target.value }))}
                    className="flex-1 bg-bg-base text-text-primary text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleModalAIGenerate}
                    disabled={generating || !modalEntry.term}
                    className="text-accent hover:bg-accent/10 text-xs whitespace-nowrap"
                  >
                    {generating ? (
                      <span className="inline-block w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin mr-1" />
                    ) : '🤖'} AI로 자동 생성
                  </Button>
                </div>
              </div>

              {/* Korean name */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">한국어 명칭</label>
                <Input
                  placeholder="e.g. 대위권"
                  value={modalEntry.koreanName ?? ''}
                  onChange={e => setModalEntry(prev => ({ ...prev, koreanName: e.target.value }))}
                  className="bg-bg-base text-text-primary text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">카테고리</label>
                <select
                  value={modalEntry.category ?? 'General'}
                  onChange={e => setModalEntry(prev => ({ ...prev, category: e.target.value as GlossaryCategory }))}
                  className="w-full h-9 rounded-md border border-border-color bg-bg-base px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {(['P&C', 'Life', 'Reinsurance', 'Legal', 'General'] as GlossaryCategory[]).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Definition */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">설명</label>
                <Textarea
                  placeholder="용어 설명을 입력하세요..."
                  value={modalEntry.definition ?? ''}
                  onChange={e => setModalEntry(prev => ({ ...prev, definition: e.target.value }))}
                  className="h-24 bg-bg-base text-text-primary text-sm"
                />
              </div>

              {/* Example */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">영문 예문</label>
                <Textarea
                  placeholder="English example sentence..."
                  value={modalEntry.example ?? ''}
                  onChange={e => setModalEntry(prev => ({ ...prev, example: e.target.value }))}
                  className="h-20 bg-bg-base text-text-primary text-sm"
                />
              </div>

              {/* Related Terms */}
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1 block">관련 용어 (쉼표로 구분)</label>
                <Input
                  placeholder="e.g. Indemnity, Liability"
                  value={relatedTermsString}
                  onChange={e =>
                    setModalEntry(prev => ({
                      ...prev,
                      relatedTerms: e.target.value.split(',').map(t => t.trim()).filter(Boolean),
                    }))
                  }
                  className="bg-bg-base text-text-primary text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border-color">
              <Button
                size="sm"
                variant="outline"
                onClick={closeModal}
                className="border-border-color text-text-secondary"
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={handleModalSave}
                disabled={saving}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
