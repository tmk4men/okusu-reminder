// おくすリマインダー Service Worker
const CACHE = 'okusu-v1'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg', '/pwa-192x192.png', '/pwa-512x512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/')))
    return
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit
      return fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(req, clone))
        }
        return res
      }).catch(() => caches.match('/'))
    }),
  )
})

self.addEventListener('notificationclick', (e) => {
  const action = e.action
  const data = e.notification.data || {}
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const url =
        action === 'taken' && data.scheduleId
          ? `/?take=${data.scheduleId}`
          : action === 'later' && data.scheduleId
          ? `/?later=${data.scheduleId}`
          : '/'
      const client = clients.find((c) => c.url.includes(self.registration.scope))
      if (client) {
        client.focus()
        client.postMessage({ type: 'notification-action', action, data })
        return
      }
      return self.clients.openWindow(url)
    }),
  )
})
