import { useEffect, useState } from 'react'
import { updateTask } from '../../api/tasks.js'
import client from '../../api/client.js'

async function getAllInReviewTasks() {
  const { data } = await client.get('/api/tasks', { params: { status: 'in_review' } })
  return data.tasks
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'hsl(224, 20%, 55%)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle = { padding: '12px 16px', color: 'hsl(224, 40%, 95%)', fontSize: '14px' }

export default function ReviewsTab() {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [approving, setApproving] = useState(new Set())

  useEffect(() => {
    getAllInReviewTasks()
      .then(setTasks)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(taskId) {
    setApproving((prev) => new Set(prev).add(taskId))
    try {
      await updateTask(taskId, { status: 'done' })
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    } catch (err) {
      setError(err.message)
    } finally {
      setApproving((prev) => { const next = new Set(prev); next.delete(taskId); return next })
    }
  }

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</p>
  if (error)   return <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>Pending Code Reviews</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Tasks submitted for code review before being marked done.</p>
        </div>
        <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{tasks.length} pending</span>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
              <th style={thStyle}>Task</th>
              <th style={thStyle}>Project</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>PR Link</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={task.id} style={{ borderBottom: '1px solid hsl(224, 30%, 18%)', backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(224, 30%, 12%)' }}>
                <td style={tdStyle}>
                  <p className="font-medium">{task.title}</p>
                  {task.sprint && <p className="text-xs mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>{task.sprint.name}</p>}
                </td>
                <td style={tdStyle}>{task.project?.name ?? '—'}</td>
                <td style={tdStyle}>{task.assignee?.name ?? '—'}</td>
                <td style={tdStyle}>
                  {task.prLink ? (
                    <a
                      href={task.prLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-xs"
                      style={{ color: 'hsl(270, 100%, 60%)' }}
                    >
                      View PR →
                    </a>
                  ) : (
                    <span style={{ color: 'hsl(224, 20%, 55%)' }}>—</span>
                  )}
                </td>
                <td style={tdStyle}>{formatDate(task.updatedAt)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <button
                    onClick={() => handleApprove(task.id)}
                    disabled={approving.has(task.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'hsl(120, 100%, 50%)', color: 'hsl(224, 30%, 14%)' }}
                  >
                    {approving.has(task.id) ? 'Approving…' : 'Approve'}
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10" style={{ color: 'hsl(224, 20%, 55%)' }}>No tasks pending review.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
