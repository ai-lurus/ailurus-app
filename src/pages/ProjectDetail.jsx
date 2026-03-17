import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectDashboard } from '../api/projects.js'
import Layout from '../components/Layout.jsx'

const STATUS_CONFIG = {
  on_track: { label: 'On Track', dot: 'bg-emerald-500', classes: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' },
  at_risk:  { label: 'At Risk',  dot: 'bg-amber-500',  classes: 'bg-amber-500/10 text-amber-700 border border-amber-500/20' },
  delayed:  { label: 'Delayed',  dot: 'bg-red-500',    classes: 'bg-red-500/10 text-red-700 border border-red-500/20' },
  active:   { label: 'Active',   dot: 'bg-indigo-500', classes: 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20' },
  completed:{ label: 'Completed',dot: 'bg-slate-400',  classes: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

const TASK_STATUS_LABEL = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review',
  done: 'Done', blocked: 'Blocked',
}

const TASK_STATUS_COLOR = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  in_review: 'bg-purple-100 text-purple-700',
  done: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
}

const ROLE_COLORS = {
  developer: 'bg-blue-100 text-blue-700',
  designer:  'bg-purple-100 text-purple-700',
  pm:        'bg-orange-100 text-orange-700',
  ceo:       'bg-indigo-100 text-indigo-700',
  admin:     'bg-slate-100 text-slate-600',
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
    <div className={`rounded-xl p-5 border ${accent ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-red-500' : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

function ProgressBar({ percent }) {
  const pct = percent ?? 0
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-400' : 'bg-indigo-500'
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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
    return <Layout><div className="flex justify-center py-20 text-slate-400 text-sm">Loading…</div></Layout>
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm">{error ?? 'Project not found.'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm text-indigo-600 hover:underline">← Back</button>
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
          <button onClick={() => navigate(-1)} className="text-xs text-slate-400 hover:text-slate-600 mb-3 flex items-center gap-1 transition-colors">
            ← Back
          </button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${status.classes}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                  {project.type}
                </span>
              </div>
              {project.description && <p className="text-slate-500 text-sm mt-1 max-w-2xl">{project.description}</p>}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Budget" value={formatCurrency(project.budget)} />
          <StatCard label="Deadline" value={formatDate(project.deadline)} />
          <StatCard
            label="Open Blockers"
            value={dashboard?.openBlockers?.length ?? 0}
            accent={(dashboard?.openBlockers?.length ?? 0) > 0}
          />
          <StatCard label="Total Tasks" value={totalTasks} />
        </div>

        {/* Timeline burn */}
        {dashboard?.budgetBurnPercent != null && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Timeline Progress</p>
              <p className="text-sm font-bold text-slate-900">{dashboard.budgetBurnPercent}%</p>
            </div>
            <ProgressBar percent={dashboard.budgetBurnPercent} />
            <p className="text-xs text-slate-400 mt-2">
              {formatDate(project.createdAt)} → {formatDate(project.deadline)}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Active sprint */}
            {dashboard?.activeSprint && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Active Sprint</h2>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-900">{dashboard.activeSprint.name}</p>
                  <p className="text-xs text-slate-400">
                    {formatDate(dashboard.activeSprint.startDate)} → {formatDate(dashboard.activeSprint.endDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: dashboard.activeSprint.totalPoints > 0 ? `${Math.round((dashboard.activeSprint.velocity / dashboard.activeSprint.totalPoints) * 100)}%` : '0%' }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 shrink-0">
                    {dashboard.activeSprint.velocity} / {dashboard.activeSprint.totalPoints} pts
                  </p>
                </div>
              </section>
            )}

            {/* Task breakdown */}
            {totalTasks > 0 && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Task Breakdown</h2>
                <div className="space-y-2">
                  {Object.entries(taskBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize min-w-[90px] text-center ${TASK_STATUS_COLOR[status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {TASK_STATUS_LABEL[status] ?? status}
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${TASK_STATUS_COLOR[status]?.split(' ')[0].replace('bg-', 'bg-') ?? 'bg-slate-400'}`}
                          style={{ width: `${Math.round((count / totalTasks) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-5 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Open blockers */}
            {dashboard?.openBlockers?.length > 0 && (
              <section className="bg-white border border-red-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-red-600 mb-3">Open Blockers</h2>
                <ul className="space-y-2">
                  {dashboard.openBlockers.map((b) => (
                    <li key={b.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{b.title}</span>
                      {b.assignee && <span className="text-xs text-slate-400">{b.assignee.name}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Goals */}
            {project.goals?.length > 0 && (
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Goals</h2>
                <ul className="space-y-2">
                  {project.goals.map((g) => (
                    <li key={g.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{g.title}</span>
                      <span className="text-xs text-slate-400">{formatDate(g.deadline)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Right column — Team */}
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Team</h2>
              {uniqueMembers.length === 0 ? (
                <p className="text-xs text-slate-400">No members assigned.</p>
              ) : (
                <ul className="space-y-3">
                  {uniqueMembers.map((m) => (
                    <li key={m.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-indigo-700 text-xs font-bold">{m.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded capitalize ${ROLE_COLORS[m.role] ?? 'bg-slate-100 text-slate-600'}`}>
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
              <section className="bg-white border border-slate-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">Teams</h2>
                <ul className="space-y-2">
                  {project.teams.map((t) => (
                    <li key={t.id} className="text-sm">
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.teamMembers.length} member{t.teamMembers.length !== 1 ? 's' : ''}</p>
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
