// components/submissions/SubmissionCard.tsx
'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Camera, MapPin, Clock, User, ArrowRight } from 'lucide-react'
import { SubmissionWithDetails } from '@/lib/actions/submissions'
import { GPSBadge } from './GPSVerification'
import { Badge } from '@/components/ui/badge'

interface SubmissionCardProps {
  submission: SubmissionWithDetails
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  under_review: { label: 'Under Review', classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', classes: 'bg-green-100 text-green-800 border-green-200' },
  flagged: { label: 'Flagged', classes: 'bg-red-100 text-red-800 border-red-200' },
}

export function SubmissionCard({ submission }: SubmissionCardProps) {
  const status = STATUS_CONFIG[submission.status] ?? STATUS_CONFIG.pending
  const photoCount = submission.submission_photos?.length ?? 0

  // Best GPS result from photos for display
  const photosWithGPS = submission.submission_photos?.filter(p => p.gps_latitude !== null) ?? []
  const closestPhoto = photosWithGPS.sort((a, b) =>
    (a.distance_from_site ?? Infinity) - (b.distance_from_site ?? Infinity)
  )[0]

  const gpsStatus: 'verified' | 'review' | 'flagged' | null = closestPhoto
    ? closestPhoto.distance_from_site! < 100
      ? 'verified'
      : closestPhoto.distance_from_site! <= 500
        ? 'review'
        : 'flagged'
    : null

  return (
    <Link href={`/submissions/${submission.id}`} className="group block">
      <div className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-md hover:bg-white">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-800 group-hover:text-primary transition-colors">
              {submission.submission_number}
            </p>
            <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">
              {submission.projects?.name ?? 'Unknown project'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.classes}`}>
              {status.label}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary/70 transition-colors" />
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            {photoCount} photo{photoCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {submission.projects?.location_region ?? '—'}
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {submission.users?.full_name ?? 'Unknown'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
          </span>
        </div>

        {/* Progress + GPS row */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-500">Completion</span>
              <span className="font-medium text-slate-700">{submission.completion_percentage}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${submission.completion_percentage}%` }}
              />
            </div>
          </div>

          <GPSBadge
            status={gpsStatus}
            distance={closestPhoto?.distance_from_site}
            noGPS={photosWithGPS.length === 0 && photoCount > 0}
          />
        </div>

        {/* Milestone tag if any */}
        {submission.milestones?.name && (
          <p className="mt-2 text-xs text-slate-400">
            📍 Milestone: <span className="font-medium text-slate-600">{submission.milestones.name}</span>
          </p>
        )}
      </div>
    </Link>
  )
}