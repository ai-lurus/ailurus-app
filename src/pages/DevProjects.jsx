import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api/projects.js'
import Layout from '../components/Layout.jsx'

const STATUS_CONFIG = {
  on_track:  { label: 'On Track',  dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' },
  at_risk:   { label: 'At Risk',   dot: 'bg-amber-500',   badge: 'bg-amber-500/10 text-amber-700 border border-amber-500/20' },
  delayed:   { label: 'Delayed',   dot: 'bg-red-500',     badge: 'bg-red-500/10 text-red-700 border border-red-500/20' },
  active:    { label: 'Active',    dot: 'bg-indigo-500',  badge: 'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20' },
  completed: { label: 'Completed', dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DevProjects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.response?.data?.error ?? err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 mt-1 text-sm">Access project details and documentation.</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20 text-slate-400 text-sm">Loading…</div>
        )}

        {error && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm">{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20 text-slate-400 text-sm">No projects found.</div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => {
              const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active
              return (
                <div
                  key={project.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 truncate">{project.name}</h2>
                      {project.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {project.deadline && (
                    <p className="text-xs text-slate-400">Deadline: {formatDate(project.deadline)}</p>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      View project
                    </button>
                    <button
                      onClick={() => navigate(`/projects/${project.id}/documents`)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                    >
                      📄 Documents
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
