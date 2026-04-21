import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProject, getProjectDashboard } from '../api/projects.js'
import { useAuth } from '../hooks/useAuth.js'
import Layout from '../components/Layout.jsx'

const STATUS_CONFIG = {
  on_track: { label: 'On Track', dot: 'bg-emerald-500', classes: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  at_risk:  { label: 'At Risk',  dot: 'bg-amber-500',  classes: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  delayed:  { label: 'Delayed',  dot: 'bg-red-500',    classes: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  active:   { label: 'Active',   dot: 'bg-indigo-500', classes: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
  completed:{ label: 'Completed',dot: 'bg-slate-400',  classes: 'bg-slate-600/20 text-slate-400 border border-slate-500/30' },
}

const TASK_STATUS_LABEL = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review',
  done: 'Done', blocked: 'Blocked',
}

const TASK_STATUS_COLOR = {
  todo: 'bg-slate-600/20 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  in_review: 'bg-purple-500/20 text-purple-400',
  done: 'bg-emerald-500/20 text-emerald-400',
  blocked: 'bg-red-500/20 text-red-400',
}

const ROLE_COLORS = {
  developer: 'bg-blue-500/20 text-blue-400',
  designer:  'bg-purple-500/20 text-purple-400',
  pm:        'bg-orange-500/20 text-orange-400',
  ceo:       'bg-indigo-500/20 text-indigo-400',
  admin:     'bg-slate-600/20 text-slate-400',
}

function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: accent ? 'hsl(0, 100%, 10%)' : 'hsl(224, 30%, 14%)', borderColor: accent ? 'hsl(0, 100%, 20%)' : 'hsl(224, 30%, 18%)' }}>
      <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent ? 'hsl(0, 100%, 60%)' : 'hsl(224, 40%, 95%)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'hsl(224, 20%, 55%)' }}>{sub}</p>}
    </div>
  )
}

function ProgressBar({ percent }) {
  const pct = percent ?? 0
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-400' : 'bg-indigo-500'
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(224, 25%, 20%)' }}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const backTo = ['developer', 'designer'].includes(user?.role) ? '/projects' : '/dashboard'
  const canViewFinancials = ['ceo', 'admin'].includes(user?.role)
  const [project, setProject]     = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    Promise.all([getProject(id), getProjectDashboard(id)])
      .then(([p, d]) => { setProject(p); setDashboard(d) })
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <Layout><div className="flex justify-center py-20 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</div></Layout>
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="rounded-xl px-5 py-4 text-sm" style={{ backgroundColor: 'hsl(0, 100%, 10%)', border: '1px solid hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>{error ?? 'Project not found.'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm hover:underline" style={{ color: 'hsl(244, 100%, 69%)' }}>← Back</button>
        </div>
      </Layout>
    )
  }

  const status = STATUS_CONFIG[project.status] ?? { label: project.status, dot: 'bg-slate-400', classes: 'bg-slate-100 text-slate-600 border border-slate-200' }
  const allMembers = project.teams.flatMap((t) => t.teamMembers.map((m) => ({ ...m.user, teamName: t.name })))
  const uniqueMembers = [...new Map(allMembers.map((m) => [m.id, m])).values()]

  const taskBreakdown = dashboard?.taskBreakdown ?? {}
  const totalTasks = Object.values(taskBreakdown).reduce((s, n) => s + n, 0)

  return (
    <Layout>
      <div className="px-8 py-8 max-w-6xl">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(backTo)} className="text-xs mb-3 flex items-center gap-1 transition-colors" style={{ color: 'hsl(224, 20%, 55%)' }}>
            ← Back
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>{project.name}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${status.classes}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md capitalize" style={{ backgroundColor: 'hsl(224, 25%, 20%)', color: 'hsl(224, 20%, 55%)' }}>
                  {project.type}
                </span>
              </div>
              {project.description && <p className="text-sm mt-1 max-w-2xl" style={{ color: 'hsl(224, 20%, 55%)' }}>{project.description}</p>}
            </div>
            <Link
              to={`/projects/${project.id}/documents`}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0"
              style={{
                color: 'hsl(244, 100%, 69%)',
                backgroundColor: 'hsl(244, 100%, 10%)',
                border: '1px solid hsl(244, 100%, 20%)',
              }}
            >
              📄 Documents
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {canViewFinancials && <StatCard label="Budget" value={formatCurrency(project.budget)} />}
          <StatCard label="Deadline" value={formatDate(project.deadline)} />
          <StatCard
            label="Open Blockers"
            value={dashboard?.openBlockers?.length ?? 0}
            accent={(dashboard?.openBlockers?.length ?? 0) > 0}
          />
          <StatCard label="Total Tasks" value={totalTasks} />
        </div>

        {/* Timeline burn — financial metric, only for admin/CEO */}
        {canViewFinancials && dashboard?.budgetBurnPercent != null && (
          <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: 'hsl(224, 30%, 85%)' }}>Timeline Progress</p>
              <p className="text-sm font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>{dashboard.budgetBurnPercent}%</p>
            </div>
            <ProgressBar percent={dashboard.budgetBurnPercent} />
            <p className="text-xs mt-2" style={{ color: 'hsl(224, 20%, 55%)' }}>
              {formatDate(project.createdAt)} → {formatDate(project.deadline)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active sprint */}
            {dashboard?.activeSprint && (
              <section className="rounded-xl p-5" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'hsl(224, 30%, 85%)' }}>Active Sprint</h2>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium" style={{ color: 'hsl(224, 40%, 95%)' }}>{dashboard.activeSprint.name}</p>
                  <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>
                    {formatDate(dashboard.activeSprint.startDate)} → {formatDate(dashboard.activeSprint.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(224, 25%, 20%)' }}>
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: dashboard.activeSprint.totalPoints > 0 ? `${Math.round((dashboard.activeSprint.velocity / dashboard.activeSprint.totalPoints) * 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-xs shrink-0" style={{ color: 'hsl(224, 20%, 55%)' }}>
                    {dashboard.activeSprint.velocity} / {dashboard.activeSprint.totalPoints} pts
                  </p>
                </div>
              </section>
            )}

            {/* Task breakdown */}
            {totalTasks > 0 && (
              <section className="rounded-xl p-5" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'hsl(224, 30%, 85%)' }}>Task Breakdown</h2>
                <div className="space-y-2">
                  {Object.entries(taskBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize min-w-[90px] text-center ${TASK_STATUS_COLOR[status] ?? 'bg-slate-600/20 text-slate-400'}`}>
                        {TASK_STATUS_LABEL[status] ?? status}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(224, 25%, 20%)' }}>
                        <div
                          className={`h-full rounded-full ${TASK_STATUS_COLOR[status]?.split(' ')[0].replace('bg-', 'bg-') ?? 'bg-slate-400'}`}
                          style={{ width: `${Math.round((count / totalTasks) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs w-5 text-right" style={{ color: 'hsl(224, 20%, 55%)' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Open blockers */}
            {dashboard?.openBlockers?.length > 0 && (
              <section className="rounded-xl p-5" style={{ backgroundColor: 'hsl(0, 100%, 10%)', border: '1px solid hsl(0, 100%, 20%)' }}>
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'hsl(0, 100%, 60%)' }}>Open Blockers</h2>
                <ul className="space-y-2">
                  {dashboard.openBlockers.map((b) => (
                    <li key={b.id} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'hsl(224, 40%, 95%)' }}>{b.title}</span>
                      {b.assignee && <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{b.assignee.name}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Goals */}
            {project.goals?.length > 0 && (
              <section className="rounded-xl p-5" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'hsl(224, 30%, 85%)' }}>Goals</h2>
                <ul className="space-y-2">
                  {project.goals.map((g) => (
                    <li key={g.id} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'hsl(224, 40%, 95%)' }}>{g.title}</span>
                      <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{formatDate(g.deadline)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Right column — Team */}
          <div className="space-y-6">
            <section className="rounded-xl p-5" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'hsl(224, 30%, 85%)' }}>Team</h2>
              {uniqueMembers.length === 0 ? (
                <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>No members assigned.</p>
              ) : (
                <ul className="space-y-3">
                  {uniqueMembers.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(244, 100%, 15%)' }}>
                        <span className="text-xs font-bold" style={{ color: 'hsl(244, 100%, 69%)' }}>{m.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{m.name}</p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${ROLE_COLORS[m.role] ?? 'bg-slate-600/20 text-slate-400'}`}>
                          {m.role}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Teams */}
            {project.teams.length > 0 && (
              <section className="rounded-xl p-5" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                <h2 className="text-sm font-semibold mb-3" style={{ color: 'hsl(224, 30%, 85%)' }}>Teams</h2>
                <ul className="space-y-2">
                  {project.teams.map((t) => (
                    <li key={t.id} className="text-sm">
                      <p className="font-medium" style={{ color: 'hsl(224, 40%, 95%)' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{t.teamMembers.length} member{t.teamMembers.length !== 1 ? 's' : ''}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
