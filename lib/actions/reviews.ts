// lib/actions/reviews.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export type ReviewAction = 'approve' | 'flag' | 'request_changes' | 'under_review'

export interface ReviewInput {
  submissionId: string
  action: ReviewAction
  comment: string
}

export interface ResubmitInput {
  submissionId: string
  notes: string
  photos: {
    fileName: string
    filePath: string
    fileSize: number
    gpsLatitude: number | null
    gpsLongitude: number | null
    distanceFromSite: number | null
    takenAt: Date | null
  }[]
}

const ACTION_TO_STATUS: Record<ReviewAction, string> = {
  approve:         'approved',
  flag:            'flagged',
  request_changes: 'under_review',
  under_review:    'under_review',
}

const ACTION_LABELS: Record<ReviewAction, string> = {
  approve:         'Approved',
  flag:            'Flagged',
  request_changes: 'Changes Requested',
  under_review:    'Marked Under Review',
}

// ── Review a submission (official) ───────────────────────────────────────────

export async function reviewSubmission(input: ReviewInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'official'].includes(profile.role)) {
    return { error: 'Only officials and admins can review submissions' }
  }

  const newStatus = ACTION_TO_STATUS[input.action]

  // Update submission status
  const { data: submission, error: updateError } = await supabase
    .from('submissions')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', input.submissionId)
    .select('*, projects(name), users!submissions_contractor_id_fkey(id, full_name)')
    .single()

  if (updateError) return { error: updateError.message }

  // Audit log — new_value is TEXT so stringify the object
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: `submission_${input.action}`,
    entity_type: 'submissions',
    entity_id: input.submissionId,
    table_name: 'submissions',
    record_id: input.submissionId,
    new_value: JSON.stringify({
      status: newStatus,
      comment: input.comment,
      reviewed_by_name: profile.full_name,
    }),
  })

  // Notify contractor
  const contractorId = (submission as any).users?.id
  const projectName = (submission as any).projects?.name ?? 'your project'

  if (contractorId) {
    const notifMessages: Record<ReviewAction, string> = {
      approve:         `Your submission for "${projectName}" has been approved. ✅`,
      flag:            `Your submission for "${projectName}" has been flagged for investigation. 🚩`,
      request_changes: `Changes requested on your submission for "${projectName}". Please resubmit with new photos. ⚠️`,
      under_review:    `Your submission for "${projectName}" is now under review. 👀`,
    }

    await createNotification({
      userId: contractorId,
      title: ACTION_LABELS[input.action],
      message: notifMessages[input.action],
      type: input.action === 'approve' ? 'success' : input.action === 'flag' ? 'error' : 'warning',
      submissionId: input.submissionId,
    })
  }

  revalidatePath(`/submissions/${input.submissionId}`)
  revalidatePath('/submissions')

  return { success: true, newStatus }
}

// ── Resubmit (contractor) ─────────────────────────────────────────────────────

export async function resubmitSubmission(input: ResubmitInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing, error: fetchError } = await supabase
    .from('submissions')
    .select('*, projects(name, primary_official_id), users!submissions_contractor_id_fkey(full_name)')
    .eq('id', input.submissionId)
    .eq('contractor_id', user.id)
    .single()

  if (fetchError || !existing) return { error: 'Submission not found or access denied' }

  if (!['under_review', 'flagged'].includes(existing.status)) {
    return { error: 'Only under review or flagged submissions can be resubmitted' }
  }

  const photosWithGPS = input.photos.filter(p => p.gpsLatitude !== null)
  const verifiedPhotos = photosWithGPS.filter(
    p => p.distanceFromSite !== null && p.distanceFromSite < 100
  )
  const gpsVerified = verifiedPhotos.length > 0

  // Reset to pending
  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      status: 'pending',
      notes: input.notes || existing.notes,
      gps_verified: gpsVerified,
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq('id', input.submissionId)

  if (updateError) return { error: updateError.message }

  // Add new photos
  if (input.photos.length > 0) {
    await supabase.from('submission_photos').insert(
      input.photos.map(photo => ({
        submission_id: input.submissionId,
        file_name: photo.fileName,
        file_path: photo.filePath,
        file_size: photo.fileSize,
        gps_latitude: photo.gpsLatitude,
        gps_longitude: photo.gpsLongitude,
        distance_from_site: photo.distanceFromSite,
        taken_at: photo.takenAt?.toISOString() ?? null,
        uploaded_at: new Date().toISOString(),
      }))
    )
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'submission_resubmitted',
    entity_type: 'submissions',
    entity_id: input.submissionId,
    table_name: 'submissions',
    record_id: input.submissionId,
    new_value: JSON.stringify({
      status: 'pending',
      new_photos_count: input.photos.length,
      resubmitted_by: (existing as any).users?.full_name,
    }),
  })

  // Notify official
  const notifyUserId = existing.reviewed_by ?? (existing as any).projects?.primary_official_id
  if (notifyUserId) {
    const projectName = (existing as any).projects?.name ?? 'a project'
    await createNotification({
      userId: notifyUserId,
      title: 'Submission Resubmitted',
      message: `Contractor has resubmitted for "${projectName}" with ${input.photos.length} new photo(s). Ready for re-review. 🔄`,
      type: 'info',
      submissionId: input.submissionId,
    })
  }

  revalidatePath(`/submissions/${input.submissionId}`)
  revalidatePath('/submissions')

  return { success: true }
}

// ── Audit log query ───────────────────────────────────────────────────────────

export async function getSubmissionAuditLog(submissionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, users(full_name, role)')
    .eq('record_id', submissionId)
    .eq('table_name', 'submissions')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  // Parse new_value from TEXT to object for each log
  const parsed = (data ?? []).map((log: any) => ({
    ...log,
    new_value_parsed: (() => {
      try { return JSON.parse(log.new_value ?? '{}') }
      catch { return {} }
    })()
  }))

  return { data: parsed, error: null }
}