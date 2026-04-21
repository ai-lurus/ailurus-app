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
  daily_project:   { backgroundColor: 'hsl(244, 100%, 20%)', color: 'hsl(244, 100%, 69%)' },
  morning_checkin: { backgroundColor: 'hsl(120, 100%, 20%)', color: 'hsl(120, 100%, 50%)' },
  weekly_summary:  { backgroundColor: 'hsl(217, 100%, 20%)', color: 'hsl(217, 100%, 50%)' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Report Detail Modal (inline expand) ──────────────────────────────────────

function ReportRow({ report }) {
  const [expanded, setExpanded] = useState(false)
  const label = REPORT_TYPE_LABELS[report.type] ?? report.type
  const style = REPORT_TYPE_STYLES[report.type] ?? { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }

  const content = report.content

  return (
    <>
      <tr
        style={{ borderBottom: '1px solid hsl(224, 30%, 18%)', cursor: 'pointer', transition: 'background-color 0.2s' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <td style={tdStyle}>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={style}>{label}</span>
        </td>
        <td style={tdStyle}>
          <span>{report.project?.name ?? '—'}</span>
        </td>
        <td style={tdStyle}>
          <span>{report.user?.name ?? '—'}</span>
        </td>
        <td style={tdStyle}>
          <span className="text-xs">{formatDate(report.createdAt)}</span>
        </td>
        <td style={{ ...tdStyle, textAlign: 'right' }}>
          {report.driveUrl ? (
            <a
              href={report.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium px-3 py-1 rounded-lg transition-colors"
              style={{ color: 'hsl(244, 100%, 69%)' }}
            >
              Drive
            </a>
          ) : (
            <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>—</span>
          )}
          <span className="ml-2 text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{expanded ? '▲' : '▼'}</span>
        </td>
      </tr>

      {expanded && content && (
        <tr style={{ borderBottom: '1px solid hsl(224, 30%, 18%)', backgroundColor: 'hsl(224, 30%, 12%)' }}>
          <td colSpan={5} className="px-6 py-4">
            <div className="space-y-3 text-sm">
              {content.summary && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>Summary</p>
                  <p className="leading-relaxed" style={{ color: 'hsl(224, 40%, 95%)' }}>{content.summary}</p>
                </div>
              )}

              {content.risks?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>Risks</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {content.risks.map((r, i) => <li key={i} style={{ color: 'hsl(224, 40%, 95%)' }}>{r}</li>)}
                  </ul>
                </div>
              )}

              {content.recommendations?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>Recommendations</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {content.recommendations.map((r, i) => <li key={i} style={{ color: 'hsl(224, 40%, 95%)' }}>{r}</li>)}
                  </ul>
                </div>
              )}

              {content.suggested_tickets?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>Suggested Tickets</p>
                  <div className="space-y-1.5">
                    {content.suggested_tickets.map((ticket, i) => (
                      <div key={i} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                        <p className="font-medium text-xs" style={{ color: 'hsl(224, 40%, 95%)' }}>{ticket.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>{ticket.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: render raw JSON for unknown report shapes */}
              {!content.summary && !content.risks && (
                <pre className="text-xs rounded-lg p-3 overflow-x-auto" style={{ backgroundColor: 'hsl(224, 25%, 16%)', color: 'hsl(224, 40%, 95%)', border: '1px solid hsl(224, 30%, 18%)' }}>
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
  great:      { backgroundColor: 'hsl(120, 100%, 50%)' },
  good:       { backgroundColor: 'hsl(217, 100%, 50%)' },
  okay:       { backgroundColor: 'hsl(51, 100%, 50%)' },
  struggling: { backgroundColor: 'hsl(0, 100%, 60%)' },
}

// ── Task status helpers ───────────────────────────────────────────────────────

const TASK_STATUS_BADGE = {
  done:        { backgroundColor: 'hsl(120, 100%, 20%)', color: 'hsl(120, 100%, 50%)' },
  in_progress: { backgroundColor: 'hsl(217, 100%, 20%)', color: 'hsl(217, 100%, 50%)' },
  blocked:     { backgroundColor: 'hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' },
  backlog:     { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' },
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
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>Tickets Today</p>
      <ul className="space-y-1">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-start gap-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={TASK_STATUS_BADGE[t.status] ?? { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
              {TASK_STATUS_LABEL[t.status] ?? t.status}
            </span>
            <button
              onClick={() => navigate(`/admin/board?task=${t.id}`)}
              className="text-xs hover:underline line-clamp-1 text-left cursor-pointer"
              style={{ color: 'hsl(244, 100%, 69%)' }}
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
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'hsl(224, 40%, 95%)' }}>Today's Team</h2>
        <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>No check-ins submitted yet today.</p>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'hsl(224, 40%, 95%)' }}>Today's Team</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {statuses.map((s) => (
          <div key={s.id} className="rounded-xl px-4 py-3 space-y-3" style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(224, 30%, 18%)' }}>
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{s.user?.name ?? '—'}</span>
              <span className="ml-auto text-xs capitalize px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
                {s.user?.role}
              </span>
            </div>

            {/* AM check-in */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>Morning</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(224, 40%, 95%)' }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={MOOD_DOT[s.mood] ?? { backgroundColor: 'hsl(224, 20%, 55%)' }} />
                <span className="capitalize">{s.mood}</span>
                {s.availableHrs && (
                  <span style={{ color: 'hsl(224, 20%, 55%)' }}>· {s.availableHrs}h</span>
                )}
              </div>
              {s.blockers && (
                <p className="text-xs mt-1 truncate" style={{ color: 'hsl(51, 100%, 50%)' }}>⚠ {s.blockers}</p>
              )}
            </div>

            {/* EOD check-in */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>End of Day</p>
              {s.eodSubmittedAt ? (
                <>
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(224, 40%, 95%)' }}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={MOOD_DOT[s.eodMood] ?? { backgroundColor: 'hsl(224, 20%, 55%)' }} />
                    <span className="capitalize">{s.eodMood}</span>
                  </div>
                  {s.eodCompleted && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'hsl(224, 40%, 95%)' }}>{s.eodCompleted}</p>
                  )}
                  {s.eodBlockers && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'hsl(51, 100%, 50%)' }}>⚠ {s.eodBlockers}</p>
                  )}
                  {s.eodNotes && (
                    <p className="text-xs italic mt-1 line-clamp-2" style={{ color: 'hsl(224, 20%, 55%)' }}>{s.eodNotes}</p>
                  )}
                </>
              ) : (
                <p className="text-xs italic" style={{ color: 'hsl(224, 20%, 55%)' }}>Not submitted yet</p>
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

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading reports…</p>
  if (error)   return <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>

  return (
    <div className="space-y-8">

      {/* ── Today's Team ── */}
      <TodayTeamSection statuses={todayStatuses} taskActivity={taskActivity} />

      {/* ── Trigger Health Reports ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'hsl(224, 40%, 95%)' }}>Trigger Health Report</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl px-4 py-3 gap-3" style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(224, 30%, 18%)' }}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{p.name}</p>
                <p className="text-xs mt-0.5 capitalize" style={{ color: 'hsl(224, 20%, 55%)' }}>{p.status?.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => handleTrigger(p.id)}
                disabled={triggering === p.id}
                className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
              >
                {triggering === p.id ? 'Running…' : 'Run'}
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>No projects found.</p>
          )}
        </div>
      </section>

      {/* ── Reports Table ── */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'hsl(224, 40%, 95%)' }}>
          Recent Reports <span style={{ color: 'hsl(224, 20%, 55%)', fontWeight: 'normal', textTransform: 'none' }}>— click a row to expand</span>
        </h2>
        <div className="overflow-hidden rounded-xl" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>Generated By</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => <ReportRow key={r.id} report={r} />)}
              {reports.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10" style={{ color: 'hsl(224, 20%, 55%)' }}>No reports yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'hsl(224, 20%, 55%)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle = { padding: '12px 16px', color: 'hsl(224, 40%, 95%)', fontSize: '14px' }
