const statusConfig: Record<string, { bg: string; text: string; border: string; dotColor: string; glow: string }> = {
  Disponible: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/30',
    dotColor: 'hsl(150 65% 42%)',
    glow: 'hsl(150 65% 42% / 0.6)',
  },
  Vendida: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
    dotColor: 'hsl(0 72% 55%)',
    glow: 'hsl(0 72% 55% / 0.6)',
  },
  Apartada: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/30',
    dotColor: 'hsl(35 92% 52%)',
    glow: 'hsl(35 92% 52% / 0.6)',
  },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.Disponible
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: config.dotColor, boxShadow: `0 0 6px ${config.glow}` }}
      />
      {status}
    </span>
  )
}