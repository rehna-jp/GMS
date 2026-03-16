// lib/utils/offline-queue.ts
// IndexedDB-based offline photo queue

const DB_NAME = 'gms-offline'
const DB_VERSION = 1
const STORE_NAME = 'photo-queue'

export interface QueuedPhoto {
  id: string
  submissionData: {
    projectId: string
    projectName: string
    milestoneId?: string
    completionPercentage: number
    notes: string
  }
  photo: {
    name: string
    type: string
    size: number
    dataUrl: string // base64 encoded
    gpsLatitude: number | null
    gpsLongitude: number | null
    distanceFromSite: number | null
    takenAt: string | null
  }
  queuedAt: string
  status: 'queued' | 'uploading' | 'uploaded' | 'failed'
  attempts: number
}

// Open IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('status', 'status')
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Add photo to queue
export async function queuePhoto(data: Omit<QueuedPhoto, 'id' | 'queuedAt' | 'status' | 'attempts'>): Promise<string> {
  const db = await openDB()
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const item: QueuedPhoto = {
    ...data,
    id,
    queuedAt: new Date().toISOString(),
    status: 'queued',
    attempts: 0,
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add(item)
    request.onsuccess = () => resolve(id)
    request.onerror = () => reject(request.error)
  })
}

// Get all queued photos
export async function getQueuedPhotos(): Promise<QueuedPhoto[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Update photo status
export async function updateQueuedPhoto(id: string, updates: Partial<QueuedPhoto>): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const item = { ...getRequest.result, ...updates }
      const putRequest = store.put(item)
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Remove uploaded photo from queue
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get count of pending items
export async function getQueueCount(): Promise<number> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('status')
    const request = index.count(IDBKeyRange.only('queued'))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Convert File to base64 dataUrl
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Convert base64 dataUrl back to File
export function dataUrlToFile(dataUrl: string, fileName: string, type: string): File {
  const arr = dataUrl.split(',')
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], fileName, { type })
}