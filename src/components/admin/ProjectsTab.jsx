import { useEffect, useState } from 'react'
import { getProjects, updateProject, createProject, deleteProject } from '../../api/projects.js'
import { getTeams, createTeam, addTeamMember, removeTeamMember, renameTeam, deleteTeam } from '../../api/teams.js'
import { getUsers } from '../../api/users.js'
import Modal from '../Modal.jsx'

const STATUS_OPTIONS = ['on_track', 'at_risk', 'delayed', 'completed']
const TYPE_OPTIONS = ['external', 'internal']

const STATUS_STYLES = {
  on_track:  'bg-green-100 text-green-800',
  at_risk:   'bg-yellow-100 text-yellow-800',
  delayed:   'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-600',
}

const ROLE_STYLES = {
  developer: 'bg-blue-50 text-blue-700',
  designer:  'bg-purple-50 text-purple-700',
  admin:     'bg-orange-50 text-orange-700',
  ceo:       'bg-red-50 text-red-700',
  client:    'bg-gray-50 text-gray-600',
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCurrency(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

// ── Team management panel ──────────────────────────────────────────────────────

function TeamPanel({ projectId }) {
  const [teams, setTeams]       = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [newTeamName, setNewTeamName]     = useState('')
  const [creatingTeam, setCreatingTeam]   = useState(false)
  const [addingTo, setAddingTo]           = useState(null)
  const [selectedUser, setSelectedUser]   = useState('')
  const [renamingId, setRenamingId]       = useState(null)
  const [renameValue, setRenameValue]     = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([getTeams(projectId), getUsers()])
      .then(([t, u]) => { setTeams(t); setAllUsers(u) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setCreatingTeam(true)
    setError(null)
    try {
      const team = await createTeam(projectId, newTeamName.trim())
      setTeams((prev) => [...prev, { ...team, teamMembers: [] }])
      setNewTeamName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreatingTeam(false)
    }
  }

  async function handleAddMember(teamId) {
    if (!selectedUser) return
    setBusy(true)
    setError(null)
    try {
      const member = await addTeamMember(teamId, selectedUser)
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, teamMembers: [...t.teamMembers, member] } : t
        )
      )
      setSelectedUser('')
      setAddingTo(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveMember(teamId, userId) {
    setBusy(true)
    setError(null)
    try {
      await removeTeamMember(teamId, userId)
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId
            ? { ...t, teamMembers: t.teamMembers.filter((m) => m.user.id !== userId) }
            : t
        )
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRenameTeam(teamId) {
    if (!renameValue.trim()) return
    setBusy(true)
    setError(null)
    try {
      const updated = await renameTeam(teamId, renameValue.trim())
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, name: updated.name } : t))
      setRenamingId(null)
      setRenameValue('')
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteTeam(teamId, teamName) {
    if (!confirm(`Delete team "${teamName}"? All members will be removed.`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteTeam(teamId)
      setTeams((prev) => prev.filter((t) => t.id !== teamId))
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setBusy(false)
    }
  }

  function availableUsers(teamId) {
    const team = teams.find((t) => t.id === teamId)
    if (!team) return allUsers
    const memberIds = new Set(team.teamMembers.map((m) => m.user.id))
    return allUsers.filter((u) => !memberIds.has(u.id))
  }

  if (loading) return <p className="text-sm text-gray-400 py-6 text-center">Loading teams…</p>

  return (
    <div className="space-y-5">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Existing teams */}
      {teams.map((team) => (
        <div key={team.id} className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            {renamingId === team.id ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input
                  className="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTeam(team.id); if (e.key === 'Escape') setRenamingId(null) }}
                />
                <button onClick={() => handleRenameTeam(team.id)} disabled={busy} className="text-xs text-indigo-600 font-semibold hover:text-indigo-800">Save</button>
                <button onClick={() => setRenamingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-800">{team.name}</span>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setAddingTo(addingTo === team.id ? null : team.id); setSelectedUser('') }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {addingTo === team.id ? 'Cancel' : '+ Add member'}
              </button>
              <button
                onClick={() => { setRenamingId(team.id); setRenameValue(team.name) }}
                className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Rename
              </button>
              <button
                onClick={() => handleDeleteTeam(team.id, team.name)}
                disabled={busy}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Add member row */}
          {addingTo === team.id && (
            <div className="flex gap-2 px-4 py-3 bg-indigo-50/50 border-b border-gray-200">
              <select
                className={`${inputCls} flex-1`}
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a user…</option>
                {availableUsers(team.id).map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
              <button
                disabled={!selectedUser || busy}
                onClick={() => handleAddMember(team.id)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {busy ? '…' : 'Add'}
              </button>
            </div>
          )}

          {/* Members list */}
          {team.teamMembers.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No members yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {team.teamMembers.map((m) => (
                <li key={m.user.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{m.user.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[m.user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {m.user.role}
                    </span>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => handleRemoveMember(team.id, m.user.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Create new team */}
      <form onSubmit={handleCreateTeam} className="flex gap-2">
        <input
          className={`${inputCls} flex-1`}
          placeholder="New team name…"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creatingTeam || !newTeamName.trim()}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {creatingTeam ? '…' : 'Create Team'}
        </button>
      </form>
    </div>
  )
}

// ── Edit modal with tabs ───────────────────────────────────────────────────────

function EditModal({ project, onClose, onSaved }) {
  const [tab, setTab] = useState('details')
  const [form, setForm] = useState({
    name: project.name ?? '',
    description: project.description ?? '',
    type: project.type ?? 'external',
    status: project.status ?? 'on_track',
    budget: project.budget ?? '',
    deadline: project.deadline ? project.deadline.slice(0, 10) : '',
    clientName: project.clientName ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const updated = await updateProject(project.id, {
        name: form.name,
        description: form.description || null,
        type: form.type,
        status: form.status,
        budget: form.budget !== '' ? Number(form.budget) : null,
        deadline: form.deadline || null,
        clientName: form.clientName || null,
      })
      onSaved(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Edit — ${project.name}`} onClose={onClose}>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200 -mt-1">
        {['details', 'team'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <Field label="Project Name" required>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>

          <Field label="Description">
            <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget ($)">
              <input className={inputCls} type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="e.g. 50000" />
            </Field>
            <Field label="Deadline">
              <input className={inputCls} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </Field>
          </div>

          <Field label="Client Name">
            <input className={inputCls} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Acme Corp" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <TeamPanel projectId={project.id} />
      )}
    </Modal>
  )
}

// ── New project modal ──────────────────────────────────────────────────────────

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'external',
    status: 'on_track',
    budget: '',
    deadline: '',
    clientName: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const created = await createProject({
        name: form.name,
        description: form.description || null,
        type: form.type,
        status: form.status,
        budget: form.budget !== '' ? Number(form.budget) : null,
        deadline: form.deadline || null,
        clientName: form.clientName || null,
      })
      onCreated(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="New Project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Project Name" required>
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>

        <Field label="Description">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPE_OPTIONS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget ($)">
            <input className={inputCls} type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="e.g. 50000" />
          </Field>
          <Field label="Deadline">
            <input className={inputCls} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </Field>
        </div>

        <Field label="Client Name">
          <input className={inputCls} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Acme Corp" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export default function ProjectsTab() {
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [editing, setEditing]         = useState(null)
  const [showNewProject, setShowNewProject] = useState(false)

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSaved(updated) {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
    setEditing(null)
  }

  function handleCreated(created) {
    setProjects((prev) => [created, ...prev])
    setShowNewProject(false)
  }

  async function handleDelete(project) {
    if (!confirm(`Delete project "${project.name}"? This will remove all teams, tasks, and associated data.`)) return
    try {
      await deleteProject(project.id)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading projects…</p>
  if (error)   return <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowNewProject(true)} className={btnAction}>+ New Project</button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className={th}>Project</th>
              <th className={th}>Type</th>
              <th className={th}>Status</th>
              <th className={th}>Budget</th>
              <th className={th}>Deadline</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <td className={td}>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  {p.clientName && <p className="text-xs text-gray-400 mt-0.5">{p.clientName}</p>}
                </td>
                <td className={td}>
                  <span className="capitalize text-gray-600">{p.type}</span>
                </td>
                <td className={td}>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </td>
                <td className={td}>{formatCurrency(p.budget)}</td>
                <td className={td}>{formatDate(p.deadline)}</td>
                <td className={`${td} text-right`}>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditing(p)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-xs font-medium text-red-500 hover:text-red-700 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-10">No projects found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <EditModal project={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreated={handleCreated} />}
    </div>
  )
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const inputCls     = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary   = 'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors'
const btnAction    = 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors'
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
