import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList } from 'lucide-react'
import type { MissingItem } from '@/types'

interface MissingCardProps {
  item: MissingItem
}

export default function MissingCard({ item }: MissingCardProps) {
  return (
    <Card className="border border-border-color bg-black/[0.03]">
      <CardContent className="pt-3 pb-3 flex items-start gap-3">
        <ClipboardList size={14} className="text-text-disabled mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-secondary">{item.keyword}</span>
            <span className="text-[10px] bg-black/[0.06] text-text-muted px-1.5 py-0.5 rounded font-medium">누락</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
