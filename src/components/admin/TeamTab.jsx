import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUserRole, toggleUserActive } from '../../api/users.js'
import { getTeams, createTeam, addTeamMember, removeTeamMember } from '../../api/teams.js'
import { getProjects } from '../../api/projects.js'
import Modal from '../Modal.jsx'
import DeveloperProfilePanel from './DeveloperProfilePanel.jsx'

const PROFILE_ROLES = ['developer', 'designer']

const ROLE_OPTIONS = ['developer', 'designer', 'pm', 'ceo', 'admin']

const ROLE_STYLES = {
  developer: { backgroundColor: 'hsl(210, 100%, 20%)', color: 'hsl(210, 100%, 60%)' },
  designer:  { backgroundColor: 'hsl(270, 100%, 20%)', color: 'hsl(270, 100%, 60%)' },
  pm:        { backgroundColor: 'hsl(25, 100%, 20%)', color: 'hsl(25, 100%, 60%)' },
  ceo:       { backgroundColor: 'hsl(244, 100%, 20%)', color: 'hsl(244, 100%, 69%)' },
  admin:     { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' },
}

// ── New User Modal ────────────────────────────────────────────────────────────

function NewUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'developer', password: '' })
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
      const user = await createUser(form)
      onCreated(user)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Create New User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Full Name" required>
          <input style={inputStyle} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Jane Smith" />
        </Field>

        <Field label="Email" required>
          <input style={inputStyle} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="e.g. jane@company.com" />
        </Field>

        <Field label="Role" required>
          <select style={inputStyle} value={form.role} onChange={(e) => set('role', e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </Field>

        <Field label="Temporary Password" required>
          <input style={inputStyle} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Edit Role Modal ───────────────────────────────────────────────────────────

function EditRoleModal({ user, onClose, onUpdated }) {
  const [role, setRole]     = useState(user.role)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (role === user.role) { onClose(); return }
    setSaving(true)
    setError(null)
    try {
      const updated = await updateUserRole(user.id, role)
      onUpdated(updated)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Edit Role — ${user.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}
        <Field label="Role" required>
          <select style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

function AddMemberModal({ team, allUsers, currentMemberIds, onClose, onAdded }) {
  const available = allUsers.filter((u) => !currentMemberIds.has(u.id))
  const [userId, setUserId]   = useState(available[0]?.id ?? '')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError(null)
    try {
      const member = await addTeamMember(team.id, userId)
      onAdded(member)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  if (available.length === 0) {
    return (
      <Modal title={`Add Member — ${team.name}`} onClose={onClose}>
        <p className="text-sm py-4" style={{ color: 'hsl(224, 20%, 55%)' }}>All users are already in this team.</p>
        <button onClick={onClose} style={btnSecondaryStyle}>Close</button>
      </Modal>
    )
  }

  return (
    <Modal title={`Add Member — ${team.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}
        <Field label="Select User" required>
          <select style={inputStyle} value={userId} onChange={(e) => setUserId(e.target.value)}>
            {available.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
            {saving ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── New Team Modal ────────────────────────────────────────────────────────────

function NewTeamModal({ projects, onClose, onCreated }) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [name, setName]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!projectId || !name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const team = await createTeam(projectId, name.trim())
      onCreated(team, projectId)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Create New Team" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}
        <Field label="Project" required>
          <select style={inputStyle} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Team Name" required>
          <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Frontend Team" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
            {saving ? 'Creating…' : 'Create Team'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────

export default function TeamTab() {
  const [users, setUsers]       = useState([])
  const [projects, setProjects] = useState([])
  const [teamsByProject, setTeamsByProject] = useState({})
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [showNewUser, setShowNewUser]       = useState(false)
  const [showNewTeam, setShowNewTeam]       = useState(false)
  const [addingMemberTo, setAddingMemberTo] = useState(null) // { team, projectId }
  const [selectedUser, setSelectedUser]     = useState(null)
  const [editingRole, setEditingRole]       = useState(null) // user object

  useEffect(() => {
    Promise.all([getUsers(), getProjects()])
      .then(([fetchedUsers, fetchedProjects]) => {
        setUsers(fetchedUsers)
        setProjects(fetchedProjects)
        return Promise.all(
          fetchedProjects.map((p) => getTeams(p.id).then((teams) => ({ projectId: p.id, teams })))
        )
      })
      .then((results) => {
        const map = {}
        results.forEach(({ projectId, teams }) => { map[projectId] = teams })
        setTeamsByProject(map)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleUserCreated(user) {
    setUsers((prev) => [...prev, user])
    setShowNewUser(false)
  }

  function handleRoleUpdated(updated) {
    setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, role: updated.role } : u))
    setEditingRole(null)
  }

  async function handleToggleActive(user) {
    try {
      const updated = await toggleUserActive(user.id, !user.active)
      setUsers((prev) => prev.map((u) => u.id === updated.id ? { ...u, active: updated.active } : u))
    } catch (err) {
      alert(err.response?.data?.error ?? err.message)
    }
  }

  function handleTeamCreated(team, projectId) {
    setTeamsByProject((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] ?? []), { ...team, teamMembers: [] }],
    }))
    setShowNewTeam(false)
  }

  function handleMemberAdded(member, team, projectId) {
    const addedUser = users.find((u) => u.id === member.userId)
    setTeamsByProject((prev) => ({
      ...prev,
      [projectId]: prev[projectId].map((t) =>
        t.id === team.id
          ? { ...t, teamMembers: [...t.teamMembers, { userId: member.userId, user: addedUser }] }
          : t
      ),
    }))
    setAddingMemberTo(null)
  }

  async function handleRemoveMember(team, userId, projectId) {
    try {
      await removeTeamMember(team.id, userId)
      setTeamsByProject((prev) => ({
        ...prev,
        [projectId]: prev[projectId].map((t) =>
          t.id === team.id
            ? { ...t, teamMembers: t.teamMembers.filter((m) => m.userId !== userId) }
            : t
        ),
      }))
    } catch (err) {
      alert(err.response?.data?.error ?? err.message)
    }
  }

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading team data…</p>
  if (error)   return <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>

  return (
    <div className="space-y-8">

      {/* ── User Directory ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'hsl(224, 40%, 95%)' }}>User Directory</h2>
          <button onClick={() => setShowNewUser(true)} style={btnActionStyle}>+ New User</button>
        </div>
        <div className="overflow-hidden rounded-xl" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Teams</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isClickable = PROFILE_ROLES.includes(u.role)
                return (
                  <tr
                    key={u.id}
                    onClick={() => isClickable && setSelectedUser(u)}
                    style={{ borderBottom: '1px solid hsl(224, 30%, 18%)', backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(224, 30%, 12%)', opacity: !u.active ? 0.5 : 1, cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    <td style={tdStyle}>
                      <p className="font-medium">
                        {u.name}
                        {isClickable && <span className="ml-1.5 text-xs" style={{ color: 'hsl(244, 100%, 69%)' }}>↗</span>}
                      </p>
                    </td>
                    <td style={tdStyle}><p style={{ color: 'hsl(224, 20%, 55%)' }}>{u.email}</p></td>
                    <td style={tdStyle}>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full capitalize" style={ROLE_STYLES[u.role] ?? { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>
                        {u.teamMembers?.map((m) => m.team?.name).filter(Boolean).join(', ') || '—'}
                      </p>
                    </td>
                    <td style={tdStyle}>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={u.active ? { backgroundColor: 'hsl(120, 100%, 20%)', color: 'hsl(120, 100%, 50%)' } : { backgroundColor: 'hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingRole(u) }}
                          className="text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{ color: 'hsl(244, 100%, 69%)' }}
                        >
                          Edit role
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(u) }}
                          className="text-xs px-2 py-1 rounded-lg transition-colors"
                          style={{ color: u.active ? 'hsl(0, 100%, 60%)' : 'hsl(120, 100%, 50%)' }}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10" style={{ color: 'hsl(224, 20%, 55%)' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Project Teams ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: 'hsl(224, 40%, 95%)' }}>Project Teams</h2>
          <button onClick={() => setShowNewTeam(true)} style={btnActionStyle}>+ New Team</button>
        </div>
        <div className="space-y-4">
          {projects.map((p) => {
            const teams = teamsByProject[p.id] ?? []
            return (
              <div key={p.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
                <div className="px-4 py-2.5" style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>{p.name}</p>
                </div>
                {teams.length === 0 ? (
                  <p className="text-sm px-4 py-4" style={{ color: 'hsl(224, 20%, 55%)' }}>No teams for this project.</p>
                ) : (
                  <div style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
                    {teams.map((team, idx) => {
                      const memberIds = new Set(team.teamMembers.map((m) => m.userId))
                      return (
                        <div key={team.id} className="px-4 py-3" style={{ borderBottom: idx < teams.length - 1 ? '1px solid hsl(224, 30%, 18%)' : 'none' }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium" style={{ color: 'hsl(224, 40%, 95%)' }}>{team.name}</p>
                            <button
                              onClick={() => setAddingMemberTo({ team, projectId: p.id })}
                              className="text-xs px-2 py-1 rounded-lg transition-colors"
                              style={{ color: 'hsl(244, 100%, 69%)' }}
                            >
                              + Add Member
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {team.teamMembers.length === 0 && (
                              <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>No members yet.</span>
                            )}
                            {team.teamMembers.map((m) => {
                              const memberUser = users.find((u) => u.id === m.userId) ?? m.user
                              return (
                                <span
                                  key={m.userId}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                                  style={{ backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 40%, 95%)' }}
                                >
                                  {memberUser?.name ?? 'Unknown'}
                                  <button
                                    onClick={() => handleRemoveMember(team, m.userId, p.id)}
                                    className="leading-none ml-0.5"
                                    title="Remove"
                                    style={{ color: 'hsl(224, 20%, 55%)', cursor: 'pointer' }}
                                  >
                                    ×
                                  </button>
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {projects.length === 0 && (
            <p className="text-sm py-4" style={{ color: 'hsl(224, 20%, 55%)' }}>No projects found.</p>
          )}
        </div>
      </section>

      {showNewUser && (
        <NewUserModal onClose={() => setShowNewUser(false)} onCreated={handleUserCreated} />
      )}

      {showNewTeam && (
        <NewTeamModal
          projects={projects}
          onClose={() => setShowNewTeam(false)}
          onCreated={handleTeamCreated}
        />
      )}

      {addingMemberTo && (
        <AddMemberModal
          team={addingMemberTo.team}
          allUsers={users}
          currentMemberIds={new Set(addingMemberTo.team.teamMembers.map((m) => m.userId))}
          onClose={() => setAddingMemberTo(null)}
          onAdded={(member) => handleMemberAdded(member, addingMemberTo.team, addingMemberTo.projectId)}
        />
      )}

      {selectedUser && (
        <DeveloperProfilePanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {editingRole && (
        <EditRoleModal
          user={editingRole}
          onClose={() => setEditingRole(null)}
          onUpdated={handleRoleUpdated}
        />
      )}
    </div>
  )
}

// ── Shared style tokens ────────────────────────────────────────────────────────
const inputStyle = { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid hsl(224, 30%, 20%)', borderRadius: '8px', backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 40%, 95%)', outline: 'none' }
const btnPrimaryStyle = { flex: 1, padding: '8px 16px', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s', opacity: 1 }
const btnSecondaryStyle = { padding: '8px 16px', border: '1px solid hsl(224, 30%, 18%)', color: 'hsl(224, 40%, 95%)', fontSize: '14px', fontWeight: '500', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnActionStyle = { fontSize: '12px', fontWeight: '500', color: 'hsl(244, 100%, 69%)', border: '1px solid hsl(244, 100%, 30%)', backgroundColor: 'transparent', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s' }
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
