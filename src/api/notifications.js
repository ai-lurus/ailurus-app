const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include', ...options })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function getNotifications() {
  return api('/api/notifications')
}

export function getUnreadCount() {
  return api('/api/notifications/unread-count')
}

export function markNotificationRead(id) {
  return api(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsRead() {
  return api('/api/notifications/read-all', { method: 'PATCH' })
}
