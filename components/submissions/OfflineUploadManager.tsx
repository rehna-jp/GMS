// components/submissions/OfflineUploadManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getQueuedPhotos, updateQueuedPhoto, removeFromQueue,
  getQueueCount, dataUrlToFile, QueuedPhoto
} from '@/lib/utils/offline-queue'
import { createClient } from '@/lib/supabase/client'
import { createSubmission } from '@/lib/actions/submissions'
import { Wifi, WifiOff, Upload, CheckCircle2, Clock, AlertTriangle, X } from 'lucide-react'

export function OfflineUploadManager() {
  const [isOnline, setIsOnline] = useState(true)
  const [queueCount, setQueueCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [queue, setQueue] = useState<QueuedPhoto[]>([])
  const [showDetails, setShowDetails] = useState(false)

  const refreshQueue = useCallback(async () => {
    const items = await getQueuedPhotos()
    setQueue(items)
    const count = items.filter(i => i.status === 'queued').length
    setQueueCount(count)
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Auto-upload when back online
      setTimeout(() => processQueue(), 1500)
    }
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Listen for service worker sync message
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'SYNC_UPLOAD') {
          processQueue()
        }
      })
    }
  }, [])

  // Load queue on mount
  useEffect(() => {
    refreshQueue()
    // Refresh every 10 seconds
    const interval = setInterval(refreshQueue, 10000)
    return () => clearInterval(interval)
  }, [refreshQueue])

  const processQueue = async () => {
    if (uploading || !navigator.onLine) return

    const items = await getQueuedPhotos()
    const pending = items.filter(i => i.status === 'queued')
    if (pending.length === 0) return

    setUploading(true)

    for (const item of pending) {
      try {
        await updateQueuedPhoto(item.id, { status: 'uploading', attempts: item.attempts + 1 })

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) continue

        // Convert base64 back to File
        const file = dataUrlToFile(item.photo.dataUrl, item.photo.name, item.photo.type)

        // Upload to Supabase Storage
        const ext = item.photo.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}-${item.id}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('submission-photos')
          .upload(filePath, file)

        if (uploadError) {
          await updateQueuedPhoto(item.id, {
            status: item.attempts >= 3 ? 'failed' : 'queued'
          })
          continue
        }

        // Create submission record
        await createSubmission({
          projectId: item.submissionData.projectId,
          milestoneId: item.submissionData.milestoneId,
          completionPercentage: item.submissionData.completionPercentage,
          notes: item.submissionData.notes,
          photos: [{
            fileName: item.photo.name,
            filePath,
            fileSize: item.photo.size,
            gpsLatitude: item.photo.gpsLatitude,
            gpsLongitude: item.photo.gpsLongitude,
            distanceFromSite: item.photo.distanceFromSite,
            takenAt: item.photo.takenAt ? new Date(item.photo.takenAt) : null,
          }]
        })

        await removeFromQueue(item.id)

      } catch (err) {
        await updateQueuedPhoto(item.id, {
          status: item.attempts >= 3 ? 'failed' : 'queued'
        })
      }
    }

    setUploading(false)
    refreshQueue()
  }

  // Don't show anything if online and queue is empty
  if (isOnline && queueCount === 0 && queue.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main pill */}
      <button
        onClick={() => setShowDetails(prev => !prev)}
        className={`
          flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg
          transition-all duration-200
          ${!isOnline
            ? 'bg-slate-800 text-white'
            : uploading
            ? 'bg-blue-600 text-white'
            : queueCount > 0
            ? 'bg-amber-500 text-white'
            : 'bg-green-500 text-white'
          }
        `}
      >
        {!isOnline ? (
          <><WifiOff className="h-4 w-4" /> Offline</>
        ) : uploading ? (
          <><Upload className="h-4 w-4 animate-bounce" /> Uploading {queueCount}…</>
        ) : queueCount > 0 ? (
          <><Clock className="h-4 w-4" /> {queueCount} queued</>
        ) : (
          <><CheckCircle2 className="h-4 w-4" /> All uploaded</>
        )}
      </button>

      {/* Details panel */}
      {showDetails && queue.length > 0 && (
        <div className="absolute bottom-14 right-0 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Upload Queue</h3>
            <button onClick={() => setShowDetails(false)}>
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
            {queue.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                {/* Thumbnail */}
                <img
                  src={item.photo.dataUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {item.submissionData.projectName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{item.photo.name}</p>
                </div>
                <div className="shrink-0">
                  {item.status === 'queued' && (
                    <span className="text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                      Queued
                    </span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                      Uploading
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="text-xs text-red-600 bg-red-50 rounded-full px-2 py-0.5">
                      Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isOnline && queueCount > 0 && (
            <div className="border-t border-slate-100 p-3">
              <button
                onClick={processQueue}
                disabled={uploading}
                className="w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading…' : `Upload ${queueCount} photo${queueCount !== 1 ? 's' : ''} now`}
              </button>
            </div>
          )}

          {!isOnline && (
            <div className="border-t border-slate-100 p-3 text-center text-xs text-slate-400">
              <WifiOff className="mx-auto mb-1 h-4 w-4" />
              Will auto-upload when network returns
            </div>
          )}
        </div>
      )}
    </div>
  )
}