// lib/utils/gps.ts
// Haversine formula for GPS distance calculation

export interface GPSCoordinates {
  latitude: number
  longitude: number
}

export interface GPSVerificationResult {
  distance: number // in meters
  status: 'verified' | 'review' | 'flagged'
  label: string
  color: string
  icon: string
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  point1: GPSCoordinates,
  point2: GPSCoordinates
): number {
  const R = 6371000 // Earth's radius in meters

  const lat1Rad = toRadians(point1.latitude)
  const lat2Rad = toRadians(point2.latitude)
  const deltaLat = toRadians(point2.latitude - point1.latitude)
  const deltaLon = toRadians(point2.longitude - point1.longitude)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Verify GPS proximity and return verification result
 * < 100m  → verified
 * 100–500m → review
 * > 500m  → flagged
 */
export function verifyGPSProximity(
  photoGPS: GPSCoordinates,
  projectGPS: GPSCoordinates
): GPSVerificationResult {
  const distance = calculateDistance(photoGPS, projectGPS)

  if (distance < 100) {
    return {
      distance,
      status: 'verified',
      label: 'GPS Verified',
      color: 'green',
      icon: '✅',
    }
  } else if (distance <= 500) {
    return {
      distance,
      status: 'review',
      label: 'Needs Review',
      color: 'yellow',
      icon: '⚠️',
    }
  } else {
    return {
      distance,
      status: 'flagged',
      label: 'Location Mismatch',
      color: 'red',
      icon: '🚩',
    }
  }
}

/** Format distance for display */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(2)}km`
}