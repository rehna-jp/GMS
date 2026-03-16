// app/(dashboard)/submissions/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PhotoUpload, UploadedPhoto } from '@/components/submissions/PhotoUpload'
import { createSubmission } from '@/lib/actions/submissions'
import { Loader2, ChevronLeft, Send } from 'lucide-react'
import Link from 'next/link'

interface ProjectOption {
  id: string
  name: string
  project_number: string
  gps_latitude: number
  gps_longitude: number
  milestones: { id: string; name: string }[]
}

export default function NewSubmissionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProjectId = searchParams.get('projectId') ?? ''

  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [selectedProjectId, setSelectedProjectId] = useState(preselectedProjectId)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('')
  const [completionPercentage, setCompletionPercentage] = useState(50)
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])

  // Fetch projects assigned to this contractor
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('projects')
        .select('id, name, project_number, gps_latitude, gps_longitude, milestones(id, name)')
        .eq('contractor_id', user.id)
        .eq('status', 'active')
        .order('name')

      if (data) setProjects(data as ProjectOption[])
      setLoading(false)
    }
    load()
  }, [])

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const milestones = selectedProject?.milestones ?? []

  const validPhotos = photos.filter(p => p.uploaded && !p.error)
  const canSubmit =
    selectedProjectId &&
    completionPercentage > 0 &&
    validPhotos.length > 0 &&
    !submitting

  const handleSubmit = async () => {
    if (!canSubmit || !selectedProject) return
    setSubmitting(true)
    setError('')

    try {
      const photoMeta = validPhotos.map(p => ({
        fileName: p.file.name,
        filePath: p.filePath!,
        fileSize: p.file.size,
        gpsLatitude: p.gps.latitude,
        gpsLongitude: p.gps.longitude,
        distanceFromSite: p.verificationResult?.distance ?? null,
        takenAt: p.gps.takenAt,
      }))

      const result = await createSubmission({
        projectId: selectedProjectId,
        milestoneId: selectedMilestoneId || undefined,
        completionPercentage,
        notes,
        photos: photoMeta,
      })

      if (result.error) {
        setError(result.error)
        setSubmitting(false)
        return
      }

      router.push('/submissions?submitted=true')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/submissions"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Submissions
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">New Submission</h1>
        <p className="mt-1 text-slate-500">
          Upload progress photos from the project site. GPS data will be automatically verified.
        </p>
      </div>

      <div className="space-y-6">
        {/* Project selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-slate-900">Project Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Project */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={e => {
                  setSelectedProjectId(e.target.value)
                  setSelectedMilestoneId('')
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project…</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.project_number} — {p.name}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  No active projects assigned to you. Contact your official.
                </p>
              )}
            </div>

            {/* GPS info banner */}
            {selectedProject && (
              <div className="sm:col-span-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                📍 Project GPS: {selectedProject.gps_latitude.toFixed(6)}, {selectedProject.gps_longitude.toFixed(6)} —
                Photos taken within <strong>100m</strong> will be auto-verified.
              </div>
            )}

            {/* Milestone (optional) */}
            {milestones.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Milestone <span className="text-slate-400">(optional)</span>
                </label>
                <select
                  value={selectedMilestoneId}
                  onChange={e => setSelectedMilestoneId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific milestone</option>
                  {milestones.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Completion % */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Completion Percentage <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={completionPercentage}
                  onChange={e => setCompletionPercentage(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <span className="w-12 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center text-sm font-bold text-slate-700">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Progress Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Describe the current progress, any issues, materials used, etc."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Photo upload */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 font-semibold text-slate-900">Progress Photos</h2>
          <p className="mb-4 text-sm text-slate-500">
            Upload photos taken at the site. GPS data is automatically extracted for fraud prevention.
          </p>

          {selectedProject ? (
            <PhotoUpload
              projectGPS={{
                latitude: selectedProject.gps_latitude,
                longitude: selectedProject.gps_longitude,
              }}
              onChange={setPhotos}
              maxPhotos={10}
            />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-10 text-slate-400">
              <p className="text-sm">Select a project above to upload photos</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {validPhotos.length === 0
              ? 'Upload at least 1 photo to submit.'
              : `${validPhotos.length} photo${validPhotos.length !== 1 ? 's' : ''} ready.`}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Progress Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}