import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { NewsArticle } from '@/types'

interface NewsCardProps {
  article: NewsArticle
}

export default function NewsCard({ article }: NewsCardProps) {
  return (
    <Card className="bg-bg-card border-white/10 hover:border-accent/30 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-white leading-snug">
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            {article.title}
          </a>
        </CardTitle>
        <p className="text-xs text-white/40">
          {article.source} · {new Date(article.publishedAt).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {article.description && (
          <p className="text-sm text-white/60 line-clamp-2">{article.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {article.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs bg-white/5 text-white/60 border-0">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
