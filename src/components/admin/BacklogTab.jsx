import { useEffect, useState } from 'react'
import { getBacklogTasks, createTask, updateTask } from '../../api/tasks.js'
import { getProjects } from '../../api/projects.js'
import { getGoals } from '../../api/goals.js'
import { getUsers } from '../../api/users.js'
import Modal from '../Modal.jsx'

const CATEGORY_OPTIONS = ['engineering', 'design', 'marketing', 'other']

const CATEGORY_STYLES = {
  engineering: { backgroundColor: 'hsl(217, 100%, 20%)', color: 'hsl(217, 100%, 50%)' },
  design:      { backgroundColor: 'hsl(276, 100%, 20%)', color: 'hsl(276, 100%, 50%)' },
  marketing:   { backgroundColor: 'hsl(120, 100%, 20%)', color: 'hsl(120, 100%, 50%)' },
  other:       { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' },
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
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Title" required>
          <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Build login page" />
        </Field>

        <Field label="Description">
          <textarea style={{ ...inputStyle, resize: 'none' }} rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional details…" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Project" required>
            <select style={inputStyle} value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Category" required>
            <select style={inputStyle} value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Goal">
          <select style={inputStyle} value={form.goalId} onChange={(e) => set('goalId', e.target.value)}>
            <option value="">— None —</option>
            {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Story Points">
            <input style={inputStyle} type="number" min="0" max="100" value={form.storyPoints} onChange={(e) => set('storyPoints', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Estimated Hours">
            <input style={inputStyle} type="number" min="0" step="0.5" value={form.estimatedHrs} onChange={(e) => set('estimatedHrs', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>

        <Field label="Assign To">
          <select style={inputStyle} value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
            <option value="">— Unassigned —</option>
            {developers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
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

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading backlog…</p>
  if (error)   return <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>{tasks.length} task{tasks.length !== 1 ? 's' : ''} in backlog</p>
        <button onClick={() => setShowNew(true)} style={btnActionStyle}>+ New Task</button>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
              <th style={thStyle}>Task</th>
              <th style={thStyle}>Project</th>
              <th style={thStyle}>Category</th>
              <th style={thStyle}>Points</th>
              <th style={thStyle}>Assigned To</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => {
              const assignee = users.find((u) => u.id === t.assignedTo)
              return (
                <tr key={t.id} style={{ borderBottom: '1px solid hsl(224, 30%, 18%)', backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(224, 30%, 12%)' }}>
                  <td style={tdStyle}>
                    <p className="font-medium">{t.title}</p>
                    {t.description && (
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'hsl(224, 20%, 55%)' }}>{t.description}</p>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <span>{t.project?.name ?? '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={{ ...CATEGORY_STYLES[t.category] ?? { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' } }}>
                      {t.category}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span>{t.storyPoints ?? '—'}</span>
                  </td>
                  <td style={tdStyle}>
                    {assigningTask === t.id ? (
                      <select
                        autoFocus
                        style={{ ...inputStyle, fontSize: '12px', padding: '4px 8px' }}
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
                        className="text-left text-xs transition-colors"
                        style={{ color: assignee ? 'hsl(224, 40%, 95%)' : 'hsl(224, 20%, 55%)', fontStyle: assignee ? 'normal' : 'italic' }}
                      >
                        {assignee ? assignee.name : 'Unassigned'}
                      </button>
                    )}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    <button
                      onClick={() => setAssigning(t.id)}
                      className="text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                      style={{ color: 'hsl(224, 30%, 14%)', backgroundColor: 'hsl(244, 100%, 69%)' }}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              )
            })}
            {tasks.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10" style={{ color: 'hsl(224, 20%, 55%)' }}>No backlog tasks found.</td></tr>
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


const inputStyle = { backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(224, 30%, 20%)', color: 'hsl(224, 40%, 95%)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', width: '100%' }
const btnPrimaryStyle = { flex: 1, padding: '8px 16px', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnSecondaryStyle = { padding: '8px 16px', border: '1px solid hsl(224, 30%, 18%)', color: 'hsl(224, 40%, 95%)', fontSize: '14px', fontWeight: '500', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnActionStyle = { padding: '6px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }
const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'hsl(224, 20%, 55%)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle = { padding: '12px 16px', color: 'hsl(224, 40%, 95%)', fontSize: '14px' }

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
