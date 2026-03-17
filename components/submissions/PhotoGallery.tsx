// components/submissions/PhotoGallery.tsx
'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, MapPin, Clock, HardDrive } from 'lucide-react'
import { GPSBadge } from './GPSVerification'
import { formatDistance } from '@/lib/utils/gps'
import { createClient } from '@/lib/supabase/client'

interface Photo {
  id: string
  file_name: string
  file_path: string
  file_size: number
  gps_latitude: number | null
  gps_longitude: number | null
  distance_from_site: number | null
  taken_at: string | null
}

interface PhotoGalleryProps {
  photos: Photo[]
}

function getGPSStatus(photo: Photo): 'verified' | 'review' | 'flagged' | null {
  if (photo.gps_latitude === null) return null
  if (photo.distance_from_site === null) return null
  if (photo.distance_from_site < 100) return 'verified'
  if (photo.distance_from_site <= 500) return 'review'
  return 'flagged'
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  const getPhotoUrl = async (path: string): Promise<string> => {
    if (photoUrls[path]) return photoUrls[path]

    const supabase = createClient()
    const { data } = await supabase.storage
      .from('submission-photos')
      .createSignedUrl(path, 3600) // 1 hour

    const url = data?.signedUrl ?? ''
    setPhotoUrls(prev => ({ ...prev, [path]: url }))
    return url
  }

  const openLightbox = async (index: number) => {
    await getPhotoUrl(photos[index].file_path)
    setLightboxIndex(index)
  }

  const navigate = async (dir: 'prev' | 'next') => {
    if (lightboxIndex === null) return
    const next = dir === 'next'
      ? (lightboxIndex + 1) % photos.length
      : (lightboxIndex - 1 + photos.length) % photos.length
    await getPhotoUrl(photos[next].file_path)
    setLightboxIndex(next)
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-slate-400">
        <p className="text-sm">No photos in this submission</p>
      </div>
    )
  }

  const activeLightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, index) => {
          const status = getGPSStatus(photo)
          const url = photoUrls[photo.file_path]

          return (
            <button
              key={photo.id}
              onClick={() => openLightbox(index)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] hover:ring-2 hover:ring-primary/20 hover:border-primary/30"
            >
              {url ? (
                <img
                  src={url}
                  alt={photo.file_name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // fallback: try loading via supabase
                    getPhotoUrl(photo.file_path).then(u => {
                      if (u) (e.target as HTMLImageElement).src = u
                    })
                  }}
                />
              ) : (
                <PhotoPlaceholder path={photo.file_path} onLoad={(u) => setPhotoUrls(prev => ({ ...prev, [photo.file_path]: u }))} />
              )}

              {/* GPS overlay badge */}
              <div className="absolute bottom-2 left-2">
                <GPSBadge
                  status={status}
                  distance={photo.distance_from_site}
                  noGPS={photo.gps_latitude === null}
                />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20" />
            </button>
          )
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && activeLightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {lightboxIndex + 1} / {photos.length}
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[200px]">
                  {activeLightboxPhoto.file_name}
                </span>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Image */}
            <div className="relative flex-1 overflow-hidden bg-black min-h-0">
              {photoUrls[activeLightboxPhoto.file_path] ? (
                <img
                  src={photoUrls[activeLightboxPhoto.file_path]}
                  alt={activeLightboxPhoto.file_name}
                  className="h-full w-full object-contain"
                  style={{ maxHeight: '60vh' }}
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-slate-500 text-sm">
                  Loading…
                </div>
              )}

              {/* Nav arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => navigate('prev')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => navigate('next')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Footer — EXIF metadata */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-700 p-4">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                {activeLightboxPhoto.gps_latitude !== null ? (
                  <span>
                    {activeLightboxPhoto.gps_latitude.toFixed(5)},&nbsp;
                    {activeLightboxPhoto.gps_longitude!.toFixed(5)}
                  </span>
                ) : (
                  <span className="text-slate-500">No GPS data</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                {activeLightboxPhoto.taken_at
                  ? new Date(activeLightboxPhoto.taken_at).toLocaleString()
                  : <span className="text-slate-500">Unknown time</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <HardDrive className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                {formatFileSize(activeLightboxPhoto.file_size)}
                {activeLightboxPhoto.distance_from_site !== null && (
                  <span className="ml-2">
                    · {formatDistance(activeLightboxPhoto.distance_from_site)} from site
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Auto-loads photo on mount
function PhotoPlaceholder({ path, onLoad }: { path: string; onLoad: (url: string) => void }) {
  const supabase = createClient()

  supabase.storage
    .from('submission-photos')
    .createSignedUrl(path, 3600)
    .then(({ data }) => {
      if (data?.signedUrl) onLoad(data.signedUrl)
    })

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
    </div>
  )
}