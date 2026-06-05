interface TopbarProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, description, actions }: TopbarProps) {
  return (
    <header className="h-14 border-b border-border-color bg-bg-surface px-6 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-text-primary">{title}</h1>
        {description && (
          <p className="text-xs text-text-secondary leading-tight">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </header>
  )
}
