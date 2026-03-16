// components/submissions/GPSVerification.tsx
'use client'

import { GPSVerificationResult, formatDistance } from '@/lib/utils/gps'
import { CheckCircle2, AlertTriangle, XCircle, MapPin, Navigation } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface GPSVerificationProps {
  result: GPSVerificationResult | null
  photoGPS: { latitude: number | null; longitude: number | null }
  projectGPS: { latitude: number; longitude: number }
  photoName?: string
}

export function GPSVerification({
  result,
  photoGPS,
  projectGPS,
  photoName,
}: GPSVerificationProps) {
  if (!photoGPS.latitude || !photoGPS.longitude) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="font-medium text-amber-800">No GPS Data in Photo</p>
          <p className="text-amber-700">
            This photo has no embedded GPS coordinates. Enable location in your camera app,
            or your submission will be flagged for manual review.
          </p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const iconMap = {
    verified: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />,
    review: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />,
    flagged: <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />,
  }

  const bgMap = {
    verified: 'bg-green-50 border-green-200',
    review: 'bg-amber-50 border-amber-200',
    flagged: 'bg-red-50 border-red-200',
  }

  const textMap = {
    verified: 'text-green-800',
    review: 'text-amber-800',
    flagged: 'text-red-800',
  }

  const subTextMap = {
    verified: 'text-green-700',
    review: 'text-amber-700',
    flagged: 'text-red-700',
  }

  const badgeMap = {
    verified: 'bg-green-100 text-green-800 border-green-300',
    review: 'bg-amber-100 text-amber-800 border-amber-300',
    flagged: 'bg-red-100 text-red-800 border-red-300',
  }

  const messages = {
    verified: `Photo taken within ${formatDistance(result.distance)} of project site. GPS verified.`,
    review: `Photo taken ${formatDistance(result.distance)} from project site. An official will review this.`,
    flagged: `Photo taken ${formatDistance(result.distance)} from project site — too far. This submission will be flagged.`,
  }

  return (
    <div className={`rounded-lg border p-3 text-sm ${bgMap[result.status]}`}>
      <div className="flex items-start gap-3">
        {iconMap[result.status]}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-medium ${textMap[result.status]}`}>{result.label}</p>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badgeMap[result.status]}`}>
              {formatDistance(result.distance)} from site
            </span>
          </div>
          <p className={`mt-0.5 ${subTextMap[result.status]}`}>{messages[result.status]}</p>

          {/* Coordinate Details */}
          <div className={`mt-2 flex gap-4 flex-wrap text-xs ${subTextMap[result.status]}`}>
            <span className="flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              Photo: {photoGPS.latitude!.toFixed(6)}, {photoGPS.longitude!.toFixed(6)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Site: {projectGPS.latitude.toFixed(6)}, {projectGPS.longitude.toFixed(6)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Compact badge used in submission lists ────────────────────────────────────

interface GPSBadgeProps {
  status: 'verified' | 'review' | 'flagged' | null
  distance?: number | null
  noGPS?: boolean
}

export function GPSBadge({ status, distance, noGPS }: GPSBadgeProps) {
  if (noGPS || !status) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        <AlertTriangle className="h-3 w-3" /> No GPS
      </span>
    )
  }

  const cfg = {
    verified: {
      classes: 'border-green-300 bg-green-100 text-green-800',
      Icon: CheckCircle2,
      label: distance ? `✅ ${formatDistance(distance)}` : '✅ Verified',
    },
    review: {
      classes: 'border-amber-300 bg-amber-100 text-amber-800',
      Icon: AlertTriangle,
      label: distance ? `⚠️ ${formatDistance(distance)}` : '⚠️ Review',
    },
    flagged: {
      classes: 'border-red-300 bg-red-100 text-red-800',
      Icon: XCircle,
      label: distance ? `🚩 ${formatDistance(distance)}` : '🚩 Flagged',
    },
  }[status]

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}