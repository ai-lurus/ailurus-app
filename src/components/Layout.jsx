import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { logout } from '../api/auth.js'
import { getUnreadCount } from '../api/notifications.js'
import { useChatContext } from '../context/ChatContext.jsx'
import {
  DashboardIcon, HomeIcon, LearningIcon, LogoutIcon,
  BoardIcon, FolderIcon, UsersIcon, ReportIcon, CodeIcon, SprintIcon, SparklesIcon, BellIcon,
} from './Icons.jsx'
import NotificationPanel from './NotificationPanel.jsx'
import UlaiPanel from './UlaiPanel.jsx'
import UlaiSearchBar from './UlaiSearchBar.jsx'

const ADMIN_NAV = [
  { path: '/admin/overview', label: 'Inicio',        Icon: HomeIcon      },
  { path: '/dashboard',      label: 'Overview',     Icon: DashboardIcon },
  { path: '/admin/board',    label: 'Board',        Icon: BoardIcon     },
  { path: '/admin/sprints',  label: 'Sprints',      Icon: SprintIcon    },
  { path: '/admin/projects', label: 'Projects',     Icon: FolderIcon    },
  { path: '/admin/team',     label: 'Team',         Icon: UsersIcon     },
  { path: '/admin/reports',  label: 'Reports',      Icon: ReportIcon    },
  { path: '/admin/reviews',  label: 'Code Reviews', Icon: CodeIcon      },
  { path: '/admin/learning', label: 'Learning',     Icon: LearningIcon  },
  { path: '/ulai',           label: 'Ulai',         Icon: SparklesIcon  },
]

const DEV_NAV = [
  { path: '/home',        label: 'Today',    Icon: HomeIcon      },
  { path: '/admin/board', label: 'Board',    Icon: BoardIcon     },
  { path: '/projects',    label: 'Projects', Icon: FolderIcon    },
  { path: '/learning',    label: 'Learning', Icon: LearningIcon  },
  { path: '/ulai',        label: 'Ulai',     Icon: SparklesIcon  },
]

const NAV_BY_ROLE = {
  ceo:       ADMIN_NAV,
  admin:     ADMIN_NAV,
  developer: DEV_NAV,
  designer:  DEV_NAV,
  client:    [{ path: '/dashboard', label: 'Overview', Icon: DashboardIcon }],
}

function Avatar({ name }) {
  const initial = name?.[0]?.toUpperCase() ?? '?'
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
      <span className="text-white text-xs font-bold">{initial}</span>
    </div>
  )
}

export default function Layout({ children }) {
  const { user }          = useAuth()
  const navigate           = useNavigate()
  const location           = useLocation()
  const { ulaiOpen, setUlaiOpen } = useChatContext()
  const [notifOpen, setNotifOpen]       = useState(false)
  const [unreadCount, setUnreadCount]   = useState(0)

  useEffect(() => {
    if (!user) return
    getUnreadCount().then(({ count }) => setUnreadCount(count)).catch(() => {})
  }, [user])

  async function handleLogout() {
    try { await logout() } catch { /* ignore */ }
    navigate('/', { replace: true })
  }

  const navItems = user ? (NAV_BY_ROLE[user.role] ?? []) : []

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'hsl(224, 35%, 10%)' }}>
      {/* ── Sidebar ── */}
      <aside className="w-56 flex flex-col shrink-0 fixed inset-y-0 left-0 z-20" style={{ backgroundColor: 'hsl(224, 45%, 7%)' }}>
        {/* Brand */}
        <div className="px-4 h-16 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          <img src="/favicon-64.png" alt="ai-lurus" className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm tracking-tight leading-none">ai-lurus.</p>
            <p className="text-[9px] font-semibold tracking-[0.12em] uppercase leading-none mt-0.5 truncate" style={{ color: 'hsl(187, 100%, 50%)' }}>
              CONFIANZA EN TECNOLOGÍA
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, Icon }) => {
            const isUlai = path === '/ulai'
            const active = isUlai
              ? ulaiOpen
              : location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
            return (
              <button
                key={path}
                onClick={() => isUlai ? setUlaiOpen(true) : navigate(path)}
                style={
                  active ? {
                    background: 'linear-gradient(135deg, hsl(244 100% 69% / 0.15), hsl(187 100% 50% / 0.08))',
                    color: 'white',
                    borderLeft: '2px solid hsl(244, 100%, 69%)',
                  } : {
                    color: 'hsl(224, 20%, 55%)',
                  }
                }
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer pl-2.5 ${
                  !active && 'hover:bg-slate-800/40 hover:text-slate-100'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 shrink-0" style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 mb-3 px-1 w-full text-left rounded-lg py-1.5 transition-colors hover:bg-slate-800/40"
            >
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate leading-tight" style={{ color: 'hsl(224, 40%, 95%)' }}>{user.name}</p>
                <p className="text-xs capitalize" style={{ color: 'hsl(224, 20%, 55%)' }}>{user.role}</p>
              </div>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer hover:bg-slate-800/40"
            style={{ color: 'hsl(224, 20%, 55%)' }}
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content (offset for sidebar) ── */}
      <main className="flex-1 min-w-0 ml-56 flex flex-col">
        {/* Top header bar */}
        <header
          className="h-14 shrink-0 sticky top-0 z-10 flex items-center justify-between px-8"
          style={{
            backgroundColor: 'hsl(224, 35%, 10%)',
            borderBottom: '1px solid hsl(224, 30%, 16%)',
          }}
        >
          <UlaiSearchBar onOpen={() => setUlaiOpen(true)} />

          <button
            onClick={() => setNotifOpen(true)}
            className="relative p-2 rounded-lg transition-colors cursor-pointer hover:bg-white/[0.05]"
            style={{ color: 'hsl(224, 20%, 60%)' }}
            aria-label="Notificaciones"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'white' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onUnreadChange={setUnreadCount} />
      <UlaiPanel open={ulaiOpen} onClose={() => setUlaiOpen(false)} />
    </div>
  )
}
