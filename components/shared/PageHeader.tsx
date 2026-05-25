export default function PageHeader({ title, description, children }: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-primary/60" />
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">{children}</div>
      )}
    </div>
  )
}