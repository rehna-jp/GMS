declare module 'exif-parser' {
  interface ExifTags {
    GPSLatitude?: number
    GPSLongitude?: number
    DateTimeOriginal?: string
    [key: string]: unknown
  }

  interface ExifResult {
    tags: ExifTags
  }

  interface Parser {
    enableSimpleValues(enabled: boolean): void
    parse(): ExifResult
  }

  function create(buffer: ArrayBuffer): Parser
  export = { create }
}