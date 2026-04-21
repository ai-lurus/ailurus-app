import { useState, useEffect, useCallback } from 'react'
import { XIcon } from './Icons.jsx'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications.js'

const TABS = [
  { id: 'all',       label: 'Todas'    },
  { id: 'unread',    label: 'Sin leer' },
  { id: 'mentions',  label: 'Menciones' },
]

function groupByDay(notifications) {
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  const hoy = []
  const ayer = []
  const antes = []

  for (const n of notifications) {
    const d = new Date(n.createdAt).toDateString()
    if (d === todayStr) hoy.push(n)
    else if (d === yesterdayStr) ayer.push(n)
    else antes.push(n)
  }

  return { hoy, ayer, antes }
}

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  return `Hace ${Math.floor(hrs / 24)} días`
}

const TYPE_COLORS = {
  mencion: 'hsl(244, 100%, 65%)',
  tarea:   'hsl(187, 100%, 40%)',
  sistema: 'hsl(145, 70%, 45%)',
}

function initials(title) {
  return title.slice(0, 2).toUpperCase()
}

function NotificationItem({ notification, onMarkRead }) {
  const color = TYPE_COLORS[notification.type] ?? 'hsl(224, 20%, 55%)'
  return (
    <button
      onClick={() => !notification.read && onMarkRead(notification.id)}
      className="w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03] cursor-pointer"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
        style={{ backgroundColor: color + '33', color }}
      >
        {initials(notification.title)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug" style={{ color: 'hsl(224, 40%, 95%)' }}>
          {notification.title}
        </p>
        {notification.description && (
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'hsl(224, 20%, 55%)' }}>
            {notification.description}
          </p>
        )}
        <p className="text-[11px] mt-1" style={{ color: 'hsl(224, 20%, 45%)' }}>
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ backgroundColor: 'hsl(244, 100%, 69%)' }} />
      )}
    </button>
  )
}

export default function NotificationPanel({ open, onClose, onUnreadChange }) {
  const [tab, setTab] = useState('all')
  const [notifications, setNotifications] = useState([])

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    onUnreadChange?.(unreadCount)
  }, [unreadCount, onUnreadChange])

  const fetchNotifications = useCallback(async () => {
    try {
      const { notifications: data } = await getNotifications()
      setNotifications(data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    try { await markNotificationRead(id) } catch { /* silent */ }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try { await markAllNotificationsRead() } catch { /* silent */ }
  }

  const filtered = notifications.filter((n) => {
    if (tab === 'unread')   return !n.read
    if (tab === 'mentions') return n.type === 'mencion'
    return true
  })

  const { hoy, ayer, antes } = groupByDay(filtered)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col"
        style={{
          width: '420px',
          backgroundColor: 'hsl(224, 45%, 9%)',
          borderLeft: '1px solid hsl(224, 30%, 18%)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>Notificaciones</h2>
            {unreadCount > 0 && (
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'white' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs transition-colors cursor-pointer"
                style={{ color: 'hsl(244, 100%, 75%)' }}
              >
                Marcar todas
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/[0.05]"
              style={{ color: 'hsl(224, 20%, 55%)' }}
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 pb-0 gap-1 shrink-0" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-3 pb-3 text-sm font-medium transition-colors cursor-pointer relative"
              style={tab === id ? { color: 'hsl(224, 40%, 95%)' } : { color: 'hsl(224, 20%, 50%)' }}
            >
              {label}
              {tab === id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                  style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <p className="text-sm" style={{ color: 'hsl(224, 20%, 45%)' }}>Sin notificaciones</p>
            </div>
          )}

          {hoy.length > 0 && (
            <div>
              <p className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(224, 20%, 40%)' }}>
                Hoy
              </p>
              {hoy.map((n) => <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />)}
            </div>
          )}

          {ayer.length > 0 && (
            <div>
              <p className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(224, 20%, 40%)' }}>
                Ayer
              </p>
              {ayer.map((n) => <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />)}
            </div>
          )}

          {antes.length > 0 && (
            <div>
              <p className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(224, 20%, 40%)' }}>
                Antes
              </p>
              {antes.map((n) => <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
