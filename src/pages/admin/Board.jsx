import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { getAllTasks, createTask, updateTask, getTaskComments, createTaskComment } from '../../api/tasks.js'
import { getProjects } from '../../api/projects.js'
import { getUsers, getMentionableUsers } from '../../api/users.js'
import { getGoals } from '../../api/goals.js'
import { getSprints } from '../../api/sprints.js'
import { useAuth } from '../../hooks/useAuth.js'
import { suggestBranchAndPr } from '../../utils/taskSuggestions.js'

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',      headerCls: 'text-slate-400',   dotCls: 'bg-slate-400',   colBg: 'hsl(224, 30%, 18%)', colBorder: 'hsl(224, 30%, 18%)' },
  { id: 'ready',       label: 'Ready',        headerCls: 'text-sky-400',     dotCls: 'bg-sky-400',     colBg: 'hsl(224, 30%, 18%)', colBorder: 'hsl(224, 30%, 18%)' },
  { id: 'in_progress', label: 'In Progress',  headerCls: 'text-amber-400',   dotCls: 'bg-amber-400',   colBg: 'hsl(224, 30%, 18%)', colBorder: 'hsl(224, 30%, 18%)' },
  { id: 'in_review',   label: 'In Review',    headerCls: 'text-violet-400',  dotCls: 'bg-violet-400',  colBg: 'hsl(224, 30%, 18%)', colBorder: 'hsl(224, 30%, 18%)'},
  { id: 'done',        label: 'Done',         headerCls: 'text-emerald-400', dotCls: 'bg-emerald-400', colBg: 'hsl(224, 30%, 18%)', colBorder: 'hsl(224, 30%, 18%)'},
  { id: 'cancelled',   label: "Won't Do",     headerCls: 'text-rose-400',    dotCls: 'bg-rose-400',    colBg: 'hsl(224, 30%, 18%)', colBorder: 'hsl(224, 30%, 18%)' },
]

const ALL_STATUSES = [
  { id: 'backlog',     label: 'Backlog'      },
  { id: 'ready',       label: 'Ready'        },
  { id: 'in_progress', label: 'In Progress'  },
  { id: 'blocked',     label: 'Blocked'      },
  { id: 'in_review',   label: 'In Review'    },
  { id: 'done',        label: 'Done'         },
  { id: 'cancelled',   label: "Won't Do"     },
]

const CATEGORY_COLORS = {
  engineering: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  design:      'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  marketing:   'bg-green-500/20 text-green-400 border border-green-500/30',
  other:       'bg-gray-500/20 text-gray-400 border border-gray-500/30',
}

const inputCls     = 'w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2'
const btnPrimary   = 'flex-1 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

const inputStyle = {
  backgroundColor: 'hsl(224, 25%, 16%)',
  border: '1px solid hsl(224, 30%, 18%)',
  color: 'hsl(224, 40%, 95%)',
}

const btnPrimaryStyle = {
  backgroundColor: 'hsl(244, 100%, 69%)',
  color: 'hsl(224, 30%, 14%)',
}

const btnSecondaryStyle = {
  backgroundColor: 'transparent',
  border: '1px solid hsl(224, 30%, 18%)',
  color: 'hsl(224, 20%, 55%)',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>
        {label}{required && <span style={{ color: 'hsl(0, 100%, 60%)' }} className="ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Project color ─────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  { bg: 'hsl(244, 100%, 69%, 0.15)', text: 'hsl(244, 100%, 80%)' },
  { bg: 'hsl(187, 100%, 40%, 0.15)', text: 'hsl(187, 100%, 65%)' },
  { bg: 'hsl(310, 100%, 55%, 0.15)', text: 'hsl(310, 100%, 75%)' },
  { bg: 'hsl(25,  100%, 55%, 0.15)', text: 'hsl(25,  100%, 70%)' },
  { bg: 'hsl(145, 70%,  45%, 0.15)', text: 'hsl(145, 70%,  65%)' },
  { bg: 'hsl(43,  100%, 55%, 0.15)', text: 'hsl(43,  100%, 70%)' },
  { bg: 'hsl(200, 100%, 50%, 0.15)', text: 'hsl(200, 100%, 70%)' },
]

function projectColor(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % PROJECT_COLORS.length
  return PROJECT_COLORS[Math.abs(h) % PROJECT_COLORS.length]
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
      className="rounded-xl p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-150 group active:opacity-50"
      style={{
        backgroundColor: 'hsl(224, 25%, 16%)',
        border: isBlocked ? '1px solid hsl(0, 100%, 30%)' : '1px solid hsl(224, 30%, 18%)',
      }}
    >
      <p className="text-sm font-medium leading-snug line-clamp-2 mb-2.5" style={{ color: 'hsl(224, 40%, 95%)' }}>
        {task.title}
      </p>

      <div className="flex items-center gap-1.5 flex-wrap mb-2">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize ${CATEGORY_COLORS[task.category] ?? CATEGORY_COLORS.other}`}>
          {task.category}
        </span>
        {isBlocked && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>
            BLOCKED
          </span>
        )}
        {task.prLink && (
          <a
            href={task.prLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors"
            style={{ backgroundColor: 'hsl(259, 100%, 15%)', color: 'hsl(259, 100%, 69%)' }}
          >
            PR ↗
          </a>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.project?.name && (() => {
            const { bg, text } = projectColor(task.project.name)
            return (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate max-w-[100px]"
                style={{ backgroundColor: bg, color: text }}
              >
                {task.project.name}
              </span>
            )
          })()}
          {task.sprint && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate max-w-[80px]" title={task.sprint.name} style={{ backgroundColor: 'hsl(259, 100%, 15%)', color: 'hsl(259, 100%, 69%)' }}>
              {task.sprint.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.storyPoints != null && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
              {task.storyPoints}pt
            </span>
          )}
          {task.assignee && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              title={task.assignee.name}
              style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}
            >
              <span className="text-[9px] font-bold leading-none" style={{ color: 'hsl(224, 30%, 14%)' }}>
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
      <div className="flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0 transition-colors" style={{ backgroundColor: column.colBg, borderColor: isDragOver ? 'hsl(244, 100%, 69%)' : column.colBorder }}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotCls}`} />
          <span className={`text-xs font-bold uppercase tracking-wide ${column.headerCls}`}>
            {column.label}
          </span>
          <span className="text-xs font-medium" style={{ color: 'hsl(224, 20%, 55%)' }}>{tasks.length}</span>
        </div>
        {canCreate && (
          <button
            onClick={() => onNewTask(column.id)}
            className="text-lg leading-none transition-colors"
            style={{ color: 'hsl(224, 20%, 55%)' }}
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
        className="flex-1 overflow-y-auto p-2 space-y-2 rounded-b-xl border min-h-[4rem] transition-all"
        style={{
          backgroundColor: column.colBg,
          borderColor: isDragOver ? 'hsl(244, 100%, 69%)' : column.colBorder,
          boxShadow: isDragOver ? '0 0 0 2px hsl(244, 100%, 69%, 0.2)' : 'none',
        }}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={onTaskClick} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-center py-4 select-none" style={{ color: 'hsl(224, 20%, 55%)' }}>
            {isDragOver ? 'Drop here' : 'Empty'}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Branch / PR suggestion ────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[10px] font-medium px-2 py-0.5 rounded transition-colors shrink-0"
      style={
        copied
          ? { backgroundColor: 'hsl(145, 70%, 10%)', color: 'hsl(145, 70%, 55%)' }
          : { backgroundColor: 'hsl(224, 30%, 22%)', color: 'hsl(224, 20%, 65%)' }
      }
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  )
}

function BranchSuggestion({ task }) {
  const { branch, prTitle } = suggestBranchAndPr(task)

  return (
    <div className="rounded-lg px-3 py-2.5 space-y-2" style={{ backgroundColor: 'hsl(224, 30%, 18%)' }}>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'hsl(224, 20%, 50%)' }}>
        Sugerencias de git
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono truncate" style={{ color: 'hsl(259, 100%, 75%)' }}>{branch}</code>
        <CopyButton text={branch} />
      </div>
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs truncate" style={{ color: 'hsl(224, 40%, 80%)' }}>{prTitle}</span>
        <CopyButton text={prTitle} />
      </div>
    </div>
  )
}

// ── Comment body with @mention highlighting ───────────────────────────────────

function CommentBody({ body }) {
  const parts = body.split(/(@\w[\w\s]*?\b)/g)
  return (
    <p className="text-xs whitespace-pre-wrap" style={{ color: 'hsl(224, 20%, 70%)' }}>
      {parts.map((part, i) =>
        /^@\w/.test(part) ? (
          <span key={i} style={{ color: 'hsl(259, 100%, 75%)', fontWeight: 600 }}>{part}</span>
        ) : (
          part
        )
      )}
    </p>
  )
}

// ── Task Detail / Edit Modal ──────────────────────────────────────────────────

function TaskDetailModal({ task, users, projects, onClose, onSaved }) {
  const { user: currentUser } = useAuth()
  const [form, setForm] = useState({
    status:       task.status,
    assignedTo:   task.assignedTo ?? '',
    sprintId:     task.sprintId   ?? '',
    projectId:    task.projectId  ?? '',
    prLink:       task.prLink ?? '',
    storyPoints:  task.storyPoints ?? '',
    estimatedHrs: task.estimatedHrs != null ? String(task.estimatedHrs) : '',
    title:        task.title,
    description:  task.description ?? '',
  })
  const [availableSprints, setAvailableSprints] = useState([])
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [comments, setComments]       = useState([])
  const [commentBody, setCommentBody] = useState('')
  const [posting, setPosting]         = useState(false)
  const [mentionedUserIds, setMentionedUserIds] = useState([])
  const [mentionQuery, setMentionQuery]         = useState(null) // string after '@', or null
  const [mentionIndex, setMentionIndex]         = useState(0)
  const commentRef = useRef(null)

  useEffect(() => {
    if (!form.projectId) { setAvailableSprints([]); return }
    getSprints(form.projectId).then(setAvailableSprints).catch(() => setAvailableSprints([]))
  }, [form.projectId])

  useEffect(() => {
    getTaskComments(task.id).then(setComments).catch(() => {})
  }, [task.id])

  const [mentionableUsers, setMentionableUsers] = useState([])
  useEffect(() => {
    getMentionableUsers()
      .then((all) => setMentionableUsers(all.filter((u) => u.id !== currentUser?.id)))
      .catch(() => {})
  }, [currentUser?.id])

  function set(field, value) {
    if (field === 'projectId') {
      setForm((prev) => ({ ...prev, projectId: value, sprintId: '' }))
    } else {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
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
        projectId:    form.projectId    || null,
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

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return mentionableUsers.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6)
  }, [mentionQuery, mentionableUsers])

  function handleCommentChange(e) {
    const val = e.target.value
    setCommentBody(val)

    // Detect '@' trigger: find the last '@' before cursor that hasn't been closed by a space
    const cursor = e.target.selectionStart
    const textToCursor = val.slice(0, cursor)
    const atIdx = textToCursor.lastIndexOf('@')
    if (atIdx !== -1) {
      const fragment = textToCursor.slice(atIdx + 1)
      if (!fragment.includes(' ')) {
        setMentionQuery(fragment)
        setMentionIndex(0)
        return
      }
    }
    setMentionQuery(null)
  }

  function applyMention(user) {
    const cursor = commentRef.current?.selectionStart ?? commentBody.length
    const textToCursor = commentBody.slice(0, cursor)
    const atIdx = textToCursor.lastIndexOf('@')
    const before = commentBody.slice(0, atIdx)
    const after  = commentBody.slice(cursor)
    const inserted = `@${user.name} `
    setCommentBody(before + inserted + after)
    setMentionedUserIds((prev) => prev.includes(user.id) ? prev : [...prev, user.id])
    setMentionQuery(null)
    setTimeout(() => {
      const pos = (before + inserted).length
      commentRef.current?.setSelectionRange(pos, pos)
      commentRef.current?.focus()
    }, 0)
  }

  function handleCommentKeyDown(e) {
    if (mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setMentionIndex((i) => (i + 1) % mentionSuggestions.length); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setMentionIndex((i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length); return }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); applyMention(mentionSuggestions[mentionIndex]); return }
      if (e.key === 'Escape') { setMentionQuery(null); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment(e)
    }
  }

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setPosting(true)
    try {
      const comment = await createTaskComment(task.id, commentBody.trim(), mentionedUserIds)
      setComments((prev) => [...prev, comment])
      setCommentBody('')
      setMentionedUserIds([])
      setMentionQuery(null)
    } catch {
      // silently fail
    } finally {
      setPosting(false)
    }
  }

  const devUsers = users.filter((u) => ['developer', 'designer', 'pm', 'admin', 'ceo'].includes(u.role))
  const isDevOrDesigner = ['developer', 'designer'].includes(currentUser?.role)
  const isUnassigned    = !form.assignedTo
  const isAssignedToMe  = form.assignedTo === currentUser?.id

  return (
    <Modal title="Task Details" onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Title" required>
          <input style={inputStyle} className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </Field>

        <Field label="Project" required>
          <select style={inputStyle} className={inputCls} value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select style={inputStyle} className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {ALL_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Assigned To">
            {devUsers.length > 0 ? (
              <select style={inputStyle} className={inputCls} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
                <option value="">— Unassigned —</option>
                {devUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            ) : isDevOrDesigner ? (
              <div className="flex items-center gap-2">
                {isAssignedToMe ? (
                  <span className="text-sm font-medium" style={{ color: 'hsl(224, 40%, 95%)' }}>{currentUser.name}</span>
                ) : isUnassigned ? (
                  <button
                    type="button"
                    onClick={() => set('assignedTo', currentUser.id)}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: 'hsl(244, 100%, 15%)', color: 'hsl(244, 100%, 69%)', border: '1px solid hsl(244, 100%, 30%)' }}
                  >
                    Tomar ticket
                  </button>
                ) : (
                  <span className="text-sm italic" style={{ color: 'hsl(224, 20%, 55%)' }}>Asignado a otro</span>
                )}
                {isAssignedToMe && (
                  <button
                    type="button"
                    onClick={() => set('assignedTo', '')}
                    className="text-xs transition-colors"
                    style={{ color: 'hsl(224, 20%, 55%)' }}
                  >
                    Liberar
                  </button>
                )}
              </div>
            ) : (
              <span className="text-sm italic" style={{ color: 'hsl(224, 20%, 55%)' }}>Sin asignar</span>
            )}
          </Field>
        </div>

        <Field label="Sprint">
          <select style={inputStyle} className={inputCls} value={form.sprintId} onChange={(e) => set('sprintId', e.target.value)}>
            <option value="">— Sin sprint —</option>
            {availableSprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>

        <Field label="Description">
          <textarea
            style={inputStyle}
            className={`${inputCls} resize-none`}
            rows={6}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Optional details…"
          />
        </Field>

        <Field label="PR Link">
          <input
            style={inputStyle}
            className={inputCls}
            type="url"
            value={form.prLink}
            onChange={(e) => set('prLink', e.target.value)}
            placeholder="https://github.com/org/repo/pull/123"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Story Points">
            <input style={inputStyle} className={inputCls} type="number" min="0" max="100" value={form.storyPoints} onChange={(e) => set('storyPoints', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Est. Hours">
            <input style={inputStyle} className={inputCls} type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={(e) => set('estimatedHrs', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>

        <BranchSuggestion task={{ ...task, title: form.title }} />

        {/* Read-only metadata */}
        {(task.goal || task.reviewer) && (
          <div className="rounded-lg px-3 py-2.5 text-xs space-y-1.5" style={{ backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
            {task.goal     && <div className="flex gap-2"><span className="font-semibold">Goal:</span><span>{task.goal.title}</span></div>}
            {task.reviewer && <div className="flex gap-2"><span className="font-semibold">Reviewed by:</span><span>{task.reviewer.name}</span></div>}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary} style={btnPrimaryStyle}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* ── Comments ── */}
      <div className="mt-6 border-t pt-5" style={{ borderColor: 'hsl(224, 30%, 18%)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'hsl(224, 40%, 95%)' }}>
          Comments{comments.length > 0 && <span className="font-normal ml-1" style={{ color: 'hsl(224, 20%, 55%)' }}>({comments.length})</span>}
        </h3>

        {comments.length === 0 && (
          <p className="text-xs mb-4" style={{ color: 'hsl(224, 20%, 55%)' }}>No comments yet.</p>
        )}

        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}>
                <span className="text-[10px] font-bold leading-none" style={{ color: 'hsl(224, 30%, 14%)' }}>
                  {c.author.name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2" style={{ backgroundColor: 'hsl(224, 30%, 18%)' }}>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>{c.author.name}</span>
                  <span className="text-[10px]" style={{ color: 'hsl(224, 20%, 55%)' }}>
                    {new Date(c.createdAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <CommentBody body={c.body} />
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}>
            <span className="text-[10px] font-bold leading-none" style={{ color: 'hsl(224, 30%, 14%)' }}>
              {currentUser?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <textarea
                ref={commentRef}
                style={inputStyle}
                className={`${inputCls} resize-none w-full`}
                rows={2}
                value={commentBody}
                onChange={handleCommentChange}
                onKeyDown={handleCommentKeyDown}
                placeholder="Agregar comentario… (@nombre para mencionar, Enter para enviar)"
              />
              {mentionSuggestions.length > 0 && (
                <div
                  className="absolute bottom-full mb-1 left-0 w-full rounded-lg overflow-hidden shadow-xl z-50"
                  style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(224, 30%, 25%)' }}
                >
                  {mentionSuggestions.map((u, i) => (
                    <button
                      key={u.id}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); applyMention(u) }}
                      className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: i === mentionIndex ? 'hsl(244, 100%, 20%)' : 'transparent',
                        color: i === mentionIndex ? 'hsl(259, 100%, 80%)' : 'hsl(224, 20%, 70%)',
                      }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                        style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
                      >
                        {u.name[0].toUpperCase()}
                      </span>
                      <span>{u.name}</span>
                      <span className="ml-auto capitalize" style={{ color: 'hsl(224, 20%, 45%)' }}>{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={posting || !commentBody.trim()}
              className="px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 self-end"
              style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
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

function NewTaskModal({ projects, users, defaultStatus, currentUserId, onClose, onCreated }) {
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
  const [goals, setGoals]                   = useState([])
  const [availableSprints, setAvailableSprints] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    if (!form.projectId) return
    getGoals(form.projectId)
      .then(setGoals)
      .catch(() => setGoals([]))
  }, [form.projectId])

  useEffect(() => {
    if (!form.projectId) { setAvailableSprints([]); return }
    getSprints(form.projectId).then(setAvailableSprints).catch(() => setAvailableSprints([]))
  }, [form.projectId])

  function set(field, value) {
    if (field === 'projectId') {
      setForm((prev) => ({ ...prev, projectId: value, sprintId: '', goalId: '' }))
    } else {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
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
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Title" required>
          <input style={inputStyle} className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Build login page" autoFocus />
        </Field>

        <Field label="Description">
          <textarea style={inputStyle} className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional details…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Project" required>
            <select style={inputStyle} className={inputCls} value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select style={inputStyle} className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {ALL_STATUSES.filter((s) => s.id !== 'blocked').map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" required>
            <select style={inputStyle} className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {['engineering','design','marketing','other'].map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
          <Field label="Goal">
            <select style={inputStyle} className={inputCls} value={form.goalId} onChange={(e) => set('goalId', e.target.value)}>
              <option value="">— None —</option>
              {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
            </select>
          </Field>
        </div>

        {availableSprints.length > 0 && (
          <Field label="Sprint">
            <select style={inputStyle} className={inputCls} value={form.sprintId} onChange={(e) => set('sprintId', e.target.value)}>
              <option value="">— Sin sprint —</option>
              {availableSprints.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Story Points">
            <input style={inputStyle} className={inputCls} type="number" min="0" max="100" value={form.storyPoints} onChange={(e) => set('storyPoints', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Est. Hours">
            <input style={inputStyle} className={inputCls} type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={(e) => set('estimatedHrs', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>

        {devUsers.length > 0 && (
          <Field label="Assign To">
            <select style={inputStyle} className={inputCls} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
              <option value="">— Unassigned —</option>
              {devUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </Field>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary} style={btnPrimaryStyle}>
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
  const [hideTerminal, setHideTerminal]   = useState(false)
  const [hideOldSprints, setHideOldSprints] = useState(false)

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
    if (hideTerminal  && (t.status === 'done' || t.status === 'cancelled')) return false
    if (hideOldSprints && t.sprint?.status === 'completed') return false
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
        <div className="flex items-center justify-center py-40 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading board…</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>
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
              <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>{totalVisible} task{totalVisible !== 1 ? 's' : ''}</p>
            </div>
            {canCreate && (
              <button
                onClick={() => setNewTaskStatus('backlog')}
                className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
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
              className="text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2"
              style={inputStyle}
            >
              <option value="">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2"
              style={inputStyle}
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
                className="text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2"
                style={inputStyle}
              >
                <option value="">All Sprints</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => setHideTerminal((v) => !v)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                backgroundColor: hideTerminal ? 'hsl(224, 30%, 25%)' : 'transparent',
                color: hideTerminal ? 'hsl(224, 40%, 95%)' : 'hsl(224, 20%, 55%)',
                borderColor: hideTerminal ? 'hsl(224, 30%, 25%)' : 'hsl(224, 30%, 18%)',
              }}
            >
              {hideTerminal ? 'Mostrando activos' : 'Ocultar done / won\'t do'}
            </button>

            <button
              onClick={() => setHideOldSprints((v) => !v)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                backgroundColor: hideOldSprints ? 'hsl(224, 30%, 25%)' : 'transparent',
                color: hideOldSprints ? 'hsl(224, 40%, 95%)' : 'hsl(224, 20%, 55%)',
                borderColor: hideOldSprints ? 'hsl(224, 30%, 25%)' : 'hsl(224, 30%, 18%)',
              }}
            >
              {hideOldSprints ? 'Mostrando todos los sprints' : 'Ocultar sprints cerrados'}
            </button>

            {(filterProject || filterUser || filterSprint) && (
              <button
                onClick={() => { setFilterProject(''); setFilterUser(''); setFilterSprint('') }}
                className="text-xs underline transition-colors"
                style={{ color: 'hsl(224, 20%, 55%)' }}
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
          projects={projects}
          onClose={handleCloseDetail}
          onSaved={handleTaskSaved}
        />
      )}

      {/* New task modal */}
      {newTaskStatus !== null && (
        <NewTaskModal
          projects={projects}
          users={users}
          defaultStatus={newTaskStatus}
          currentUserId={currentUser?.id}
          onClose={() => setNewTaskStatus(null)}
          onCreated={handleTaskCreated}
        />
      )}
    </Layout>
  )
}
