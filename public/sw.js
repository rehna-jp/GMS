// public/sw.js
// Service Worker — handles offline caching and background sync

const CACHE_NAME = 'gms-v1'
const OFFLINE_URLS = [
  '/',
  '/submissions/new',
  '/submissions',
  '/dashboard',
]

// ── Install: cache essential pages ───────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(OFFLINE_URLS).catch(() => {
        // Don't fail install if some pages can't be cached
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: serve from cache when offline ──────────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return

  // Don't intercept Supabase API calls
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for navigation requests
        if (event.request.mode === 'navigate') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          // For navigation, serve the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/submissions/new')
          }
        })
      })
  )
})

// ── Background Sync: upload queued photos when back online ───────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'upload-photos') {
    event.waitUntil(uploadQueuedPhotos())
  }
})

async function uploadQueuedPhotos() {
  // Notify all open clients to trigger upload
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_UPLOAD' })
  })
}

// ── Push: handle online/offline messages from app ────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})