import { useEffect, useState } from 'react'
import { getBacklogTasks, createTask, updateTask } from '../../api/tasks.js'
import { getProjects } from '../../api/projects.js'
import { getGoals } from '../../api/goals.js'
import { getUsers } from '../../api/users.js'
import Modal from '../Modal.jsx'

const CATEGORY_OPTIONS = ['engineering', 'design', 'marketing', 'other']

const CATEGORY_STYLES = {
  engineering: 'bg-blue-100 text-blue-800',
  design:      'bg-purple-100 text-purple-800',
  marketing:   'bg-green-100 text-green-800',
  other:       'bg-gray-100 text-gray-600',
}

// ── New Task Modal ────────────────────────────────────────────────────────────

function NewTaskModal({ projects, users, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'engineering',
    projectId: projects[0]?.id ?? '',
    goalId: '',
    storyPoints: '',
    estimatedHrs: '',
    assignedTo: '',
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
      const payload = {
        title:        form.title,
        description:  form.description || null,
        category:     form.category,
        projectId:    form.projectId,
        goalId:       form.goalId      || null,
        storyPoints:  form.storyPoints  !== '' ? Number(form.storyPoints)  : null,
        estimatedHrs: form.estimatedHrs !== '' ? Number(form.estimatedHrs) : null,
        assignedTo:   form.assignedTo  || null,
        status:       'backlog',
      }
      const task = await createTask(payload)
      onCreated(task)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  const developers = users.filter((u) => ['developer', 'designer', 'pm'].includes(u.role))

  return (
    <Modal title="Create Backlog Task" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Title" required>
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Build login page" />
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
          <Field label="Category" required>
            <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Goal">
          <select className={inputCls} value={form.goalId} onChange={(e) => set('goalId', e.target.value)}>
            <option value="">— None —</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Story Points">
            <input className={inputCls} type="number" min="0" max="100" value={form.storyPoints} onChange={(e) => set('storyPoints', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Estimated Hours">
            <input className={inputCls} type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={(e) => set('estimatedHrs', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>

        <Field label="Assign To">
          <select className={inputCls} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
            <option value="">— Unassigned —</option>
            {developers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </Field>

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

// ── Main Tab ──────────────────────────────────────────────────────────────────

export default function BacklogTab() {
  const [tasks, setTasks]       = useState([])
  const [projects, setProjects] = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [showNew, setShowNew]         = useState(false)
  const [assigningTask, setAssigning] = useState(null)

  useEffect(() => {
    Promise.all([getBacklogTasks(), getProjects(), getUsers()])
      .then(([fetchedTasks, fetchedProjects, fetchedUsers]) => {
        setTasks(fetchedTasks)
        setProjects(fetchedProjects)
        setUsers(fetchedUsers)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleCreated(task) {
    setTasks((prev) => [task, ...prev])
    setShowNew(false)
  }

  async function handleAssign(taskId, userId) {
    try {
      const updated = await updateTask(taskId, { assignedTo: userId || null })
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
      setAssigning(null)
    } catch (err) {
      alert(err.response?.data?.error ?? err.message)
    }
  }

  const developers = users.filter((u) => ['developer', 'designer', 'pm'].includes(u.role))

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading backlog…</p>
  if (error)   return <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''} in backlog</p>
        <button onClick={() => setShowNew(true)} className={btnAction}>+ New Task</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={th}>Task</th>
              <th className={th}>Project</th>
              <th className={th}>Category</th>
              <th className={th}>Points</th>
              <th className={th}>Assigned To</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const assignee = users.find((u) => u.id === t.assignedTo)
              return (
                <tr key={t.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className={td}>
                    <p className="font-medium text-gray-900">{t.title}</p>
                    {t.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>
                    )}
                  </td>
                  <td className={td}>
                    <span className="text-gray-600">{t.project?.name ?? '—'}</span>
                  </td>
                  <td className={td}>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${CATEGORY_STYLES[t.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className={td}>
                    <span className="text-gray-600">{t.storyPoints ?? '—'}</span>
                  </td>
                  <td className={td}>
                    {assigningTask === t.id ? (
                      <select
                        autoFocus
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        defaultValue={t.assignedTo ?? ''}
                        onBlur={() => setAssigning(null)}
                        onChange={(e) => handleAssign(t.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {developers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    ) : (
                      <button
                        onClick={() => setAssigning(t.id)}
                        className="text-left text-xs hover:text-indigo-600 transition-colors"
                      >
                        {assignee ? assignee.name : <span className="text-gray-400 italic">Unassigned</span>}
                      </button>
                    )}
                  </td>
                  <td className={`${td} text-right`}>
                    <button
                      onClick={() => setAssigning(t.id)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              )
            })}
            {tasks.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-10">No backlog tasks found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NewTaskModal
          projects={projects}
          users={users}
          onClose={() => setShowNew(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const inputCls    = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary  = 'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors'
const btnAction   = 'text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors'
const th = 'text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide'
const td = 'px-4 py-3 text-gray-700'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
