import { useEffect, useState } from 'react'
import { getMyTasks, updateTask } from '../api/tasks.js'
import { TasksIcon } from './Icons.jsx'
import CreateTicketModal from './CreateTicketModal.jsx'

const CATEGORY_STYLES = {
  engineering: 'bg-blue-50 text-blue-700 border border-blue-100',
  design:      'bg-violet-50 text-violet-700 border border-violet-100',
  marketing:   'bg-orange-50 text-orange-700 border border-orange-100',
  other:       'bg-slate-100 text-slate-600',
}

const STATUS_OPTIONS = [
  { value: 'backlog',     label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'in_review',   label: 'In Review' },
  { value: 'done',        label: 'Done' },
]

const STATUS_PILL = {
  backlog:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-50 text-blue-700 border border-blue-100',
  blocked:     'bg-red-50 text-red-600 border border-red-100',
  in_review:   'bg-purple-50 text-purple-700 border border-purple-100',
  done:        'bg-emerald-50 text-emerald-700 border border-emerald-100',
}

function TaskCard({ task, onStatusChange, updating, pendingReview, onPrSubmit, onPrCancel }) {
  const catStyle = CATEGORY_STYLES[task.category] ?? CATEGORY_STYLES.other
  const isPendingReview = pendingReview === task.id
  const [prLink, setPrLink] = useState('')

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
      {/* Title + category */}
      <div className="flex items-start gap-2">
        <p className="flex-1 font-medium text-slate-900 text-sm leading-snug">{task.title}</p>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${catStyle}`}>
          {task.category}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {task.storyPoints != null && (
          <span className="flex items-center gap-1">
            <span className="text-slate-400">SP</span>
            <span className="font-semibold text-slate-700">{task.storyPoints}</span>
          </span>
        )}
        {task.estimatedHrs != null && (
          <span className="flex items-center gap-1">
            <span className="text-slate-400">Est.</span>
            <span className="font-semibold text-slate-700">{task.estimatedHrs}h</span>
          </span>
        )}
        {task.sprint && (
          <span className="flex items-center gap-1 text-slate-400 truncate">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
            {task.sprint.name}
          </span>
        )}
        {task.prLink && (
          <a
            href={task.prLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium"
          >
            PR →
          </a>
        )}
      </div>

      {/* PR link input (shown when transitioning to in_review) */}
      {isPendingReview && (
        <div className="flex flex-col gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs font-semibold text-purple-700">Add PR link (optional)</p>
          <input
            type="url"
            value={prLink}
            onChange={(e) => setPrLink(e.target.value)}
            placeholder="https://github.com/org/repo/pull/123"
            className="text-xs px-3 py-2 rounded-lg border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={() => onPrSubmit(task.id, prLink)}
              disabled={updating}
              className="flex-1 text-xs font-semibold px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Submit for Review
            </button>
            <button
              onClick={() => onPrCancel()}
              className="text-xs font-medium px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Status selector */}
      {!isPendingReview && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_PILL[task.status]}`}>
            {STATUS_OPTIONS.find((s) => s.value === task.status)?.label ?? task.status}
          </span>
          <select
            value={task.status}
            disabled={updating}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="ml-auto text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function InReviewCard({ task }) {
  const catStyle = CATEGORY_STYLES[task.category] ?? CATEGORY_STYLES.other

  return (
    <div className="bg-white rounded-xl border border-purple-100 p-4 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <p className="flex-1 font-medium text-slate-900 text-sm leading-snug">{task.title}</p>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${catStyle}`}>
          {task.category}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {task.project && <span className="text-slate-400 truncate">{task.project.name}</span>}
        <span className="ml-auto bg-purple-50 text-purple-700 border border-purple-100 text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0">
          In Review
        </span>
        {task.prLink && (
          <a
            href={task.prLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-600 hover:text-purple-800 font-medium shrink-0"
          >
            PR →
          </a>
        )}
      </div>
    </div>
  )
}

export default function MyTasks({ userId }) {
  const [tasks, setTasks]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [updating, setUpdating]           = useState(new Set())
  const [pendingReview, setPendingReview] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!userId) return
    getMyTasks(userId)
      .then((all) => setTasks(all.filter((t) => ['in_progress', 'backlog', 'in_review'].includes(t.status))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  function handleStatusChange(taskId, newStatus) {
    if (newStatus === 'in_review') {
      setPendingReview(taskId)
      return
    }
    applyStatusChange(taskId, newStatus, null)
  }

  async function applyStatusChange(taskId, newStatus, prLink) {
    setUpdating((prev) => new Set(prev).add(taskId))
    try {
      const updated = await updateTask(taskId, {
        status: newStatus,
        ...(prLink !== null && { prLink }),
      })
      setTasks((prev) => {
        if (newStatus === 'done' || newStatus === 'blocked') {
          return prev.filter((t) => t.id !== taskId)
        }
        return prev.map((t) =>
          t.id === taskId ? { ...t, status: updated.status, prLink: updated.prLink } : t
        )
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating((prev) => { const next = new Set(prev); next.delete(taskId); return next })
      setPendingReview(null)
    }
  }

  function handlePrSubmit(taskId, prLink) {
    applyStatusChange(taskId, 'in_review', prLink || null)
  }

  function handlePrCancel() {
    setPendingReview(null)
  }

  const inProgress  = tasks.filter((t) => t.status === 'in_progress')
  const inReview    = tasks.filter((t) => t.status === 'in_review')
  const backlog     = tasks.filter((t) => t.status === 'backlog')
  const activeCount = tasks.length

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <TasksIcon className="w-5 h-5 text-slate-500 shrink-0" />
        <h2 className="text-base font-bold text-slate-900">My Tasks Today</h2>
        {!loading && (
          <span className="text-xs text-slate-400">{activeCount} task{activeCount !== 1 ? 's' : ''}</span>
        )}
        <button
          onClick={() => setShowCreateModal(true)}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Ticket
        </button>
      </div>

      {showCreateModal && (
        <CreateTicketModal
          userId={userId}
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTask) => {
            if (['in_progress', 'backlog', 'in_review'].includes(newTask.status)) {
              setTasks((prev) => [newTask, ...prev])
            }
          }}
        />
      )}

      {loading && <p className="text-sm text-slate-400">Loading tasks…</p>}
      {error   && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && activeCount === 0 && (
        <div className="text-center py-8">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">All caught up!</p>
          <p className="text-xs text-slate-400 mt-0.5">No open tasks right now.</p>
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3">In Progress</p>
          <div className="space-y-3">
            {inProgress.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onStatusChange={handleStatusChange}
                updating={updating.has(t.id)}
                pendingReview={pendingReview}
                onPrSubmit={handlePrSubmit}
                onPrCancel={handlePrCancel}
              />
            ))}
          </div>
        </div>
      )}

      {inReview.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3">Awaiting Review</p>
          <div className="space-y-3">
            {inReview.map((t) => (
              <InReviewCard key={t.id} task={t} />
            ))}
          </div>
        </div>
      )}

      {backlog.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Up Next</p>
          <div className="space-y-3">
            {backlog.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onStatusChange={handleStatusChange}
                updating={updating.has(t.id)}
                pendingReview={pendingReview}
                onPrSubmit={handlePrSubmit}
                onPrCancel={handlePrCancel}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
