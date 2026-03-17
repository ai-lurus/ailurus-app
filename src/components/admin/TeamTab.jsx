import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUserRole, toggleUserActive } from '../../api/users.js'
import { getTeams, createTeam, addTeamMember, removeTeamMember } from '../../api/teams.js'
import { getProjects } from '../../api/projects.js'
import Modal from '../Modal.jsx'
import DeveloperProfilePanel from './DeveloperProfilePanel.jsx'

const PROFILE_ROLES = ['developer', 'designer']

const ROLE_OPTIONS = ['developer', 'designer', 'pm', 'ceo', 'admin']

const ROLE_STYLES = {
  developer: 'bg-blue-100 text-blue-800',
  designer:  'bg-purple-100 text-purple-800',
  pm:        'bg-orange-100 text-orange-800',
  ceo:       'bg-indigo-100 text-indigo-800',
  admin:     'bg-gray-100 text-gray-700',
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
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Full Name" required>
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Jane Smith" />
        </Field>

        <Field label="Email" required>
          <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="e.g. jane@company.com" />
        </Field>

        <Field label="Role" required>
          <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </Field>

        <Field label="Temporary Password" required>
          <input className={inputCls} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required placeholder="Min. 8 characters" minLength={8} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
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
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Field label="Role" required>
          <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
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
        <p className="text-sm text-gray-500 py-4">All users are already in this team.</p>
        <button onClick={onClose} className={btnSecondary}>Close</button>
      </Modal>
    )
  }

  return (
    <Modal title={`Add Member — ${team.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Field label="Select User" required>
          <select className={inputCls} value={userId} onChange={(e) => setUserId(e.target.value)}>
            {available.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
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
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <Field label="Project" required>
          <select className={inputCls} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Team Name" required>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Frontend Team" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
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

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading team data…</p>
  if (error)   return <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>

  return (
    <div className="space-y-8">

      {/* ── User Directory ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">User Directory</h2>
          <button onClick={() => setShowNewUser(true)} className={btnAction}>+ New User</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className={th}>Name</th>
                <th className={th}>Email</th>
                <th className={th}>Role</th>
                <th className={th}>Teams</th>
                <th className={th}>Status</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isClickable = PROFILE_ROLES.includes(u.role)
                return (
                  <tr
                    key={u.id}
                    onClick={() => isClickable && setSelectedUser(u)}
                    className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'} ${isClickable ? 'cursor-pointer hover:bg-indigo-50/40 transition-colors' : ''} ${!u.active ? 'opacity-50' : ''}`}
                  >
                    <td className={td}>
                      <p className="font-medium text-gray-900">
                        {u.name}
                        {isClickable && <span className="ml-1.5 text-xs text-indigo-400">↗</span>}
                      </p>
                    </td>
                    <td className={td}><p className="text-gray-500">{u.email}</p></td>
                    <td className={td}>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${ROLE_STYLES[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className={td}>
                      <p className="text-gray-500 text-xs">
                        {u.teamMembers?.map((m) => m.team?.name).filter(Boolean).join(', ') || '—'}
                      </p>
                    </td>
                    <td className={td}>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingRole(u) }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          Edit role
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(u) }}
                          className={`text-xs px-2 py-1 rounded-lg transition-colors ${u.active ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-800 hover:bg-green-50'}`}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} className="text-center text-gray-400 py-10">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Project Teams ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Project Teams</h2>
          <button onClick={() => setShowNewTeam(true)} className={btnAction}>+ New Team</button>
        </div>
        <div className="space-y-4">
          {projects.map((p) => {
            const teams = teamsByProject[p.id] ?? []
            return (
              <div key={p.id} className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5">
                  <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                </div>
                {teams.length === 0 ? (
                  <p className="text-sm text-gray-400 px-4 py-4">No teams for this project.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {teams.map((team) => {
                      const memberIds = new Set(team.teamMembers.map((m) => m.userId))
                      return (
                        <div key={team.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-gray-700">{team.name}</p>
                            <button
                              onClick={() => setAddingMemberTo({ team, projectId: p.id })}
                              className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                            >
                              + Add Member
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {team.teamMembers.length === 0 && (
                              <span className="text-xs text-gray-400">No members yet.</span>
                            )}
                            {team.teamMembers.map((m) => {
                              const memberUser = users.find((u) => u.id === m.userId) ?? m.user
                              return (
                                <span
                                  key={m.userId}
                                  className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full"
                                >
                                  {memberUser?.name ?? 'Unknown'}
                                  <button
                                    onClick={() => handleRemoveMember(team, m.userId, p.id)}
                                    className="text-gray-400 hover:text-red-500 leading-none ml-0.5"
                                    title="Remove"
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
            <p className="text-sm text-gray-400 py-4">No projects found.</p>
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
