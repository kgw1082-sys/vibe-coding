import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { LawSearchResult } from '@/types'

interface LawResultCardProps {
  result: LawSearchResult
}

export default function LawResultCard({ result }: LawResultCardProps) {
  return (
    <Card className="bg-bg-card border-border-color">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm text-text-primary font-medium">{result.lawName}</CardTitle>
        <Badge className="text-xs bg-accent/20 text-accent border-0">{result.articleNumber}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary line-clamp-3">{result.content}</p>
      </CardContent>
    </Card>
  )
}
