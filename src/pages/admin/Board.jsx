import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { getAllTasks, createTask, updateTask, getTaskComments, createTaskComment } from '../../api/tasks.js'
import { getProjects } from '../../api/projects.js'
import { getUsers } from '../../api/users.js'
import { getGoals } from '../../api/goals.js'
import { getSprints } from '../../api/sprints.js'
import { useAuth } from '../../hooks/useAuth.js'

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',      headerCls: 'text-slate-500',   dotCls: 'bg-slate-400',   colCls: 'bg-slate-50/60' },
  { id: 'ready',       label: 'Ready',        headerCls: 'text-sky-600',     dotCls: 'bg-sky-400',     colCls: 'bg-sky-50/60'   },
  { id: 'in_progress', label: 'In Progress',  headerCls: 'text-amber-600',   dotCls: 'bg-amber-400',   colCls: 'bg-amber-50/60' },
  { id: 'in_review',   label: 'In Review',    headerCls: 'text-violet-600',  dotCls: 'bg-violet-400',  colCls: 'bg-violet-50/60'},
  { id: 'done',        label: 'Done',         headerCls: 'text-emerald-600', dotCls: 'bg-emerald-400', colCls: 'bg-emerald-50/60'},
]

const ALL_STATUSES = [
  { id: 'backlog',     label: 'Backlog'      },
  { id: 'ready',       label: 'Ready'        },
  { id: 'in_progress', label: 'In Progress'  },
  { id: 'blocked',     label: 'Blocked'      },
  { id: 'in_review',   label: 'In Review'    },
  { id: 'done',        label: 'Done'         },
]

const CATEGORY_COLORS = {
  engineering: 'bg-blue-100 text-blue-700',
  design:      'bg-purple-100 text-purple-700',
  marketing:   'bg-green-100 text-green-700',
  other:       'bg-gray-100 text-gray-600',
}

const inputCls     = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary   = 'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({ task, onClick, onDragStart }) {
  const isBlocked = task.status === 'blocked'

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('taskId', task.id)
        onDragStart?.()
      }}
      onClick={() => onClick(task)}
      className={`bg-white rounded-xl border p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 group active:opacity-50 ${
        isBlocked ? 'border-red-300' : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-2.5">
        {task.title}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize ${CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.other}`}>
          {task.category}
        </span>
        {isBlocked && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700">
            BLOCKED
          </span>
        )}
        {task.prLink && (
          <a
            href={task.prLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
          >
            PR ↗
          </a>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{task.project?.name}</span>
          {task.sprint && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 truncate max-w-[80px]" title={task.sprint.name}>
              {task.sprint.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.storyPoints != null && (
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
              {task.storyPoints}pt
            </span>
          )}
          {task.assignee && (
            <div
              className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0"
              title={task.assignee.name}
            >
              <span className="text-[9px] text-white font-bold leading-none">
                {task.assignee.name[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function KanbanColumn({ column, tasks, onTaskClick, onNewTask, onDrop, canCreate }) {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounter = useRef(0)

  function handleDragEnter(e) {
    e.preventDefault()
    dragCounter.current++
    setIsDragOver(true)
  }

  function handleDragLeave() {
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragOver(false)
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(e) {
    e.preventDefault()
    dragCounter.current = 0
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) onDrop(taskId, column.id)
  }

  return (
    <div className="flex flex-col w-72 min-w-[18rem] max-h-full">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${column.colCls} border border-b-0 ${isDragOver ? 'border-indigo-400' : 'border-slate-200/80'} transition-colors`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotCls}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${column.headerCls}`}>
            {column.label}
          </span>
          <span className="text-xs text-slate-400 font-medium">{tasks.length}</span>
        </div>
        {canCreate && (
          <button
            onClick={() => onNewTask(column.id)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none transition-colors"
            title="Add task"
          >
            +
          </button>
        )}
      </div>

      {/* Cards */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex-1 overflow-y-auto p-2 space-y-2 rounded-b-xl border ${isDragOver ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-slate-200/80'} ${column.colCls} min-h-[4rem] transition-all`}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-slate-300 text-center py-4 select-none">
            {isDragOver ? 'Drop here' : 'Empty'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Task Detail / Edit Modal ──────────────────────────────────────────────────

function TaskDetailModal({ task, users, sprints, onClose, onSaved }) {
  const { user: currentUser } = useAuth()
  const [form, setForm] = useState({
    status:       task.status,
    assignedTo:   task.assignedTo ?? '',
    sprintId:     task.sprintId   ?? '',
    prLink:       task.prLink ?? '',
    storyPoints:  task.storyPoints ?? '',
    estimatedHrs: task.estimatedHrs != null ? String(task.estimatedHrs) : '',
    title:        task.title,
    description:  task.description ?? '',
  })
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [comments, setComments]       = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting]         = useState(false)

  const projectSprints = sprints.filter((s) => s.projectId === task.projectId)

  useEffect(() => {
    getTaskComments(task.id).then(setComments).catch(() => {})
  }, [task.id])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTask(task.id, {
        status:       form.status,
        assignedTo:   form.assignedTo   || null,
        sprintId:     form.sprintId     || null,
        prLink:       form.prLink        || null,
        storyPoints:  form.storyPoints   !== '' ? Number(form.storyPoints)  : null,
        estimatedHrs: form.estimatedHrs  !== '' ? Number(form.estimatedHrs) : null,
        title:        form.title,
        description:  form.description  || null,
      })
      onSaved(updated)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setPosting(true)
    try {
      const comment = await createTaskComment(task.id, commentBody.trim())
      setComments((prev) => [...prev, comment])
      setCommentBody('')
    } catch {
      // silently fail
    } finally {
      setPosting(false)
    }
  }

  const devUsers = users.filter((u) => ['developer', 'designer', 'pm', 'admin', 'ceo'].includes(u.role))

  return (
    <Modal title="Task Details" onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Title" required>
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {ALL_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Assigned To">
            <select className={inputCls} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
              <option value="">— Unassigned —</option>
              {devUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </Field>
        </div>

        <Field label="Sprint">
          <select className={inputCls} value={form.sprintId} onChange={(e) => set('sprintId', e.target.value)}>
            <option value="">— Sin sprint —</option>
            {projectSprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Description">
          <textarea
            className={`${inputCls} resize-none`}
            rows={6}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional details…"
          />
        </Field>

        <Field label="PR Link">
          <input
            className={inputCls}
            type="url"
            value={form.prLink}
            onChange={(e) => set('prLink', e.target.value)}
            placeholder="https://github.com/org/repo/pull/123"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Story Points">
            <input className={inputCls} type="number" min="0" max="100" value={form.storyPoints} onChange={(e) => set('storyPoints', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Est. Hours">
            <input className={inputCls} type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={(e) => set('estimatedHrs', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>

        {/* Read-only metadata */}
        <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-xs text-slate-500 space-y-1.5">
          <div className="flex gap-2"><span className="font-semibold text-slate-600">Project:</span><span>{task.project?.name ?? '—'}</span></div>
          {task.goal     && <div className="flex gap-2"><span className="font-semibold text-slate-600">Goal:</span><span>{task.goal.title}</span></div>}
          {task.reviewer && <div className="flex gap-2"><span className="font-semibold text-slate-600">Reviewed by:</span><span>{task.reviewer.name}</span></div>}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* ── Comments ── */}
      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Comments{comments.length > 0 && <span className="text-slate-400 font-normal ml-1">({comments.length})</span>}
        </h3>

        {comments.length === 0 && (
          <p className="text-xs text-slate-400 mb-4">No comments yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] text-white font-bold leading-none">
                  {c.author.name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-slate-700">{c.author.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-wrap">{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] text-white font-bold leading-none">
              {currentUser?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 flex gap-2">
            <textarea
              className={`${inputCls} resize-none flex-1`}
              rows={2}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Agregar comentario… (Enter para enviar)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddComment(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={posting || !commentBody.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 self-end"
            >
              {posting ? '…' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

// ── New Task Modal ────────────────────────────────────────────────────────────

function NewTaskModal({ projects, users, sprints, defaultStatus, currentUserId, onClose, onCreated }) {
  const [form, setForm] = useState({
    title:        '',
    description:  '',
    category:     'engineering',
    projectId:    projects[0]?.id ?? '',
    goalId:       '',
    sprintId:     '',
    storyPoints:  '',
    estimatedHrs: '',
    assignedTo:   currentUserId ?? '',
    status:       defaultStatus,
  })
  const [goals, setGoals]   = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!form.projectId) return
    getGoals(form.projectId)
      .then(setGoals)
      .catch(() => setGoals([]))
  }, [form.projectId])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const task = await createTask({
        title:        form.title,
        description:  form.description  || null,
        category:     form.category,
        projectId:    form.projectId,
        goalId:       form.goalId       || null,
        sprintId:     form.sprintId     || null,
        storyPoints:  form.storyPoints  !== '' ? Number(form.storyPoints)  : null,
        estimatedHrs: form.estimatedHrs !== '' ? Number(form.estimatedHrs) : null,
        assignedTo:   form.assignedTo   || null,
        status:       form.status,
      })
      onCreated(task)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  const devUsers = users.filter((u) => ['developer', 'designer', 'pm'].includes(u.role))

  return (
    <Modal title="Create Task" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Title" required>
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Build login page" autoFocus />
        </Field>

        <Field label="Description">
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional details…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Project" required>
            <select className={inputCls} value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {ALL_STATUSES.filter((s) => s.id !== 'blocked').map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" required>
            <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {['engineering','design','marketing','other'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
          <Field label="Goal">
            <select className={inputCls} value={form.goalId} onChange={(e) => set('goalId', e.target.value)}>
              <option value="">— None —</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </Field>
        </div>

        {sprints.filter((s) => s.projectId === form.projectId).length > 0 && (
          <Field label="Sprint">
            <select className={inputCls} value={form.sprintId} onChange={(e) => set('sprintId', e.target.value)}>
              <option value="">— Sin sprint —</option>
              {sprints.filter((s) => s.projectId === form.projectId).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Story Points">
            <input className={inputCls} type="number" min="0" max="100" value={form.storyPoints} onChange={(e) => set('storyPoints', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Est. Hours">
            <input className={inputCls} type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={(e) => set('estimatedHrs', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>

        {devUsers.length > 0 && (
          <Field label="Assign To">
            <select className={inputCls} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
              <option value="">— Unassigned —</option>
              {devUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </Field>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Board Page ───────────────────────────────────────────────────────────

export default function Board() {
  const { user: currentUser } = useAuth()
  const isAdmin   = ['admin', 'ceo'].includes(currentUser?.role)
  const canCreate = ['admin', 'ceo', 'developer', 'designer', 'pm'].includes(currentUser?.role)

  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [sprints, setSprints]             = useState([])
  const [filterProject, setFilterProject] = useState('')
  const [filterUser, setFilterUser]       = useState('')
  const [filterSprint, setFilterSprint]   = useState('')

  const [selectedTask, setSelectedTask]     = useState(null)
  const [newTaskStatus, setNewTaskStatus]   = useState(null) // non-null = show modal

  const [searchParams, setSearchParams] = useSearchParams()

  // Load data — wait for auth, then only admins/ceo fetch the full user list
  useEffect(() => {
    if (currentUser === null) return // still loading auth

    const fetches = isAdmin
      ? [getAllTasks(), getProjects(), getUsers()]
      : [getAllTasks(), getProjects(), Promise.resolve([])]

    Promise.all(fetches)
      .then(([t, p, u]) => {
        setTasks(t)
        setProjects(p)
        setUsers(u)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [currentUser])

  // Load sprints when project filter changes
  useEffect(() => {
    if (!filterProject) {
      setSprints([])
      setFilterSprint('')
      return
    }
    getSprints(filterProject)
      .then(setSprints)
      .catch(() => setSprints([]))
  }, [filterProject])

  // Auto-open task from URL ?task=id
  useEffect(() => {
    const taskId = searchParams.get('task')
    if (taskId && tasks.length > 0) {
      const found = tasks.find((t) => t.id === taskId)
      if (found) setSelectedTask(found)
    }
  }, [tasks, searchParams])

  function handleTaskClick(task) {
    setSelectedTask(task)
    setSearchParams({ task: task.id }, { replace: true })
  }

  function handleCloseDetail() {
    setSelectedTask(null)
    setSearchParams({}, { replace: true })
  }

  function handleTaskSaved(updated) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
    setSelectedTask(null)
    setSearchParams({}, { replace: true })
  }

  function handleTaskCreated(task) {
    setTasks((prev) => [task, ...prev])
    setNewTaskStatus(null)
  }

  async function handleDrop(taskId, targetColumnId) {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return
    // blocked tasks live in in_progress column — dragging out should unblock
    const currentColumn = task.status === 'blocked' ? 'in_progress' : task.status
    if (currentColumn === targetColumnId) return

    const prevTasks = tasks
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: targetColumnId } : t))
    try {
      await updateTask(taskId, { status: targetColumnId })
    } catch {
      setTasks(prevTasks)
    }
  }

  // Build column buckets: blocked tasks show in in_progress column
  const filteredTasks = tasks.filter((t) => {
    if (filterProject && t.projectId !== filterProject) return false
    if (filterUser    && t.assignedTo !== filterUser)   return false
    if (filterSprint  && t.sprintId   !== filterSprint) return false
    return true
  })

  const tasksByColumn = Object.fromEntries(COLUMNS.map((c) => [c.id, []]))
  for (const t of filteredTasks) {
    const colId = t.status === 'blocked' ? 'in_progress' : t.status
    if (tasksByColumn[colId] !== undefined) {
      tasksByColumn[colId].push(t)
    }
  }

  const totalVisible = filteredTasks.length

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40 text-slate-400 text-sm">Loading board…</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen overflow-hidden">
        {/* ── Header ── */}
        <div className="px-8 pt-8 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Board</h1>
              <p className="text-slate-500 mt-0.5 text-sm">{totalVisible} task{totalVisible !== 1 ? 's' : ''}</p>
            </div>
            {canCreate && (
              <button
                onClick={() => setNewTaskStatus('backlog')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                + New Task
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Assignees</option>
              {users.filter((u) => ['developer', 'designer', 'pm'].includes(u.role)).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>

            {sprints.length > 0 && (
              <select
                value={filterSprint}
                onChange={(e) => setFilterSprint(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                <option value="">All Sprints</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            {(filterProject || filterUser || filterSprint) && (
              <button
                onClick={() => { setFilterProject(''); setFilterUser(''); setFilterSprint('') }}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── Kanban Board ── */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-8">
          <div className="flex gap-4 h-full items-start pt-2">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasksByColumn[col.id]}
                onTaskClick={handleTaskClick}
                onNewTask={(status) => setNewTaskStatus(status)}
                onDrop={handleDrop}
                canCreate={canCreate}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={users}
          sprints={sprints}
          onClose={handleCloseDetail}
          onSaved={handleTaskSaved}
        />
      )}

      {/* New task modal */}
      {newTaskStatus !== null && (
        <NewTaskModal
          projects={projects}
          users={users}
          sprints={sprints}
          defaultStatus={newTaskStatus}
          currentUserId={currentUser?.id}
          onClose={() => setNewTaskStatus(null)}
          onCreated={handleTaskCreated}
        />
      )}
    </Layout>
  )
}
