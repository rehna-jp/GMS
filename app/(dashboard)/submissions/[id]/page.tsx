// app/(dashboard)/submissions/[id]/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubmissionById } from '@/lib/actions/submissions'
import { getSubmissionAuditLog } from '@/lib/actions/reviews'
import { PhotoGallery } from '@/components/submissions/PhotoGallery'
import { ReviewPanel } from '@/components/submissions/ReviewPanel'
import { ResubmitPanel } from '@/components/submissions/ResubmitPanel'
import { GPSBadge } from '@/components/submissions/GPSVerification'
import Link from 'next/link'
import {
  ChevronLeft, MapPin, Calendar, User, Building2,
  Target, FileText, Clock, CheckCircle2, XCircle, AlertTriangle, Eye,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; classes: string }> = {
  pending: { label: 'Pending', icon: Clock, classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  under_review: { label: 'Under Review', icon: Eye, classes: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', icon: CheckCircle2, classes: 'bg-green-100 text-green-800 border-green-200' },
  flagged: { label: 'Flagged', icon: XCircle, classes: 'bg-red-100 text-red-800 border-red-200' },
}

const AUDIT_ACTION_LABELS: Record<string, { label: string; color: string }> = {
  submission_approve: { label: 'Approved', color: 'text-green-700 bg-green-50 border-green-200' },
  submission_flag: { label: 'Flagged', color: 'text-red-700 bg-red-50 border-red-200' },
  submission_request_changes: { label: 'Changes Requested', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  submission_under_review: { label: 'Marked Under Review', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  submission_resubmitted: { label: 'Resubmitted', color: 'text-purple-700 bg-purple-50 border-purple-200' },
}

export default async function SubmissionDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const { data: submission, error } = await getSubmissionById(id)
  if (error || !submission) notFound()

  const { data: auditLogs } = await getSubmissionAuditLog(id)

  const isOfficial = ['admin', 'official'].includes(profile?.role ?? '')
  const isContractor = profile?.role === 'contractor'
  const isOwnSubmission = submission.contractor_id === user?.id

  const statusCfg = STATUS_CONFIG[submission.status] ?? STATUS_CONFIG.pending
  const StatusIcon = statusCfg.icon

  // GPS summary
  const photosWithGPS = (submission.submission_photos ?? []).filter((p: any) => p.gps_latitude !== null)
  const closestPhoto = [...photosWithGPS].sort((a: any, b: any) =>
    (a.distance_from_site ?? Infinity) - (b.distance_from_site ?? Infinity)
  )[0]
  const gpsStatus: 'verified' | 'review' | 'flagged' | null = closestPhoto
    ? closestPhoto.distance_from_site < 100 ? 'verified'
      : closestPhoto.distance_from_site <= 500 ? 'review'
        : 'flagged'
    : null

  // Get latest review comment for resubmit panel
  // new_value_parsed is added by getSubmissionAuditLog
  const latestReviewLog = auditLogs?.find((log: any) =>
    ['submission_request_changes', 'submission_flag'].includes(log.action)
  )
  const latestReviewComment = latestReviewLog?.new_value_parsed?.comment ?? ''

  const project = submission.projects as any
  const contractor = (submission as any).users
  const canResubmit =
    isContractor &&
    isOwnSubmission &&
    ['under_review', 'flagged'].includes(submission.status)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/submissions"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Submissions
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{submission.submission_number}</h1>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusCfg.classes}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusCfg.label}
            </span>
            <GPSBadge
              status={gpsStatus}
              distance={closestPhoto?.distance_from_site}
              noGPS={photosWithGPS.length === 0 && (submission.submission_photos?.length ?? 0) > 0}
            />
          </div>
          <p className="mt-1 text-slate-500">{project?.name}</p>
        </div>
        <div className="text-right text-xs text-slate-400">
          Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">

          {/* Resubmit panel — contractor only */}
          {canResubmit && (
            <ResubmitPanel
              submissionId={submission.id}
              currentStatus={submission.status as 'under_review' | 'flagged'}
              reviewComment={latestReviewComment}
              projectGPS={{
                latitude: project?.gps_latitude ?? 0,
                longitude: project?.gps_longitude ?? 0,
              }}
              existingNotes={submission.notes ?? ''}
            />
          )}

          {/* Photos */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">
              Progress Photos
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({submission.submission_photos?.length ?? 0})
              </span>
            </h2>
            <PhotoGallery photos={submission.submission_photos ?? []} />
          </section>

          {/* Notes */}
          {submission.notes && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-400" />
                Contractor Notes
              </h2>
              <p className="text-sm leading-relaxed text-slate-600">{submission.notes}</p>
            </section>
          )}

          {/* Audit trail */}
          {auditLogs && auditLogs.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Audit Trail</h2>
              <ol className="relative space-y-4 border-l border-slate-200 pl-6">
                {auditLogs.map((log: any) => {
                  const cfg = AUDIT_ACTION_LABELS[log.action] ?? {
                    label: log.action,
                    color: 'text-slate-700 bg-slate-50 border-slate-200',
                  }
                  const parsed = log.new_value_parsed ?? {}
                  return (
                    <li key={log.id} className="relative">
                      <div className="absolute -left-[1.625rem] mt-1 h-3 w-3 rounded-full border-2 border-white bg-slate-400" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          by {log.users?.full_name ?? 'Unknown'} · {log.users?.role}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {parsed.comment && (
                        <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs italic text-slate-600">
                          "{parsed.comment}"
                        </p>
                      )}
                      {parsed.new_photos_count && (
                        <p className="mt-1 text-xs text-slate-400">
                          +{parsed.new_photos_count} new photo(s) uploaded
                        </p>
                      )}
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Details card */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Project</dt>
                  <dd className="font-medium text-slate-700">
                    <Link href={`/projects/${submission.project_id}`} className="hover:text-blue-600">
                      {project?.project_number} — {project?.name}
                    </Link>
                  </dd>
                </div>
              </div>

              {submission.milestones && (
                <div className="flex items-start gap-3">
                  <Target className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs text-slate-400">Milestone</dt>
                    <dd className="font-medium text-slate-700">{(submission.milestones as any).name}</dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Contractor</dt>
                  <dd className="font-medium text-slate-700">{contractor?.full_name}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Region</dt>
                  <dd className="font-medium text-slate-700">{project?.location_region}</dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <dt className="text-xs text-slate-400">Submitted</dt>
                  <dd className="font-medium text-slate-700">
                    {format(new Date(submission.submitted_at), 'PPP p')}
                  </dd>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Claimed completion</span>
                  <span className="font-bold text-slate-700">{submission.completion_percentage}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${submission.completion_percentage}%` }}
                  />
                </div>
              </div>
            </dl>
          </section>

          {/* GPS summary */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">GPS Summary</h2>
            {photosWithGPS.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                No photos contain GPS data. Manual verification required.
              </div>
            ) : (
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Photos with GPS</span>
                  <span className="font-medium">{photosWithGPS.length} / {submission.submission_photos?.length}</span>
                </div>
                {closestPhoto && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Closest photo</span>
                    <span className="font-medium">
                      {closestPhoto.distance_from_site < 1000
                        ? `${Math.round(closestPhoto.distance_from_site)}m`
                        : `${(closestPhoto.distance_from_site / 1000).toFixed(2)}km`} from site
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Verification</span>
                  <GPSBadge status={gpsStatus} distance={closestPhoto?.distance_from_site} />
                </div>
                {project?.gps_latitude && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <a
                      href={`https://www.google.com/maps?q=${project.gps_latitude},${project.gps_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      View project site on Google Maps
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Review panel — officials only */}
          {isOfficial && (
            <ReviewPanel
              submissionId={submission.id}
              currentStatus={submission.status}
              contractorName={contractor?.full_name ?? 'Contractor'}
            />
          )}
        </div>
      </div>
    </div>
  )
}