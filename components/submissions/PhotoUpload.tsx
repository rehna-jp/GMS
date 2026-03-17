// components/submissions/PhotoUpload.tsx
'use client'

import { useCallback, useState, useEffect } from 'react'
import { Upload, X, AlertCircle, Loader2, Camera, WifiOff } from 'lucide-react'
import { extractGPSFromPhoto, validatePhotoFile, formatFileSize, ExtractedGPS } from '@/lib/utils/exif'
import { calculateDistance, verifyGPSProximity, GPSVerificationResult } from '@/lib/utils/gps'
import { GPSVerification } from './GPSVerification'
import { createClient } from '@/lib/supabase/client'
import { queuePhoto, fileToDataUrl } from '@/lib/utils/offline-queue'

export interface UploadedPhoto {
  file: File
  preview: string
  gps: ExtractedGPS
  verificationResult: GPSVerificationResult | null
  uploading: boolean
  uploaded: boolean
  queued: boolean // offline queue
  error: string | null
  filePath: string | null
}

interface PhotoUploadProps {
  projectGPS: { latitude: number; longitude: number }
  projectId?: string
  projectName?: string
  submissionData?: {
    milestoneId?: string
    completionPercentage: number
    notes: string
  }
  onChange: (photos: UploadedPhoto[]) => void
  maxPhotos?: number
}

export function PhotoUpload({
  projectGPS,
  projectId,
  projectName,
  submissionData,
  onChange,
  maxPhotos = 10
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [processing, setProcessing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const processFile = async (file: File): Promise<UploadedPhoto> => {
    const validation = validatePhotoFile(file)
    if (!validation.valid) {
      return {
        file,
        preview: URL.createObjectURL(file),
        gps: { latitude: null, longitude: null, takenAt: null, hasGPS: false },
        verificationResult: null,
        uploading: false,
        uploaded: false,
        queued: false,
        error: validation.error || 'Invalid file',
        filePath: null,
      }
    }

    const gps = await extractGPSFromPhoto(file)
    let verificationResult: GPSVerificationResult | null = null

    if (gps.hasGPS && gps.latitude !== null && gps.longitude !== null) {
      verificationResult = verifyGPSProximity(
        { latitude: gps.latitude, longitude: gps.longitude },
        projectGPS
      )
    }

    return {
      file,
      preview: URL.createObjectURL(file),
      gps,
      verificationResult,
      uploading: false,
      uploaded: false,
      queued: false,
      error: null,
      filePath: null,
    }
  }

  const uploadOrQueue = async (photo: UploadedPhoto, index: number) => {
    if (!isOnline) {
      // Save to offline queue
      if (projectId && submissionData) {
        try {
          const dataUrl = await fileToDataUrl(photo.file)
          await queuePhoto({
            submissionData: {
              projectId,
              projectName: projectName ?? 'Unknown Project',
              milestoneId: submissionData.milestoneId,
              completionPercentage: submissionData.completionPercentage,
              notes: submissionData.notes,
            },
            photo: {
              name: photo.file.name,
              type: photo.file.type,
              size: photo.file.size,
              dataUrl,
              gpsLatitude: photo.gps.latitude,
              gpsLongitude: photo.gps.longitude,
              distanceFromSite: photo.verificationResult?.distance ?? null,
              takenAt: photo.gps.takenAt?.toISOString() ?? null,
            },
          })

          setPhotos(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], queued: true }
            onChange(updated)
            return updated
          })
        } catch (err) {
          console.error('Failed to queue photo:', err)
        }
      }
      return
    }

    // Online — upload directly
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ext = photo.file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}-${index}.${ext}`

    setPhotos(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], uploading: true }
      onChange(updated)
      return updated
    })

    const { error } = await supabase.storage
      .from('submission-photos')
      .upload(filePath, photo.file, { cacheControl: '3600', upsert: false })

    setPhotos(prev => {
      const updated = [...prev]
      if (error) {
        updated[index] = { ...updated[index], uploading: false, error: `Upload failed: ${error.message}` }
      } else {
        updated[index] = { ...updated[index], uploading: false, uploaded: true, filePath }
      }
      onChange(updated)
      return updated
    })
  }

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (photos.length >= maxPhotos) return
      const remaining = maxPhotos - photos.length
      const toProcess = Array.from(files).slice(0, remaining)

      setProcessing(true)
      const processed = await Promise.all(toProcess.map(processFile))

      setPhotos(prev => {
        const updated = [...prev, ...processed]
        onChange(updated)
        return updated
      })
      setProcessing(false)

      processed.forEach((photo, i) => {
        if (!photo.error) uploadOrQueue(photo, photos.length + i)
      })
    },
    [photos, maxPhotos, projectGPS, isOnline]
  )

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].preview)
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index)
      onChange(updated)
      return updated
    })
  }

  const verifiedCount = photos.filter(p => p.verificationResult?.status === 'verified').length
  const flaggedCount = photos.filter(p => p.verificationResult?.status === 'flagged').length
  const noGPSCount = photos.filter(p => !p.gps.hasGPS && !p.error).length
  const queuedCount = photos.filter(p => p.queued).length

  return (
    <div className="space-y-4">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <WifiOff className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">You're offline</p>
            <p className="text-xs text-amber-700">
              Photos will be saved to your device and uploaded automatically when network returns.
            </p>
          </div>
        </div>
      )}

      {/* Camera capture button — primary action on mobile */}
      {photos.length < maxPhotos && (
        <div className="space-y-2">
          {/* Camera button — opens rear camera directly on mobile */}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-95">
            <Camera className="h-5 w-5" />
            {processing ? 'Processing…' : 'Take Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
              disabled={processing}
            />
          </label>

          {/* Gallery / drag drop — secondary option */}
          <label
            className={`
              flex cursor-pointer flex-col items-center justify-center
              rounded-xl border-2 border-dashed p-5 text-center transition-all
              ${isDragOver
                ? 'border-primary bg-primary/10'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
              }
            `}
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setIsDragOver(false)
              handleFiles(e.dataTransfer.files)
            }}
          >
            <Upload className="mb-2 h-6 w-6 text-slate-400" />
            <p className="text-sm text-slate-600">
              Or upload from gallery / drag & drop
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              JPEG, PNG, HEIC · Max 5MB · Up to {maxPhotos} photos
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)}
              disabled={processing}
            />
          </label>
        </div>
      )}

      {/* Summary chips */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            📸 {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
          {verifiedCount > 0 && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700">
              ✅ {verifiedCount} verified
            </span>
          )}
          {flaggedCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">
              🚩 {flaggedCount} flagged
            </span>
          )}
          {noGPSCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">
              ⚠️ {noGPSCount} no GPS
            </span>
          )}
          {queuedCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-700">
              📶 {queuedCount} queued for upload
            </span>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm hover:border-primary/20 transition-colors"
            >
              <div className="relative aspect-video w-full bg-slate-50">
                <img
                  src={photo.preview}
                  alt={photo.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                {photo.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading…
                    </div>
                  </div>
                )}

                {photo.uploaded && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    ✓ SAVED
                  </div>
                )}

                {photo.queued && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    📶 QUEUED
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-medium text-slate-700" title={photo.file.name}>
                    {photo.file.name}
                  </p>
                  <span className="ml-2 shrink-0 text-xs text-slate-400">
                    {formatFileSize(photo.file.size)}
                  </span>
                </div>

                {photo.error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {photo.error}
                  </div>
                )}

                {!photo.error && (
                  <GPSVerification
                    result={photo.verificationResult}
                    photoGPS={{ latitude: photo.gps.latitude, longitude: photo.gps.longitude }}
                    projectGPS={projectGPS}
                  />
                )}

                {photo.gps.takenAt && (
                  <p className="text-[11px] text-slate-400">
                    📅 Taken: {photo.gps.takenAt.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}