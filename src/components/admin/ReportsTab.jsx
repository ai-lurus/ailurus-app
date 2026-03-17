import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReports, triggerHealthReport } from '../../api/reports.js'
import { getProjects } from '../../api/projects.js'
import { getTodayAllStatuses } from '../../api/dailyStatus.js'
import { getTodayTaskActivity } from '../../api/tasks.js'

const REPORT_TYPE_LABELS = {
  daily_project:    'Project Health',
  morning_checkin:  'Morning Check-In',
  weekly_summary:   'Weekly Summary',
}

const REPORT_TYPE_STYLES = {
  daily_project:   'bg-indigo-100 text-indigo-800',
  morning_checkin: 'bg-green-100 text-green-800',
  weekly_summary:  'bg-blue-100 text-blue-800',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Report Detail Modal (inline expand) ──────────────────────────────────────

function ReportRow({ report }) {
  const [expanded, setExpanded] = useState(false)
  const label = REPORT_TYPE_LABELS[report.type] ?? report.type
  const style = REPORT_TYPE_STYLES[report.type] ?? 'bg-gray-100 text-gray-600'

  const content = report.content

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50/60 cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className={td}>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${style}`}>{label}</span>
        </td>
        <td className={td}>
          <span className="text-gray-700">{report.project?.name ?? '—'}</span>
        </td>
        <td className={td}>
          <span className="text-gray-500">{report.user?.name ?? '—'}</span>
        </td>
        <td className={td}>
          <span className="text-gray-500 text-xs">{formatDate(report.createdAt)}</span>
        </td>
        <td className={`${td} text-right`}>
          {report.driveUrl ? (
            <a
              href={report.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Drive
            </a>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
          <span className="ml-2 text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && content && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={5} className="px-6 py-4">
            <div className="space-y-3 text-sm">
              {content.summary && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Summary</p>
                  <p className="text-gray-700 leading-relaxed">{content.summary}</p>
                </div>
              )}

              {content.risks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Risks</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {content.risks.map((r, i) => <li key={i} className="text-gray-700">{r}</li>)}
                  </ul>
                </div>
              )}

              {content.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendations</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {content.recommendations.map((r, i) => <li key={i} className="text-gray-700">{r}</li>)}
                  </ul>
                </div>
              )}

              {content.suggested_tickets?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Suggested Tickets</p>
                  <div className="space-y-1.5">
                    {content.suggested_tickets.map((ticket, i) => (
                      <div key={i} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <p className="font-medium text-gray-800 text-xs">{ticket.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{ticket.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: render raw JSON for unknown report shapes */}
              {!content.summary && !content.risks && (
                <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
                  {JSON.stringify(content, null, 2)}
                </pre>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Mood helpers ──────────────────────────────────────────────────────────────

const MOOD_DOT = {
  great:      'bg-emerald-400',
  good:       'bg-sky-400',
  okay:       'bg-amber-400',
  struggling: 'bg-rose-400',
}

// ── Task status helpers ───────────────────────────────────────────────────────

const TASK_STATUS_BADGE = {
  done:        'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked:     'bg-red-100 text-red-700',
  backlog:     'bg-gray-100 text-gray-500',
}

const TASK_STATUS_LABEL = {
  done:        'Done',
  in_progress: 'In Progress',
  blocked:     'Blocked',
  backlog:     'Backlog',
}

function TaskActivityList({ tasks }) {
  const navigate = useNavigate()
  if (!tasks?.length) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tickets Today</p>
      <ul className="space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-2">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${TASK_STATUS_BADGE[t.status] ?? 'bg-gray-100 text-gray-500'}`}>
              {TASK_STATUS_LABEL[t.status] ?? t.status}
            </span>
            <button
              onClick={() => navigate(`/admin/board?task=${t.id}`)}
              className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline line-clamp-1 text-left cursor-pointer"
            >
              {t.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Today's Team section ──────────────────────────────────────────────────────

function TodayTeamSection({ statuses, taskActivity }) {
  // Build a map userId -> tasks for quick lookup
  const tasksByUser = {}
  for (const entry of taskActivity) {
    tasksByUser[entry.user.id] = entry.tasks
  }

  if (statuses.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Today's Team</h2>
        <p className="text-sm text-gray-400">No check-ins submitted yet today.</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Today's Team</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {statuses.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 truncate">{s.user?.name ?? '—'}</span>
              <span className="ml-auto text-xs text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                {s.user?.role}
              </span>
            </div>

            {/* AM check-in */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Morning</p>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className={`w-2 h-2 rounded-full shrink-0 ${MOOD_DOT[s.mood] ?? 'bg-gray-300'}`} />
                <span className="capitalize">{s.mood}</span>
                {s.availableHrs && (
                  <span className="text-gray-400">· {s.availableHrs}h</span>
                )}
              </div>
              {s.blockers && (
                <p className="text-xs text-amber-600 mt-1 truncate">⚠ {s.blockers}</p>
              )}
            </div>

            {/* EOD check-in */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">End of Day</p>
              {s.eodSubmittedAt ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${MOOD_DOT[s.eodMood] ?? 'bg-gray-300'}`} />
                    <span className="capitalize">{s.eodMood}</span>
                  </div>
                  {s.eodCompleted && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.eodCompleted}</p>
                  )}
                  {s.eodBlockers && (
                    <p className="text-xs text-amber-600 mt-1 truncate">⚠ {s.eodBlockers}</p>
                  )}
                  {s.eodNotes && (
                    <p className="text-xs text-gray-400 italic mt-1 line-clamp-2">{s.eodNotes}</p>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-300 italic">Not submitted yet</p>
              )}
            </div>

            {/* Tickets touched today */}
            <TaskActivityList tasks={tasksByUser[s.user?.id]} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export default function ReportsTab() {
  const [reports, setReports]             = useState([])
  const [projects, setProjects]           = useState([])
  const [todayStatuses, setTodayStatuses] = useState([])
  const [taskActivity, setTaskActivity]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [triggering, setTriggering]       = useState(null) // projectId being triggered

  useEffect(() => {
    Promise.all([getReports(), getProjects(), getTodayAllStatuses(), getTodayTaskActivity()])
      .then(([fetchedReports, fetchedProjects, fetchedStatuses, fetchedActivity]) => {
        setReports(fetchedReports)
        setProjects(fetchedProjects)
        setTodayStatuses(fetchedStatuses)
        setTaskActivity(fetchedActivity)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleTrigger(projectId) {
    setTriggering(projectId)
    try {
      const report = await triggerHealthReport(projectId)
      // Re-fetch latest reports to show the new one with full relations
      const updated = await getReports()
      setReports(updated)
      // Update project status badge inline
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: report.status } : p))
      )
    } catch (err) {
      alert(err.response?.data?.error ?? err.message)
    } finally {
      setTriggering(null)
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading reports…</p>
  if (error)   return <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>

  return (
    <div className="space-y-8">

      {/* ── Today's Team ── */}
      <TodayTeamSection statuses={todayStatuses} taskActivity={taskActivity} />

      {/* ── Trigger Health Reports ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Trigger Health Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.status?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => handleTrigger(p.id)}
                disabled={triggering === p.id}
                className="shrink-0 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {triggering === p.id ? 'Running…' : 'Run'}
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm text-gray-400">No projects found.</p>
          )}
        </div>
      </section>

      {/* ── Reports Table ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Recent Reports <span className="text-gray-400 font-normal normal-case">— click a row to expand</span>
        </h2>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className={th}>Type</th>
                <th className={th}>Project</th>
                <th className={th}>Generated By</th>
                <th className={th}>Date</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => <ReportRow key={r.id} report={r} />)}
              {reports.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-10">No reports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const th = 'text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide'
const td = 'px-4 py-3 text-gray-700'
