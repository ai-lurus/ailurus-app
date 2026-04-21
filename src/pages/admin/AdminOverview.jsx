import { useEffect, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import { useChatContext } from '../../context/ChatContext.jsx'
import { getAllTasks } from '../../api/tasks.js'
import { getProjects } from '../../api/projects.js'
import { getSprints } from '../../api/sprints.js'
import { getUsers } from '../../api/users.js'
import {
  TasksIcon, ClockIcon, CheckCircleIcon, BoltIcon, UsersIcon, ChartIcon, FolderIcon,
} from '../../components/Icons.jsx'

const CARD_ACCENT = {
  purple: {
    icon: 'hsl(244, 100%, 69%)',
    iconBg: 'hsl(244, 100%, 69%, 0.12)',
    border: 'hsl(224, 30%, 18%)',
    change: 'hsl(244, 100%, 75%)',
  },
  yellow: {
    icon: 'hsl(43, 100%, 60%)',
    iconBg: 'hsl(43, 100%, 60%, 0.12)',
    border: 'hsl(224, 30%, 18%)',
    change: 'hsl(43, 100%, 65%)',
  },
  pink: {
    icon: 'hsl(310, 100%, 65%)',
    iconBg: 'hsl(310, 100%, 65%, 0.12)',
    border: 'hsl(224, 30%, 18%)',
    change: 'hsl(310, 100%, 70%)',
  },
  green: {
    icon: 'hsl(145, 70%, 50%)',
    iconBg: 'hsl(145, 70%, 50%, 0.12)',
    border: 'hsl(224, 30%, 18%)',
    change: 'hsl(145, 70%, 55%)',
  },
}

const PROJECT_STATUS = {
  on_track: { label: 'En tiempo',  bg: 'hsl(145, 70%, 10%)', text: 'hsl(145, 70%, 55%)', bar: 'hsl(145, 70%, 50%)' },
  at_risk:  { label: 'En riesgo',  bg: 'hsl(25, 100%, 10%)', text: 'hsl(25, 100%, 60%)', bar: 'hsl(25, 100%, 55%)' },
  delayed:  { label: 'Atrasado',   bg: 'hsl(0, 100%, 10%)',  text: 'hsl(0, 100%, 60%)',  bar: 'hsl(0, 100%, 55%)' },
  planning: { label: 'Planeación', bg: 'hsl(224, 30%, 18%)', text: 'hsl(224, 20%, 65%)', bar: 'hsl(244, 100%, 69%)' },
}

function StatCard({ icon: Icon, label, value, change, accent }) {
  const colors = CARD_ACCENT[accent] ?? CARD_ACCENT.purple
  return (
    <div
      className="rounded-xl p-5 border flex items-start gap-4"
      style={{ backgroundColor: 'hsl(224, 30%, 14%)', borderColor: colors.border }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: colors.iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: colors.icon }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>{label}</p>
        <p className="text-3xl font-bold leading-none" style={{ color: 'hsl(224, 40%, 95%)' }}>{value}</p>
        {change != null && (
          <p className="text-xs mt-1.5" style={{ color: colors.change }}>{change}</p>
        )}
      </div>
    </div>
  )
}

function ProjectHealthRow({ project }) {
  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.planning
  const progress = project.progress ?? 0
  return (
    <div className="flex items-center gap-4 py-3" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{project.name}</p>
        <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(224, 30%, 20%)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: status.bar }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{progress}%</span>
        <span
          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </span>
      </div>
    </div>
  )
}

function WorkloadRow({ user, taskCount, maxCount }) {
  const pct = maxCount > 0 ? Math.round((taskCount / maxCount) * 100) : 0
  const initials = user.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
        <span className="text-white text-[10px] font-bold">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm truncate" style={{ color: 'hsl(224, 30%, 85%)' }}>{user.name}</span>
          <span className="text-xs shrink-0 ml-2" style={{ color: 'hsl(224, 20%, 55%)' }}>{taskCount} tareas</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(224, 30%, 20%)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: 'hsl(244, 100%, 69%)' }}
          />
        </div>
      </div>
    </div>
  )
}

const AVATAR_COLORS = [
  'hsl(244, 100%, 60%)', 'hsl(145, 70%, 45%)', 'hsl(25, 100%, 55%)',
  'hsl(310, 100%, 55%)', 'hsl(200, 100%, 50%)', 'hsl(43, 100%, 55%)',
]

function avatarColor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return 'Hace un momento'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Ayer'
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}

function inferAction(task) {
  if (task.status === 'done')        return 'completó'
  if (task.status === 'in_review')   return 'envió a revisión'
  if (task.status === 'in_progress') return 'movió a In Progress'
  if (task.status === 'cancelled')   return 'canceló'
  if (task.status === 'blocked')     return 'marcó como bloqueada'
  if (task.prLink)                   return 'abrió PR en'
  return 'actualizó'
}

function ActivityItem({ task }) {
  const name     = task.assignee?.name ?? 'Alguien'
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const color    = avatarColor(name)
  const action   = inferAction(task)

  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid hsl(224, 30%, 16%)' }}>
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
        style={{ backgroundColor: color, color: 'hsl(224, 30%, 10%)' }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs leading-snug" style={{ color: 'hsl(224, 30%, 75%)' }}>
          <span style={{ color: 'hsl(224, 40%, 95%)', fontWeight: 600 }}>{name}</span>
          {' '}{action}{' '}
          <span style={{ color: 'hsl(224, 30%, 80%)' }}>{task.title}</span>
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'hsl(224, 20%, 45%)' }}>
          {task.updatedAt ? relativeTime(task.updatedAt) : ''}
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: 'hsl(224, 30%, 14%)', borderColor: 'hsl(224, 30%, 18%)' }}>
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-4" style={{ color: 'hsl(224, 20%, 55%)' }}>{title}</h2>
      {children}
    </div>
  )
}

export default function AdminOverview() {
  const { openUlai } = useChatContext()
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [sprints, setSprints]   = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    Promise.all([
      getAllTasks(),
      getProjects(),
      getSprints(null, 'active'),
      getUsers(),
    ])
      .then(([t, p, s, u]) => {
        // Compute progress per project: done tasks / total tasks
        const tasksByProject = t.reduce((acc, task) => {
          if (!acc[task.projectId]) acc[task.projectId] = { total: 0, done: 0 }
          acc[task.projectId].total++
          if (task.status === 'done') acc[task.projectId].done++
          return acc
        }, {})
        const projectsWithProgress = p.map((proj) => {
          const counts = tasksByProject[proj.id]
          const progress = counts && counts.total > 0
            ? Math.round((counts.done / counts.total) * 100)
            : 0
          return { ...proj, progress }
        })
        setTasks(t)
        setProjects(projectsWithProgress)
        setSprints(s)
        setUsers(u)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const total      = tasks.length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const inReview   = tasks.filter((t) => t.status === 'in_review').length

  const today = new Date()
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7)

  const doneToday = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const updated = t.updatedAt ? new Date(t.updatedAt) : null
    return updated && updated.toDateString() === today.toDateString()
  }).length

  const doneSinceYesterday = tasks.filter((t) => {
    if (t.status !== 'done') return false
    const updated = t.updatedAt ? new Date(t.updatedAt) : null
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    return updated && updated >= yesterday
  }).length

  const addedThisWeek = tasks.filter((t) => {
    const created = t.createdAt ? new Date(t.createdAt) : null
    return created && created >= weekAgo
  }).length

  const activeDevs = users.filter((u) =>
    ['developer', 'designer'].includes(u.role) &&
    tasks.some((t) => t.assignedTo === u.id && t.status === 'in_progress')
  ).length

  const prCount = tasks.filter((t) => t.status === 'in_review' && t.prLink).length

  const tasksByUser = users.map((u) => ({
    user: u,
    count: tasks.filter((t) => t.assignee?.id === u.id || t.assignedTo === u.id).length,
  })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count)

  const maxCount = tasksByUser[0]?.count ?? 1

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0))
    .slice(0, 8)

  const activeProjects = projects.filter((p) => p.status !== 'completed' && p.status !== 'cancelled')

  const STAT_CARDS = [
    { icon: TasksIcon,       label: 'Total tareas',     value: total,      change: `+${addedThisWeek} esta semana`,                                          accent: 'purple' },
    { icon: ClockIcon,       label: 'En progreso',      value: inProgress, change: `${activeDevs} desarrollador${activeDevs !== 1 ? 'es' : ''} activo${activeDevs !== 1 ? 's' : ''}`, accent: 'yellow' },
    { icon: BoltIcon,        label: 'En revisión',      value: inReview,   change: prCount > 0 ? `${prCount} PR${prCount !== 1 ? 's' : ''} esperando` : 'Pendientes de aprobación', accent: 'pink'   },
    { icon: CheckCircleIcon, label: 'Completadas hoy',  value: doneToday,  change: `+${doneSinceYesterday} vs. ayer`,                                         accent: 'green'  },
  ]

  return (
    <Layout>
      <div className="px-8 py-8">
        {loading && (
          <div className="flex justify-center py-20 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Cargando…</div>
        )}

        {error && (
          <div className="rounded-xl px-5 py-4 text-sm" style={{ backgroundColor: 'hsl(0, 100%, 10%)', border: '1px solid hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>
            {error}
          </div>
        )}

        {!loading && !error && (() => {
          const atRiskCount = activeProjects.filter((p) => p.status === 'at_risk' || p.status === 'delayed').length
          return atRiskCount > 0 ? (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3 mb-6 border"
              style={{ backgroundColor: 'hsl(244, 100%, 10%)', borderColor: 'hsl(244, 100%, 30%)' }}
            >
              <span className="text-base mt-0.5">✦</span>
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'hsl(244, 40%, 95%)' }}>
                  <span style={{ color: 'hsl(259, 100%, 75%)' }}>Ulai sugiere: </span>
                  {atRiskCount} proyecto{atRiskCount !== 1 ? 's' : ''} {atRiskCount !== 1 ? 'necesitan' : 'necesita'} atención esta semana
                </p>
                <div className="flex gap-3 mt-1">
                  <button onClick={() => openUlai('¿Qué proyectos están en riesgo?')} className="text-xs underline cursor-pointer" style={{ color: 'hsl(244, 100%, 69%)' }}>Ver en riesgo</button>
                  <button onClick={() => openUlai('Resumen del equipo esta semana')} className="text-xs underline cursor-pointer" style={{ color: 'hsl(244, 100%, 69%)' }}>Actividad reciente</button>
                </div>
              </div>
            </div>
          ) : null
        })()}

        {!loading && !error && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {STAT_CARDS.map(({ icon, label, value, change, accent }) => (
                <StatCard key={label} icon={icon} label={label} value={value} change={change} accent={accent} />
              ))}
            </div>

            {/* Middle row: project health + team velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <Section title="Salud de proyectos">
                  {activeProjects.length === 0 ? (
                    <p className="text-sm" style={{ color: 'hsl(224, 20%, 50%)' }}>Sin proyectos activos.</p>
                  ) : (
                    activeProjects.slice(0, 6).map((p) => <ProjectHealthRow key={p.id} project={p} />)
                  )}
                </Section>
              </div>

              <div>
                <Section title="Velocidad del equipo">
                  <div className="space-y-4">
                    {[
                      { icon: ChartIcon,  label: 'Tareas completadas', value: tasks.filter((t) => t.status === 'done').length },
                      { icon: FolderIcon, label: 'Proyectos activos',   value: activeProjects.length },
                      { icon: BoltIcon,   label: 'Sprints activos',     value: sprints.length },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" style={{ color: 'hsl(244, 100%, 69%)' }} />
                          <span className="text-sm" style={{ color: 'hsl(224, 30%, 75%)' }}>{label}</span>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </div>

            {/* Bottom row: workload + activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Section title="Distribución de carga">
                {tasksByUser.length === 0 ? (
                  <p className="text-sm" style={{ color: 'hsl(224, 20%, 50%)' }}>Sin datos de asignación.</p>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <UsersIcon className="w-4 h-4" style={{ color: 'hsl(224, 20%, 55%)' }} />
                      <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{tasksByUser.length} miembros con tareas asignadas</span>
                    </div>
                    {tasksByUser.slice(0, 7).map(({ user, count }) => (
                      <WorkloadRow key={user.id} user={user} taskCount={count} maxCount={maxCount} />
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Actividad reciente">
                {recentTasks.length === 0 ? (
                  <p className="text-sm" style={{ color: 'hsl(224, 20%, 50%)' }}>Sin actividad reciente.</p>
                ) : (
                  recentTasks.map((t) => <ActivityItem key={t.id} task={t} />)
                )}
              </Section>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
