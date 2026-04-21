import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects } from '../api/projects.js'
import Layout from '../components/Layout.jsx'

const STATUS_CONFIG = {
  on_track:  { label: 'On Track',  dot: 'bg-emerald-500', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  at_risk:   { label: 'At Risk',   dot: 'bg-amber-500',   badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  delayed:   { label: 'Delayed',   dot: 'bg-red-500',     badge: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  active:    { label: 'Active',    dot: 'bg-indigo-500',  badge: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
  completed: { label: 'Completed', dot: 'bg-slate-400',   badge: 'bg-slate-600/20 text-slate-400 border border-slate-500/30' },
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
        {loading && (
          <div className="flex justify-center py-20 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</div>
        )}

        {error && (
          <p className="rounded-xl px-5 py-4 text-sm" style={{ backgroundColor: 'hsl(0, 100%, 10%)', border: '1px solid hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-20 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>No projects found.</div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => {
              const status = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active
              return (
                <div
                  key={project.id}
                  className="rounded-xl p-5 flex flex-col gap-4 transition-all"
                  style={{
                    backgroundColor: 'hsl(224, 30%, 14%)',
                    border: '1px solid hsl(224, 30%, 18%)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{project.name}</h2>
                      {project.description && (
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'hsl(224, 20%, 55%)' }}>{project.description}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0 ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  {project.deadline && (
                    <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>Deadline: {formatDate(project.deadline)}</p>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid hsl(224, 30%, 18%)',
                        color: 'hsl(224, 20%, 55%)',
                      }}
                    >
                      View project
                    </button>
                    <button
                      onClick={() => navigate(`/projects/${project.id}/documents`)}
                      className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-white transition-colors"
                      style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}
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
