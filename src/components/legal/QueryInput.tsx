'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import AnswerBox from './AnswerBox'
import type { LegalAnswer } from '@/types'

export default function QueryInput() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<LegalAnswer | null>(null)
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/legal/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await res.json()
      setAnswer(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a legal question, e.g. 'Do I need to file FBAR if I have accounts in Korea?'"
        className="min-h-28 bg-bg-card border-border-color text-text-primary placeholder:text-text-disabled focus:border-accent"
      />
      <Button onClick={ask} disabled={loading || !question.trim()} className="bg-accent hover:bg-accent/80 text-white">
        {loading ? 'Researching...' : 'Get Legal Answer'}
      </Button>
      {answer && <AnswerBox answer={answer} />}
    </div>
  )
}
