'use client'

import { Badge } from '@/components/ui/badge'

const ALL_TAGS = ['Tax', 'Insurance', 'Visa', 'Social Security', 'Healthcare', 'Legal', 'IRS', 'FBAR', 'FATCA']

interface TagFilterProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export default function TagFilter({ selected, onChange }: TagFilterProps) {
  const toggle = (tag: string) => {
    onChange(
      selected.includes(tag) ? selected.filter((t) => t !== tag) : [...selected, tag]
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_TAGS.map((tag) => (
        <Badge
          key={tag}
          onClick={() => toggle(tag)}
          className={`cursor-pointer border text-xs transition-colors ${
            selected.includes(tag)
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-black/[0.04] text-text-secondary border-border-color hover:border-border-color'
          }`}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
