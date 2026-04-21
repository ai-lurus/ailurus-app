import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjects, updateProject, createProject, deleteProject } from '../../api/projects.js'
import { getTeams, createTeam, addTeamMember, removeTeamMember, renameTeam, deleteTeam } from '../../api/teams.js'
import { getUsers } from '../../api/users.js'
import Modal from '../Modal.jsx'

const STATUS_OPTIONS = ['on_track', 'at_risk', 'delayed', 'completed']
const TYPE_OPTIONS = ['external', 'internal']

const STATUS_STYLES = {
  on_track:  { backgroundColor: 'hsl(120, 100%, 20%)', color: 'hsl(120, 100%, 50%)' },
  at_risk:   { backgroundColor: 'hsl(51, 100%, 20%)', color: 'hsl(51, 100%, 50%)' },
  delayed:   { backgroundColor: 'hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' },
  completed: { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' },
}

const ROLE_STYLES = {
  developer: { backgroundColor: 'hsl(210, 100%, 20%)', color: 'hsl(210, 100%, 60%)' },
  designer:  { backgroundColor: 'hsl(270, 100%, 20%)', color: 'hsl(270, 100%, 60%)' },
  admin:     { backgroundColor: 'hsl(25, 100%, 20%)', color: 'hsl(25, 100%, 60%)' },
  ceo:       { backgroundColor: 'hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' },
  client:    { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' },
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

  if (loading) return <p className="text-sm py-6 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading teams…</p>

  return (
    <div className="space-y-5">
      {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

      {/* Existing teams */}
      {teams.map((team) => (
        <div key={team.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
          <div className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
            {renamingId === team.id ? (
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input
                  className="flex-1 px-2 py-1 text-sm rounded-lg focus:outline-none focus:ring-2"
                  style={{ backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(244, 100%, 69%)', color: 'hsl(224, 40%, 95%)', outline: 'none' }}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTeam(team.id); if (e.key === 'Escape') setRenamingId(null) }}
                />
                <button onClick={() => handleRenameTeam(team.id)} disabled={busy} className="text-xs font-semibold" style={{ color: 'hsl(244, 100%, 69%)' }}>Save</button>
                <button onClick={() => setRenamingId(null)} className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>Cancel</button>
              </div>
            ) : (
              <span className="text-sm font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>{team.name}</span>
            )}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setAddingTo(addingTo === team.id ? null : team.id); setSelectedUser('') }}
                className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                style={{ color: 'hsl(244, 100%, 69%)', backgroundColor: addingTo === team.id ? 'hsl(244, 100%, 20%)' : 'transparent' }}
              >
                {addingTo === team.id ? 'Cancel' : '+ Add member'}
              </button>
              <button
                onClick={() => { setRenamingId(team.id); setRenameValue(team.name) }}
                className="text-xs px-2 py-1 rounded-lg transition-colors"
                style={{ color: 'hsl(224, 20%, 55%)', backgroundColor: 'transparent' }}
              >
                Rename
              </button>
              <button
                onClick={() => handleDeleteTeam(team.id, team.name)}
                disabled={busy}
                className="text-xs px-2 py-1 rounded-lg transition-colors disabled:opacity-40"
                style={{ color: 'hsl(0, 100%, 60%)' }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Add member row */}
          {addingTo === team.id && (
            <div className="flex gap-2 px-4 py-3" style={{ backgroundColor: 'hsl(244, 100%, 10%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
              <select
                style={{ backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(224, 30%, 20%)', color: 'hsl(224, 40%, 95%)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', flex: 1 }}
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
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
              >
                {busy ? '…' : 'Add'}
              </button>
            </div>
          )}

          {/* Members list */}
          {team.teamMembers.length === 0 ? (
            <p className="text-xs px-4 py-3" style={{ color: 'hsl(224, 20%, 55%)' }}>No members yet.</p>
          ) : (
            <ul style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
              {team.teamMembers.map((m, idx) => (
                <li key={m.user.id} className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: idx < team.teamMembers.length - 1 ? '1px solid hsl(224, 30%, 18%)' : 'none' }}>
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'hsl(224, 40%, 95%)' }}>{m.user.name}</span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={ROLE_STYLES[m.user.role] ?? { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
                      {m.user.role}
                    </span>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => handleRemoveMember(team.id, m.user.id)}
                    className="text-xs px-2 py-1 rounded transition-colors disabled:opacity-40"
                    style={{ color: 'hsl(0, 100%, 60%)' }}
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
          style={{ backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(224, 30%, 20%)', color: 'hsl(224, 40%, 95%)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', flex: 1 }}
          placeholder="New team name…"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creatingTeam || !newTeamName.trim()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
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
      <div className="flex gap-1 mb-5 -mt-1" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
        {['details', 'team'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors`}
            style={{
              borderBottom: tab === t ? '2px solid hsl(244, 100%, 69%)' : '2px solid transparent',
              marginBottom: '-1px',
              color: tab === t ? 'hsl(244, 100%, 69%)' : 'hsl(224, 20%, 55%)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

          <Field label="Project Name" required>
            <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>

          <Field label="Description">
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select style={inputStyle} value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={inputStyle} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget ($)">
              <input style={inputStyle} type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="e.g. 50000" />
            </Field>
            <Field label="Deadline">
              <input style={inputStyle} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
            </Field>
          </div>

          <Field label="Client Name">
            <input style={inputStyle} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Acme Corp" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
            <button type="submit" disabled={saving} style={btnPrimaryStyle}>
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
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Project Name" required>
          <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </Field>

        <Field label="Description">
          <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select style={inputStyle} value={form.type} onChange={(e) => set('type', e.target.value)}>
              {TYPE_OPTIONS.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget ($)">
            <input style={inputStyle} type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="e.g. 50000" />
          </Field>
          <Field label="Deadline">
            <input style={inputStyle} type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} />
          </Field>
        </div>

        <Field label="Client Name">
          <input style={inputStyle} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Acme Corp" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
            {saving ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main tab ───────────────────────────────────────────────────────────────────

export default function ProjectsTab() {
  const navigate = useNavigate()
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

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading projects…</p>
  if (error)   return <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowNewProject(true)} style={btnActionStyle}>+ New Project</button>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
              <th style={thStyle}>Project</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Budget</th>
              <th style={thStyle}>Deadline</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid hsl(224, 30%, 18%)', backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(224, 30%, 12%)' }}>
                <td style={tdStyle}>
                  <p className="font-medium">{p.name}</p>
                  {p.clientName && <p className="text-xs mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>{p.clientName}</p>}
                </td>
                <td style={tdStyle}>
                  <span className="capitalize" style={{ color: 'hsl(224, 20%, 55%)' }}>{p.type}</span>
                </td>
                <td style={tdStyle}>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={STATUS_STYLES[p.status] ?? { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
                    {p.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={tdStyle}>{formatCurrency(p.budget)}</td>
                <td style={tdStyle}>{formatDate(p.deadline)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => navigate(`/projects/${p.id}`)} className="text-xs font-medium px-3 py-1 rounded-lg transition-colors" style={{ color: 'hsl(224, 20%, 55%)' }}>
                      View
                    </button>
                    <button onClick={() => setEditing(p)} className="text-xs font-medium px-3 py-1 rounded-lg transition-colors" style={{ color: 'hsl(244, 100%, 69%)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} className="text-xs font-medium px-3 py-1 rounded-lg transition-colors" style={{ color: 'hsl(0, 100%, 60%)' }}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10" style={{ color: 'hsl(224, 20%, 55%)' }}>No projects found.</td></tr>
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
const inputStyle = { backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(224, 30%, 20%)', color: 'hsl(224, 40%, 95%)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', width: '100%' }
const btnPrimaryStyle = { flex: 1, padding: '8px 16px', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnSecondaryStyle = { padding: '8px 16px', border: '1px solid hsl(224, 30%, 18%)', color: 'hsl(224, 40%, 95%)', fontSize: '14px', fontWeight: '500', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnActionStyle = { padding: '8px 16px', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }
const thStyle = { textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: '600', color: 'hsl(224, 20%, 55%)', textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle = { padding: '12px 16px', color: 'hsl(224, 40%, 95%)' }

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>
        {label}{required && <span style={{ color: 'hsl(0, 100%, 60%)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
