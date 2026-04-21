import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api/projects.js'
import Layout from '../components/Layout.jsx'

const STATUS_CONFIG = {
  on_track: { label: 'On Track', dot: 'bg-emerald-500', classes: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' },
  at_risk:  { label: 'At Risk',  dot: 'bg-amber-500',  classes: 'bg-amber-500/10 text-amber-600 border border-amber-500/20' },
  delayed:  { label: 'Delayed',  dot: 'bg-red-500',    classes: 'bg-red-500/10 text-red-600 border border-red-500/20' },
}

const FILTERS = ['All', 'External', 'Internal', 'At Risk']

function formatCurrency(amount) {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function SummaryBar({ projects }) {
  const active = projects.filter((p) => p.status !== 'completed' && p.status !== 'cancelled').length
  const atRisk = projects.filter((p) => p.status === 'at_risk' || p.status === 'delayed').length
  const budget = projects.reduce((sum, p) => sum + (p.budget ?? 0), 0)

  const stats = [
    { label: 'Active Projects',  value: active,                 accent: false },
    { label: 'Projects at Risk', value: atRisk,                 accent: atRisk > 0 },
    { label: 'Total Budget',     value: formatCurrency(budget), accent: false },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {stats.map(({ label, value, accent }) => (
        <div
          key={label}
          className="rounded-xl p-5 border"
          style={{
            backgroundColor: accent ? 'hsl(0, 100%, 10%)' : 'hsl(224, 30%, 14%)',
            borderColor: accent ? 'hsl(0, 100%, 20%)' : 'hsl(224, 30%, 18%)',
          }}
        >
          <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: 'hsl(224, 20%, 55%)' }}>{label}</p>
          <p className="text-3xl font-bold" style={{ color: accent ? 'hsl(0, 100%, 60%)' : 'hsl(224, 40%, 95%)' }}>{value}</p>
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ project }) {
  const navigate = useNavigate()
  const status = STATUS_CONFIG[project.status] ?? { label: project.status, dot: 'bg-slate-400', classes: 'bg-slate-100 text-slate-600 border border-slate-200' }

  return (
    <button
      onClick={() => navigate(`/projects/${project.id}`)}
      className="w-full text-left rounded-xl border p-5 hover:border-indigo-400 hover:shadow-md transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
      style={{
        backgroundColor: 'hsl(224, 30%, 14%)',
        borderColor: 'hsl(224, 30%, 18%)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-sm leading-snug" style={{ color: 'hsl(224, 40%, 95%)' }}>{project.name}</h3>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${status.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium px-2 py-0.5 rounded-md capitalize" style={{ backgroundColor: 'hsl(224, 25%, 20%)', color: 'hsl(224, 20%, 55%)' }}>
          {project.type}
        </span>
        {project.client?.name && (
          <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{project.client.name}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3" style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Budget</p>
          <p className="text-sm font-semibold" style={{ color: 'hsl(224, 30%, 85%)' }}>{formatCurrency(project.budget)}</p>
        </div>
        <div>
          <p className="text-xs mb-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Deadline</p>
          <p className="text-sm font-semibold" style={{ color: 'hsl(224, 30%, 85%)' }}>{formatDate(project.deadline)}</p>
        </div>
      </div>
    </button>
  )
}

function FilterBar({ active, onChange }) {
  return (
    <div className="flex gap-2 mb-6">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
          style={
            active === f
              ? { backgroundColor: 'hsl(244, 100%, 69%)', color: 'white' }
              : {
                  backgroundColor: 'hsl(224, 30%, 14%)',
                  color: 'hsl(224, 20%, 55%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                }
          }
        >
          {f}
        </button>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filter, setFilter]     = useState('All')

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter((p) => {
    if (filter === 'External') return p.type === 'external'
    if (filter === 'Internal') return p.type === 'internal'
    if (filter === 'At Risk')  return p.status === 'at_risk' || p.status === 'delayed'
    return true
  })

  return (
    <Layout>
      <div className="px-8 py-8">
        {loading && (
          <div className="flex justify-center py-20 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading projects…</div>
        )}

        {error && (
          <div className="rounded-xl px-5 py-4 text-sm" style={{ backgroundColor: 'hsl(0, 100%, 10%)', border: '1px solid hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <SummaryBar projects={projects} />
            <FilterBar active={filter} onChange={setFilter} />

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>No projects match this filter.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
