import { Upload } from 'lucide-react'

interface TextViewerProps {
  text: string
  highlights?: { keyword: string; level: 'RED' | 'ORANGE' }[]
}

function buildHighlightedHtml(
  raw: string,
  highlights: { keyword: string; level: 'RED' | 'ORANGE' }[],
): string {
  // HTML-escape first to prevent XSS
  let html = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Sort longest keyword first to avoid partial replacements
  const sorted = [...highlights].sort((a, b) => b.keyword.length - a.keyword.length)
  const applied = new Set<string>()

  for (const { keyword, level } of sorted) {
    const lower = keyword.toLowerCase()
    if (applied.has(lower)) continue
    applied.add(lower)

    const color  = level === 'RED' ? '#e05252' : '#e08a2f'
    const bg     = level === 'RED' ? 'rgba(224,82,82,0.18)' : 'rgba(224,138,47,0.18)'
    const border = level === 'RED' ? '#e05252' : '#e08a2f'
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    html = html.replace(
      new RegExp(escaped, 'gi'),
      `<mark style="color:${color};background:${bg};padding:1px 3px;border-radius:3px;border-bottom:2px solid ${border};font-weight:600;">$&</mark>`,
    )
  }

  return html
}

export default function TextViewer({ text, highlights = [] }: TextViewerProps) {
  if (!text) {
    return (
      <div className="flex flex-col items-center justify-center min-h-56 text-center gap-3 bg-bg-card rounded-xl border border-border-color p-6">
        <div className="w-12 h-12 rounded-xl bg-black/[0.04] flex items-center justify-center">
          <Upload size={22} className="text-text-disabled" />
        </div>
        <div>
          <p className="text-sm text-text-secondary font-medium">분석할 특약이 없습니다</p>
          <p className="text-xs text-text-disabled mt-1">
            텍스트를 입력하거나 PDF / DOCX 파일을 업로드하면<br />
            원문이 이곳에 하이라이트와 함께 표시됩니다
          </p>
        </div>
      </div>
    )
  }

  const html = highlights.length > 0 ? buildHighlightedHtml(text, highlights) : text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return (
    <pre
      className="text-sm text-text-secondary whitespace-pre-wrap bg-bg-card rounded-xl border border-border-color p-5 leading-relaxed overflow-y-auto max-h-[480px]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
