// components/dashboard/StatsCard.tsx
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  urgent?: boolean
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  trendLabel,
  urgent,
}: StatsCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-slate-400'

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border bg-white/70 backdrop-blur-sm p-5 shadow-sm
      transition-all hover:shadow-md hover:border-slate-300
      ${urgent ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200'}
    `}>
      {urgent && (
        <div className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-red-400 to-red-600" />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 truncate">{subtitle}</p>
          )}
          {trend && trendLabel && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {trendLabel}
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  )
}