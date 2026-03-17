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

const th = 'text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide'
const td = 'px-4 py-3 text-gray-700 text-sm'

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

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
  if (error)   return <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Pending Code Reviews</h3>
          <p className="text-xs text-gray-400 mt-0.5">Tasks submitted for code review before being marked done.</p>
        </div>
        <span className="text-xs text-gray-400">{tasks.length} pending</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={th}>Task</th>
              <th className={th}>Project</th>
              <th className={th}>Owner</th>
              <th className={th}>PR Link</th>
              <th className={th}>Date</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => (
              <tr key={task.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <td className={td}>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.sprint && <p className="text-xs text-gray-400 mt-0.5">{task.sprint.name}</p>}
                </td>
                <td className={td}>{task.project?.name ?? '—'}</td>
                <td className={td}>{task.assignee?.name ?? '—'}</td>
                <td className={td}>
                  {task.prLink ? (
                    <a
                      href={task.prLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-medium text-xs"
                    >
                      View PR →
                    </a>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className={td}>{formatDate(task.updatedAt)}</td>
                <td className={`${td} text-right`}>
                  <button
                    onClick={() => handleApprove(task.id)}
                    disabled={approving.has(task.id)}
                    className="text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {approving.has(task.id) ? 'Approving…' : 'Approve'}
                  </button>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">No tasks pending review.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
