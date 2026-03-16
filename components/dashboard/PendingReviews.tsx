// components/dashboard/PendingReviews.tsx
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Clock, MapPin, User } from 'lucide-react'

interface PendingReview {
  id: string
  submission_number: string
  status: string
  submitted_at: string
  completion_percentage: number
  projects: { name: string; location_region: string } | null
  users: { full_name: string } | null
}

export function PendingReviews({ reviews }: { reviews: PendingReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
        <Clock className="mb-2 h-8 w-8 opacity-30" />
        <p className="text-sm">No pending reviews</p>
        <p className="text-xs">All caught up! 🎉</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {reviews.map(review => (
        <Link
          key={review.id}
          href={`/submissions/${review.id}`}
          className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:border-blue-200 hover:shadow-sm"
        >
          {/* Status dot */}
          <div className={`h-2 w-2 shrink-0 rounded-full ${
            review.status === 'under_review' ? 'bg-amber-400' : 'bg-blue-400'
          }`} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 truncate">
                {review.projects?.name ?? 'Unknown project'}
              </p>
              <span className="shrink-0 text-xs text-slate-400">
                {review.completion_percentage}%
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {review.users?.full_name ?? '—'}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {review.projects?.location_region ?? '—'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(review.submitted_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </Link>
      ))}

      <Link
        href="/submissions?status=pending"
        className="block pt-1 text-center text-xs font-medium text-blue-600 hover:text-blue-800"
      >
        View all pending →
      </Link>
    </div>
  )
}