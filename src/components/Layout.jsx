import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { logout } from '../api/auth.js'
import {
  DashboardIcon, HomeIcon, LearningIcon, LogoutIcon,
  BoardIcon, FolderIcon, UsersIcon, ReportIcon, CodeIcon,
} from './Icons.jsx'

const ADMIN_NAV = [
  { path: '/dashboard',      label: 'Overview',     Icon: DashboardIcon },
  { path: '/admin/board',    label: 'Board',        Icon: BoardIcon     },
  { path: '/admin/projects', label: 'Projects',     Icon: FolderIcon    },
  { path: '/admin/team',     label: 'Team',         Icon: UsersIcon     },
  { path: '/admin/reports',  label: 'Reports',      Icon: ReportIcon    },
  { path: '/admin/reviews',  label: 'Code Reviews', Icon: CodeIcon      },
  { path: '/admin/learning', label: 'Learning',     Icon: LearningIcon  },
]

const NAV_BY_ROLE = {
  ceo:       ADMIN_NAV,
  admin:     ADMIN_NAV,
  developer: [{ path: '/home', label: 'Today', Icon: HomeIcon }, { path: '/admin/board', label: 'Board', Icon: BoardIcon }, { path: '/learning', label: 'Learning', Icon: LearningIcon }],
  designer:  [{ path: '/home', label: 'Today', Icon: HomeIcon }, { path: '/admin/board', label: 'Board', Icon: BoardIcon }, { path: '/learning', label: 'Learning', Icon: LearningIcon }],
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
  const { user } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  async function handleLogout() {
    try { await logout() } catch { /* ignore */ }
    navigate('/', { replace: true })
  }

  const navItems = user ? (NAV_BY_ROLE[user.role] ?? []) : []

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0 fixed inset-y-0 left-0 z-20">
        {/* Brand */}
        <div className="px-4 h-16 flex items-center gap-3 border-b border-slate-800 shrink-0">
          <img src="/favicon-64.png" alt="ai-lurus" className="w-8 h-8 rounded-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm tracking-tight leading-none">ai-lurus.</p>
            <p className="text-[9px] font-semibold tracking-[0.12em] uppercase leading-none mt-0.5 truncate" style={{ color: '#00D4FF' }}>
              CONFIANZA EN TECNOLOGÍA
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, label, Icon }) => {
            const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-slate-800 shrink-0">
          {user && (
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 mb-3 px-1 w-full text-left hover:bg-slate-800 rounded-lg py-1.5 transition-colors"
            >
              <Avatar name={user.name} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-all duration-150 cursor-pointer"
          >
            <LogoutIcon className="w-4 h-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content (offset for sidebar) ── */}
      <main className="flex-1 min-w-0 ml-56">
        {children}
      </main>
    </div>
  )
}
