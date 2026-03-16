// lib/actions/submissions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PhotoMetadata {
  fileName: string
  filePath: string
  fileSize: number
  gpsLatitude: number | null
  gpsLongitude: number | null
  distanceFromSite: number | null
  takenAt: Date | null
}

export interface CreateSubmissionInput {
  projectId: string
  milestoneId?: string
  completionPercentage: number
  notes: string
  photos: PhotoMetadata[]
}

export interface SubmissionWithDetails {
  id: string
  submission_number: string
  project_id: string
  milestone_id: string | null
  contractor_id: string
  completion_percentage: number
  notes: string
  status: string
  gps_verified: boolean
  submitted_at: string
  projects: { name: string; project_number: string; location_region: string } | null
  milestones: { name: string } | null
  users: { full_name: string } | null
  submission_photos: {
    id: string
    file_name: string
    file_path: string
    file_size: number
    gps_latitude: number | null
    gps_longitude: number | null
    distance_from_site: number | null
    taken_at: string | null
  }[]
}

// ─────────────────────────────────────────────
// Create Submission
// ─────────────────────────────────────────────

export async function createSubmission(input: CreateSubmissionInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  
  // Determine GPS verification status from photos
let gpsVerified = false
let status = 'pending'

if (input.photos.length > 0) {
  const photosWithGPS = input.photos.filter(p => p.gpsLatitude !== null)
  const verifiedPhotos = photosWithGPS.filter(
    p => p.distanceFromSite !== null && p.distanceFromSite < 100
  )

  gpsVerified = verifiedPhotos.length > 0

  // Photos exist but NONE have GPS → warn, don't auto-flag
  // Photos exist and some are too far away → flag immediately
  const flaggedPhotos = photosWithGPS.filter(
    p => p.distanceFromSite !== null && p.distanceFromSite > 500
  )
  const hasNoGPSAtAll = photosWithGPS.length === 0

  if (!hasNoGPSAtAll && flaggedPhotos.length === photosWithGPS.length) {
    // Every photo with GPS is >500m away — clear fraud signal
    status = 'flagged'
  }
  // hasNoGPSAtAll → stays 'pending' (official decides)
}

  // Insert submission record
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .insert({
      project_id: input.projectId,
      milestone_id: input.milestoneId || null,
      contractor_id: user.id,
      completion_percentage: input.completionPercentage,
      notes: input.notes,
      status: 'pending',
      gps_verified: gpsVerified,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (subError) {
    console.error('Submission insert error:', subError)
    return { error: subError.message }
  }

  // Insert photo records
  if (input.photos.length > 0) {
    const photoRecords = input.photos.map(photo => ({
      submission_id: submission.id,
      file_name: photo.fileName,
      file_path: photo.filePath,
      file_size: photo.fileSize,
      gps_latitude: photo.gpsLatitude,
      gps_longitude: photo.gpsLongitude,
      distance_from_site: photo.distanceFromSite,
      taken_at: photo.takenAt?.toISOString() || null,
      uploaded_at: new Date().toISOString(),
    }))

    const { error: photoError } = await supabase
      .from('submission_photos')
      .insert(photoRecords)

    if (photoError) {
      console.error('Photo insert error:', photoError)
      // Don't fail — submission is already created
    }
  }

  revalidatePath('/submissions')
  revalidatePath(`/projects/${input.projectId}`)

  return { success: true, submissionId: submission.id }
}

// ─────────────────────────────────────────────
// Get All Submissions (role-aware)
// ─────────────────────────────────────────────

export async function getSubmissions(filters?: {
  status?: string
  projectId?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', data: null }

  // Get caller's role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('submissions')
    .select(`
      *,
      projects (name, project_number, location_region),
      milestones (name),
      users!submissions_contractor_id_fkey (full_name),
      submission_photos (*)
    `)
    .order('submitted_at', { ascending: false })

  // Contractors only see their own
  if (profile?.role === 'contractor') {
    query = query.eq('contractor_id', user.id)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.projectId) {
    query = query.eq('project_id', filters.projectId)
  }

  const { data, error } = await query

  if (error) return { error: error.message, data: null }
  return { data: data as SubmissionWithDetails[], error: null }
}

// ─────────────────────────────────────────────
// Get Single Submission
// ─────────────────────────────────────────────

export async function getSubmissionById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      projects (*, users!projects_contractor_id_fkey (full_name)),
      milestones (*),
      users!submissions_contractor_id_fkey (full_name, email),
      submission_photos (*)
    `)
    .eq('id', id)
    .single()

  if (error) return { error: error.message, data: null }
  return { data, error: null }
}

// ─────────────────────────────────────────────
// Upload Photo to Supabase Storage
// ─────────────────────────────────────────────

export async function getStorageUploadUrl(fileName: string, contentType: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const filePath = `${user.id}/${Date.now()}-${fileName}`

  const { data, error } = await supabase.storage
    .from('submission-photos')
    .createSignedUploadUrl(filePath)

  if (error) return { error: error.message }

  return { signedUrl: data.signedUrl, filePath, token: data.token }
}