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
          className={`rounded-xl p-5 border ${
            accent ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{label}</p>
          <p className={`text-3xl font-bold ${accent ? 'text-red-500' : 'text-slate-900'}`}>{value}</p>
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
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-slate-900 text-sm leading-snug">{project.name}</h3>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${status.classes}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
          {project.type}
        </span>
        {project.client?.name && (
          <span className="text-xs text-slate-400">{project.client.name}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Budget</p>
          <p className="text-sm font-semibold text-slate-700">{formatCurrency(project.budget)}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs mb-0.5">Deadline</p>
          <p className="text-sm font-semibold text-slate-700">{formatDate(project.deadline)}</p>
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
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            active === f
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
          }`}
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Project Overview</h1>
          <p className="text-slate-500 mt-1 text-sm">All active and upcoming projects</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20 text-slate-400 text-sm">Loading projects…</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <SummaryBar projects={projects} />
            <FilterBar active={filter} onChange={setFilter} />

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">No projects match this filter.</div>
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
