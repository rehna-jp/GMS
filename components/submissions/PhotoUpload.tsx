// components/submissions/PhotoUpload.tsx
'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react'
import { extractGPSFromPhoto, validatePhotoFile, formatFileSize, ExtractedGPS } from '@/lib/utils/exif'
import { verifyGPSProximity, GPSVerificationResult } from '@/lib/utils/gps'
import { GPSVerification } from './GPSVerification'
import { createClient } from '@/lib/supabase/client'

export interface UploadedPhoto {
  file: File
  preview: string
  gps: ExtractedGPS
  verificationResult: GPSVerificationResult | null
  uploading: boolean
  uploaded: boolean
  error: string | null
  filePath: string | null
}

interface PhotoUploadProps {
  projectGPS: { latitude: number; longitude: number }
  onChange: (photos: UploadedPhoto[]) => void
  maxPhotos?: number
}

export function PhotoUpload({ projectGPS, onChange, maxPhotos = 10 }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [processing, setProcessing] = useState(false)

  // ── Notify parent whenever photos changes — never during render ──────
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])
  useEffect(() => { onChangeRef.current(photos) }, [photos])

  // ── Process a single file: validate + extract EXIF ───────────────────
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
      error: null,
      filePath: null,
    }
  }

  // ── Upload photos to Supabase Storage ────────────────────────────────
  const uploadToStorage = async (startIndex: number, count: number) => {
    const supabase = createClient()

    // Use getSession() — avoids the network fetch that causes "Failed to fetch"
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) {
      setPhotos(prev => {
        const updated = [...prev]
        for (let i = startIndex; i < startIndex + count; i++) {
          if (updated[i] && !updated[i].error) {
            updated[i] = { ...updated[i], uploading: false, error: 'Not authenticated. Please refresh.' }
          }
        }
        return updated
      })
      return
    }

    for (let i = startIndex; i < startIndex + count; i++) {
      setPhotos(prev => {
        const photo = prev[i]
        if (!photo || photo.error) return prev

        const ext = photo.file.name.split('.').pop() ?? 'jpg'
        const filePath = `${userId}/${Date.now()}-${i}.${ext}`

        // Fire upload async — update state when it resolves
        supabase.storage
          .from('submission-photos')
          .upload(filePath, photo.file, { cacheControl: '3600', upsert: false })
          .then(({ error }) => {
            setPhotos(current => {
              const next = [...current]
              if (!next[i]) return current
              next[i] = error
                ? { ...next[i], uploading: false, error: `Upload failed: ${error.message}` }
                : { ...next[i], uploading: false, uploaded: true, filePath }
              return next
            })
          })

        // Mark as uploading immediately
        const updated = [...prev]
        updated[i] = { ...updated[i], uploading: true }
        return updated
      })
    }
  }

  // ── Drop handler ─────────────────────────────────────────────────────
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (photos.length >= maxPhotos) return
      const remaining = maxPhotos - photos.length
      const toProcess = acceptedFiles.slice(0, remaining)

      setProcessing(true)
      const processed = await Promise.all(toProcess.map(processFile))
      const startIndex = photos.length

      setPhotos(prev => [...prev, ...processed])
      setProcessing(false)

      if (processed.some(p => !p.error)) {
        uploadToStorage(startIndex, processed.length)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos.length, maxPhotos, projectGPS]
  )

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].preview)
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/heic': [], 'image/heif': [] },
    disabled: photos.length >= maxPhotos || processing,
    multiple: true,
  })

  const verifiedCount = photos.filter(p => p.verificationResult?.status === 'verified').length
  const flaggedCount  = photos.filter(p => p.verificationResult?.status === 'flagged').length
  const noGPSCount    = photos.filter(p => !p.gps.hasGPS && !p.error).length

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {photos.length < maxPhotos && (
        <div
          {...getRootProps()}
          className={`
            relative flex cursor-pointer flex-col items-center justify-center
            rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
            ${isDragActive
              ? 'border-blue-400 bg-blue-50 scale-[1.01]'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'}
            ${processing ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          {processing ? (
            <Loader2 className="mb-3 h-10 w-10 animate-spin text-blue-500" />
          ) : (
            <Upload className={`mb-3 h-10 w-10 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
          )}
          <p className="text-sm font-medium text-slate-700">
            {processing ? 'Extracting GPS data…' : isDragActive ? 'Drop photos here' : 'Drag & drop photos, or click to browse'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            JPEG, PNG, HEIC · Max 5MB each · Up to {maxPhotos} photos
          </p>
          {photos.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">{photos.length}/{maxPhotos} added</p>
          )}
        </div>
      )}

      {/* GPS summary bar */}
      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            📸 {photos.length} photo{photos.length !== 1 ? 's' : ''}
          </span>
          {verifiedCount > 0 && (
            <span className="rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700">✅ {verifiedCount} verified</span>
          )}
          {flaggedCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">🚩 {flaggedCount} flagged</span>
          )}
          {noGPSCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">⚠️ {noGPSCount} no GPS</span>
          )}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <div key={index} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video w-full bg-slate-100">
                <img src={photo.preview} alt={photo.file.name} className="h-full w-full object-cover" />

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
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                    </div>
                  </div>
                )}
                {photo.uploaded && (
                  <div className="absolute bottom-2 right-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    ✓ SAVED
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-medium text-slate-700" title={photo.file.name}>
                    {photo.file.name}
                  </p>
                  <span className="ml-2 shrink-0 text-xs text-slate-400">{formatFileSize(photo.file.size)}</span>
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
                    photoName={photo.file.name}
                  />
                )}

                {photo.gps.takenAt && (
                  <p className="text-[11px] text-slate-400">📅 Taken: {photo.gps.takenAt.toLocaleString()}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}