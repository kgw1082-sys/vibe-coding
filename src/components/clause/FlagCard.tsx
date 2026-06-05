import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, Lightbulb } from 'lucide-react'
import type { FlagItem } from '@/types'

interface FlagCardProps {
  flag: FlagItem
}

export default function FlagCard({ flag }: FlagCardProps) {
  const isRed = flag.level === 'RED'

  return (
    <Card className={`border ${isRed ? 'border-risk-red/40 bg-risk-red/5' : 'border-risk-orange/40 bg-risk-orange/5'}`}>
      <CardContent className="pt-3 pb-3 flex items-start gap-3">
        {isRed ? (
          <AlertTriangle size={15} className="text-risk-red mt-0.5 flex-shrink-0" />
        ) : (
          <AlertCircle size={15} className="text-risk-orange mt-0.5 flex-shrink-0" />
        )}
        <div className="space-y-1.5 min-w-0 w-full">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-white">{flag.keyword}</span>
            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${isRed ? 'bg-risk-red/20 text-risk-red' : 'bg-risk-orange/20 text-risk-orange'}`}>
              {flag.level}
            </Badge>
          </div>
          <p className="text-xs text-white/50 break-words leading-relaxed">
            &ldquo;{flag.context}&rdquo;
          </p>
          {flag.guidance && (
            <div className="flex items-start gap-1.5 pt-1 border-t border-white/10">
              <Lightbulb size={12} className="text-accent flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/60 leading-relaxed">
                <span className="font-medium text-accent">언더라이팅 가이던스: </span>
                {flag.guidance}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
