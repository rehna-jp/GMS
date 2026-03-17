// components/submissions/ResubmitPanel.tsx
'use client'

import { useState, useTransition } from 'react'
import { PhotoUpload, UploadedPhoto } from './PhotoUpload'
import { resubmitSubmission } from '@/lib/actions/reviews'
import { AlertTriangle, XCircle, RefreshCw, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface ResubmitPanelProps {
  submissionId: string
  currentStatus: 'under_review' | 'flagged'
  reviewComment?: string
  projectGPS: { latitude: number; longitude: number }
  existingNotes: string
  onResubmitted?: () => void
}

export function ResubmitPanel({
  submissionId,
  currentStatus,
  reviewComment,
  projectGPS,
  existingNotes,
  onResubmitted,
}: ResubmitPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [notes, setNotes] = useState(existingNotes)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const validPhotos = photos.filter(p => p.uploaded && !p.error)
  const canSubmit = validPhotos.length > 0 && !isPending

  const handleResubmit = () => {
    if (!canSubmit) return
    setError('')

    startTransition(async () => {
      const photoMeta = validPhotos.map(p => ({
        fileName: p.file.name,
        filePath: p.filePath!,
        fileSize: p.file.size,
        gpsLatitude: p.gps.latitude,
        gpsLongitude: p.gps.longitude,
        distanceFromSite: p.verificationResult?.distance ?? null,
        takenAt: p.gps.takenAt,
      }))

      const result = await resubmitSubmission({
        submissionId,
        notes,
        photos: photoMeta,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setDone(true)
      onResubmitted?.()
      // Force page refresh to show new status
      window.location.reload()
    })
  }

  // Success state
  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
        <RefreshCw className="mx-auto mb-2 h-7 w-7 text-green-600" />
        <p className="font-semibold text-green-800">Resubmitted successfully!</p>
        <p className="mt-1 text-sm text-green-700">
          Your submission is back to <strong>Pending</strong>. The official has been notified.
        </p>
      </div>
    )
  }

  const isFlagged = currentStatus === 'flagged'

  return (
    <div className={`rounded-xl border-2 overflow-hidden ${isFlagged ? 'border-red-200' : 'border-amber-200'
      }`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className={`w-full flex items-start justify-between gap-3 p-4 text-left transition-colors ${isFlagged
          ? 'bg-red-50 hover:bg-red-100/80'
          : 'bg-amber-50 hover:bg-amber-100/80'
          }`}
      >
        <div className="flex items-start gap-3">
          {isFlagged
            ? <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          }
          <div>
            <p className={`font-semibold text-sm ${isFlagged ? 'text-red-800' : 'text-amber-800'}`}>
              {isFlagged ? 'Submission Flagged' : 'Changes Requested'}
            </p>
            {reviewComment ? (
              <p className={`mt-0.5 text-xs leading-relaxed ${isFlagged ? 'text-red-700' : 'text-amber-700'}`}>
                "{reviewComment}"
              </p>
            ) : (
              <p className={`mt-0.5 text-xs ${isFlagged ? 'text-red-600/80' : 'text-amber-600/80'}`}>
                No comment provided by reviewer.
              </p>
            )}
          </div>
        </div>
        <div className={`shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180 text-slate-500' : 'text-slate-400'}`}>
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      {/* Expandable resubmit form */}
      {expanded && (
        <div className="bg-white p-5 space-y-5 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">
              Upload New Photos
              <span className="ml-1 text-xs font-normal text-slate-400">
                (existing photos are kept for comparison)
              </span>
            </p>
            <PhotoUpload
              projectGPS={projectGPS}
              onChange={setPhotos}
              maxPhotos={10}
            />
          </div>

          {/* Updated notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Update Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Explain what changed in this resubmission…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            onClick={handleResubmit}
            disabled={!canSubmit}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resubmitting…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Resubmit for Review ({validPhotos.length} photo{validPhotos.length !== 1 ? 's' : ''})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}