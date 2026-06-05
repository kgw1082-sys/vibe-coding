import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LegalAnswer } from '@/types'

interface AnswerBoxProps {
  answer: LegalAnswer
}

const confidenceColor: Record<string, string> = {
  HIGH: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-risk-orange/20 text-risk-orange',
  LOW: 'bg-risk-red/20 text-risk-red',
}

export default function AnswerBox({ answer }: AnswerBoxProps) {
  return (
    <Card className="bg-bg-card border-white/10">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <CardTitle className="text-sm text-white/60 font-normal">{answer.question}</CardTitle>
        <Badge className={`text-xs border-0 flex-shrink-0 ${confidenceColor[answer.confidence]}`}>
          {answer.confidence}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-white leading-relaxed">{answer.answer}</p>
        {answer.sources.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/10">
            <p className="text-xs text-white/40 font-medium">Sources</p>
            {answer.sources.map((src, i) => (
              <div key={i} className="text-xs text-white/50">
                <span className="text-accent">{src.title}</span>
                {src.excerpt && <span className="ml-1">— {src.excerpt}</span>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
