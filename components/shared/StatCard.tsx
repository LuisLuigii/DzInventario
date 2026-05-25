import type { LucideIcon } from 'lucide-react'

const colorMap: Record<string, { icon: string; cssClass: string }> = {
  primary:     { icon: 'bg-primary/15 text-primary',        cssClass: 'stat-card' },
  success:     { icon: 'bg-success/15 text-success',        cssClass: 'stat-card stat-card-success' },
  destructive: { icon: 'bg-destructive/15 text-destructive', cssClass: 'stat-card stat-card-destructive' },
  warning:     { icon: 'bg-warning/15 text-warning',        cssClass: 'stat-card stat-card-warning' },
}

export default function StatCard({ title, value, icon: Icon, color = 'primary', subtitle }: {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  subtitle?: string
}) {
  const cfg = colorMap[color] || colorMap.primary
  return (
    <div className={`bg-card rounded-xl border border-border p-5 transition-all duration-200 cursor-default ${cfg.cssClass}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{title}</p>
      {subtitle && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{subtitle}</p>}
    </div>
  )
}