// components/dashboard/RecentActivity.tsx
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle2, XCircle, MessageSquare, Eye, RefreshCw, Clock } from 'lucide-react'

interface ActivityItem {
  id: string
  action: string
  created_at: string
  users: { full_name: string; role: string } | null
  new_value?: string
}

const ACTION_CONFIG: Record<string, {
  label: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}> = {
  submission_approve:         { label: 'Approved submission',      icon: CheckCircle2, iconBg: 'bg-green-100',  iconColor: 'text-green-600' },
  submission_flag:            { label: 'Flagged submission',       icon: XCircle,      iconBg: 'bg-red-100',    iconColor: 'text-red-600' },
  submission_request_changes: { label: 'Requested changes',        icon: MessageSquare,iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
  submission_under_review:    { label: 'Started reviewing',        icon: Eye,          iconBg: 'bg-blue-100',   iconColor: 'text-blue-600' },
  submission_resubmitted:     { label: 'Resubmitted for review',   icon: RefreshCw,    iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400">
        <Clock className="mb-2 h-8 w-8 opacity-30" />
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  return (
    <ol className="space-y-1">
      {activities.map((activity, index) => {
        const cfg = ACTION_CONFIG[activity.action]
        if (!cfg) return null
        const Icon = cfg.icon

        let comment = ''
        try {
          const parsed = JSON.parse(activity.new_value ?? '{}')
          comment = parsed.comment ?? ''
        } catch {}

        return (
          <li
            key={activity.id}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}>
              <Icon className={`h-3.5 w-3.5 ${cfg.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">
                <span className="font-medium">{activity.users?.full_name ?? 'Unknown'}</span>
                {' '}<span className="text-slate-500">{cfg.label}</span>
              </p>
              {comment && (
                <p className="mt-0.5 truncate text-xs italic text-slate-400">"{comment}"</p>
              )}
              <p className="mt-0.5 text-xs text-slate-400">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}