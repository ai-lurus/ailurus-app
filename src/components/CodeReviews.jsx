import { useEffect, useState } from 'react'
import { updateTask } from '../api/tasks.js'
import client from '../api/client.js'

async function getInReviewTasks() {
  const { data } = await client.get('/api/tasks', { params: { status: 'in_review' } })
  return data.tasks
}

export default function CodeReviews({ userId }) {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [approving, setApproving] = useState(new Set())

  useEffect(() => {
    if (!userId) return
    getInReviewTasks()
      .then((all) => setTasks(all.filter((t) => t.assignedTo !== userId)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

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

  if (loading) return null
  if (tasks.length === 0) return null

  return (
    <section className="rounded-2xl p-6" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ color: 'hsl(259, 100%, 69%)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
        </svg>
        <h2 className="text-base font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>Code Reviews</h2>
        <span className="ml-auto text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{tasks.length} pending</span>
      </div>

      {error && <p className="text-sm mb-3" style={{ color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(259, 100%, 30%)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug" style={{ color: 'hsl(224, 40%, 95%)' }}>{task.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {task.project && <span style={{ color: 'hsl(224, 20%, 55%)' }}>{task.project.name}</span>}
                  {task.assignee && (
                    <>
                      <span style={{ color: 'hsl(224, 25%, 20%)' }}>·</span>
                      <span style={{ color: 'hsl(224, 20%, 55%)' }}>{task.assignee.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.prLink && (
                  <a
                    href={task.prLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ border: '1px solid hsl(259, 100%, 30%)', color: 'hsl(259, 100%, 69%)', backgroundColor: 'transparent' }}
                  >
                    View PR
                  </a>
                )}
                <button
                  onClick={() => handleApprove(task.id)}
                  disabled={approving.has(task.id)}
                  className="text-xs font-semibold px-3 py-1.5 text-white rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'hsl(120, 100%, 50%)' }}
                >
                  {approving.has(task.id) ? 'Approving…' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
