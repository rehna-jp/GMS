// lib/utils/exif.ts
// Extract GPS coordinates from photo EXIF metadata

export interface ExtractedGPS {
  latitude: number | null
  longitude: number | null
  takenAt: Date | null
  hasGPS: boolean
}

/**
 * Extract GPS data from a photo File object using exif-parser.
 * Run client-side (browser) only.
 */
export async function extractGPSFromPhoto(file: File): Promise<ExtractedGPS> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        if (!buffer) {
          resolve({ latitude: null, longitude: null, takenAt: null, hasGPS: false })
          return
        }

        // Dynamically import exif-parser (client only)
        import('exif-parser').then((ExifParserModule) => {
          try {
            const ExifParser = ExifParserModule.default ?? ExifParserModule
            const parser = ExifParser.create(buffer)
            parser.enableSimpleValues(true)
            const result = parser.parse()
            const tags = result.tags

            // GPS extraction
            const lat = tags?.GPSLatitude ?? null
            const lon = tags?.GPSLongitude ?? null

            // DateTime extraction
            let takenAt: Date | null = null
            if (tags?.DateTimeOriginal) {
              // EXIF date format: "YYYY:MM:DD HH:MM:SS"
              const raw = tags.DateTimeOriginal as string
              const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
              takenAt = new Date(normalized)
            }

            resolve({
              latitude: typeof lat === 'number' ? lat : null,
              longitude: typeof lon === 'number' ? lon : null,
              takenAt,
              hasGPS: typeof lat === 'number' && typeof lon === 'number',
            })
          } catch {
            resolve({ latitude: null, longitude: null, takenAt: null, hasGPS: false })
          }
        }).catch(() => {
          resolve({ latitude: null, longitude: null, takenAt: null, hasGPS: false })
        })
      } catch {
        resolve({ latitude: null, longitude: null, takenAt: null, hasGPS: false })
      }
    }

    reader.onerror = () => {
      resolve({ latitude: null, longitude: null, takenAt: null, hasGPS: false })
    }

    // Read only the first 128KB — enough for EXIF headers
    const blob = file.slice(0, 131072)
    reader.readAsArrayBuffer(blob)
  })
}

/** Validate file is an acceptable image */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif']

  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Only JPEG, PNG, and HEIC photos are accepted.' }
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: `Photo must be under 5MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` }
  }

  return { valid: true }
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}