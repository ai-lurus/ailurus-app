import { useEffect, useRef, useState } from 'react'
import { getUsers } from '../../api/users.js'
import {
  getEnemies, uploadEnemy, deleteEnemy,
  getTopics, createTopic, updateTopic, deleteTopic, uploadTopicBattles,
  getBattlePaths, createBattlePath, updateBattlePath, deleteBattlePath,
  assignBattlePath, unassignBattlePath,
  addTopicToPath, removeTopicFromPath,
} from '../../api/battles.js'

// ── Shared styles ──────────────────────────────────────────────────────────────
const inputCls     = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary   = 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors'
const btnDanger    = 'text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 px-2 py-1 rounded-lg transition-colors'
const btnAction    = 'text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors'

const TABS = [
  { key: 'enemies', label: 'Enemy Pool' },
  { key: 'topics',  label: 'Topics & Battles' },
  { key: 'paths',   label: 'Learning Paths' },
]

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

export default function BattlesAdminPanel() {
  const [tab, setTab] = useState('enemies')

  return (
    <div className="space-y-6">
      {/* Sub-tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.key
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'enemies' && <EnemyPoolTab />}
      {tab === 'topics'  && <TopicsTab />}
      {tab === 'paths'   && <PathsTab />}
    </div>
  )
}

// ── Enemy Pool ─────────────────────────────────────────────────────────────────

function EnemyPoolTab() {
  const [enemies, setEnemies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const apiBase = import.meta.env.VITE_API_URL ?? ''

  useEffect(() => {
    getEnemies()
      .then(setEnemies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const enemy = await uploadEnemy(file)
      setEnemies((prev) => [...prev, enemy])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this enemy image?')) return
    try {
      await deleteEnemy(id)
      setEnemies((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Upload SVG or PNG images for battle enemies.</p>
        <label className={`${btnPrimary} cursor-pointer`}>
          {uploading ? 'Uploading…' : '+ Upload Image'}
          <input
            ref={fileRef}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

      {!loading && enemies.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 text-center">
          <p className="text-sm text-gray-400">No enemies uploaded yet.</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {enemies.map((enemy) => (
          <div key={enemy.id} className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="aspect-square flex items-center justify-center p-3 bg-gray-50">
              <img
                src={`${apiBase}/public/enemies/${enemy.filename}`}
                alt={enemy.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="px-2 py-1.5 flex items-center justify-between gap-1">
              <p className="text-xs text-gray-600 truncate">{enemy.name}</p>
              <button onClick={() => handleDelete(enemy.id)} className={btnDanger}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Topics & Battles ──────────────────────────────────────────────────────────

function TopicsTab() {
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    getTopics()
      .then(setTopics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data) {
    try {
      const topic = await createTopic(data)
      setTopics((prev) => [...prev, topic])
      setShowNewForm(false)
    } catch (err) {
      throw err
    }
  }

  async function handleUpdate(id, data) {
    try {
      const updated = await updateTopic(id, data)
      setTopics((prev) => prev.map((t) => t.id === id ? updated : t))
      setEditingId(null)
    } catch (err) {
      throw err
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this topic and all its battles?')) return
    try {
      await deleteTopic(id)
      setTopics((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleBattlesUploaded(topicId, battles) {
    const updated = await getTopics()
    setTopics(updated)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Create topics and upload battle question sets (JSON).</p>
        {!showNewForm && (
          <button onClick={() => setShowNewForm(true)} className={btnPrimary}>
            + New Topic
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {showNewForm && (
        <TopicForm
          onSave={handleCreate}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

      {!loading && topics.length === 0 && !showNewForm && (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 text-center">
          <p className="text-sm text-gray-400">No topics yet. Create one to get started.</p>
        </div>
      )}

      <div className="space-y-2">
        {topics.map((topic) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            isEditing={editingId === topic.id}
            isExpanded={expandedId === topic.id}
            onEdit={() => setEditingId(topic.id)}
            onCancelEdit={() => setEditingId(null)}
            onSaveEdit={(data) => handleUpdate(topic.id, data)}
            onDelete={() => handleDelete(topic.id)}
            onToggle={() => setExpandedId((prev) => prev === topic.id ? null : topic.id)}
            onBattlesUploaded={(battles) => handleBattlesUploaded(topic.id, battles)}
          />
        ))}
      </div>
    </div>
  )
}

function TopicForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    icon: initial?.icon ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({ title: form.title.trim(), description: form.description.trim() || undefined, icon: form.icon.trim() || undefined })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-3">
          <Field label="Topic Title" required>
            <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. JavaScript Fundamentals" />
          </Field>
        </div>
        <Field label="Icon (emoji)">
          <input className={inputCls} value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="📚" maxLength={4} />
        </Field>
      </div>
      <Field label="Description">
        <input className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional description" />
      </Field>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save Topic'}</button>
      </div>
    </form>
  )
}

function TopicRow({ topic, isEditing, isExpanded, onEdit, onCancelEdit, onSaveEdit, onDelete, onToggle, onBattlesUploaded }) {
  const battleCount = topic._count?.battles ?? topic.battles?.length ?? 0

  if (isEditing) {
    return (
      <div className="border border-indigo-200 rounded-xl overflow-hidden">
        <TopicForm initial={topic} onSave={onSaveEdit} onCancel={onCancelEdit} />
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <span className="text-xl shrink-0">{topic.icon || '📚'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{topic.title}</p>
          {topic.description && <p className="text-xs text-gray-400 truncate">{topic.description}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">{battleCount}/5 battles</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onToggle} className={btnAction}>
            {isExpanded ? 'Hide' : 'Battles'}
          </button>
          <button onClick={onEdit} className={btnAction}>Edit</button>
          <button onClick={onDelete} className={btnDanger}>Delete</button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          <BattlesUploadSection topic={topic} onUploaded={onBattlesUploaded} />
        </div>
      )}
    </div>
  )
}

function BattlesUploadSection({ topic, onUploaded }) {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setSuccess(null)
    setUploading(true)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const battles = Array.isArray(parsed) ? parsed : parsed.battles
      if (!Array.isArray(battles)) throw new Error('JSON must be an array of battles or { battles: [...] }')
      const result = await uploadTopicBattles(topic.id, battles)
      onUploaded(result)
      setSuccess(`${result.length} battle(s) uploaded successfully.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">Battle Questions (JSON)</p>
        <label className={`${btnAction} cursor-pointer`}>
          {uploading ? 'Uploading…' : 'Upload JSON'}
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      </div>
      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">{success}</p>}
      <p className="text-xs text-gray-400">
        Format: array of up to 5 battles, each with <code className="bg-gray-100 px-1 rounded">title</code> and <code className="bg-gray-100 px-1 rounded">questions</code> (12 items with <code className="bg-gray-100 px-1 rounded">text, options, correctIndex, explanation</code>).
      </p>
    </div>
  )
}

// ── Learning Paths ─────────────────────────────────────────────────────────────

function PathsTab() {
  const [paths, setPaths] = useState([])
  const [users, setUsers] = useState([])
  const [allTopics, setAllTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    Promise.all([getBattlePaths(), getUsers(), getTopics()])
      .then(([pathsData, usersData, topicsData]) => {
        setPaths(pathsData)
        setUsers(usersData)
        setAllTopics(topicsData)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(data) {
    const path = await createBattlePath(data)
    setPaths((prev) => [...prev, path])
    setShowNewForm(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this learning path?')) return
    try {
      await deleteBattlePath(id)
      setPaths((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAssign(pathId, userId) {
    try {
      await assignBattlePath(pathId, userId)
      const updated = await getBattlePaths()
      setPaths(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUnassign(pathId, userId) {
    try {
      await unassignBattlePath(pathId, userId)
      const updated = await getBattlePaths()
      setPaths(updated)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddTopic(pathId, topicId) {
    try {
      const updatedPath = await addTopicToPath(pathId, topicId)
      setPaths((prev) => prev.map((p) => p.id === pathId ? updatedPath : p))
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleRemoveTopic(pathId, topicId) {
    try {
      const updatedPath = await removeTopicFromPath(pathId, topicId)
      setPaths((prev) => prev.map((p) => p.id === pathId ? updatedPath : p))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Create battle learning paths and assign them to team members.</p>
        {!showNewForm && (
          <button onClick={() => setShowNewForm(true)} className={btnPrimary}>+ New Path</button>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {showNewForm && (
        <PathForm allTopics={allTopics} onSave={handleCreate} onCancel={() => setShowNewForm(false)} />
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}

      {!loading && paths.length === 0 && !showNewForm && (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 text-center">
          <p className="text-sm text-gray-400">No battle paths yet.</p>
        </div>
      )}

      <div className="space-y-2">
        {paths.map((path) => (
          <PathRow
            key={path.id}
            path={path}
            users={users}
            allTopics={allTopics}
            isExpanded={expandedId === path.id}
            onToggle={() => setExpandedId((prev) => prev === path.id ? null : path.id)}
            onDelete={() => handleDelete(path.id)}
            onAssign={(userId) => handleAssign(path.id, userId)}
            onUnassign={(userId) => handleUnassign(path.id, userId)}
            onAddTopic={(topicId) => handleAddTopic(path.id, topicId)}
            onRemoveTopic={(topicId) => handleRemoveTopic(path.id, topicId)}
          />
        ))}
      </div>
    </div>
  )
}

function PathForm({ allTopics = [], onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', description: '' })
  const [selectedTopicIds, setSelectedTopicIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleTopic(id) {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSave({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        topicIds: selectedTopicIds,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <Field label="Path Title" required>
        <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Frontend Fundamentals" />
      </Field>
      <Field label="Description">
        <input className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional" />
      </Field>
      {allTopics.length > 0 && (
        <Field label="Topics">
          <div className="flex flex-wrap gap-2 mt-1">
            {allTopics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleTopic(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  selectedTopicIds.includes(t.id)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {t.icon || '📚'} {t.title}
              </button>
            ))}
          </div>
        </Field>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className={btnSecondary}>Cancel</button>
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Create Path'}</button>
      </div>
    </form>
  )
}

function PathRow({ path, users, allTopics = [], isExpanded, onToggle, onDelete, onAssign, onUnassign, onAddTopic, onRemoveTopic }) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [addingTopic, setAddingTopic] = useState(false)
  const assignedIds = new Set((path.userPaths ?? []).map((u) => u.userId))
  const unassignedUsers = users.filter((u) => !assignedIds.has(u.id))
  const currentTopicIds = new Set((path.topics ?? []).map((pt) => pt.topicId ?? pt.topic?.id))
  const availableTopics = allTopics.filter((t) => !currentTopicIds.has(t.id))

  async function handleAssign() {
    if (!selectedUserId) return
    setAssigning(true)
    try {
      await onAssign(selectedUserId)
      setSelectedUserId('')
    } finally {
      setAssigning(false)
    }
  }

  async function handleAddTopic() {
    if (!selectedTopicId) return
    setAddingTopic(true)
    try {
      await onAddTopic(selectedTopicId)
      setSelectedTopicId('')
    } finally {
      setAddingTopic(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800">{path.title}</p>
          {path.description && <p className="text-xs text-gray-400 truncate">{path.description}</p>}
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {path._count?.topics ?? path.topics?.length ?? 0} topics · {assignedIds.size} assigned
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={onToggle} className={btnAction}>
            {isExpanded ? 'Hide' : 'Manage'}
          </button>
          <button onClick={onDelete} className={btnDanger}>Delete</button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-4">
          {/* Topics */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Topics</p>
            {(path.topics ?? []).length === 0 && (
              <p className="text-xs text-gray-400 mb-2">No topics in this path yet.</p>
            )}
            <div className="flex flex-wrap gap-2 mb-2">
              {(path.topics ?? []).map((pt) => {
                const t = pt.topic ?? allTopics.find((x) => x.id === pt.topicId)
                if (!t) return null
                return (
                  <span key={t.id} className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700">
                    {t.icon || '📚'} {t.title}
                    <button onClick={() => onRemoveTopic(t.id)} className="text-red-400 hover:text-red-600 ml-1">✕</button>
                  </span>
                )
              })}
            </div>
            {availableTopics.length > 0 && (
              <div className="flex gap-2">
                <select
                  className={`${inputCls} flex-1`}
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                >
                  <option value="">Add a topic…</option>
                  {availableTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.icon || '📚'} {t.title}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddTopic}
                  disabled={!selectedTopicId || addingTopic}
                  className={btnPrimary}
                >
                  {addingTopic ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}
          </div>

          {/* Assigned users */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Assigned Users</p>
            {assignedIds.size === 0 && (
              <p className="text-xs text-gray-400">No users assigned yet.</p>
            )}
            <div className="space-y-1">
              {(path.userPaths ?? []).map((assignment) => {
                const user = users.find((u) => u.id === assignment.userId)
                return (
                  <div key={assignment.userId} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-gray-700">{user?.name ?? assignment.userId}</span>
                    <button onClick={() => onUnassign(assignment.userId)} className={btnDanger}>Remove</button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Assign user */}
          {unassignedUsers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Assign User</p>
              <div className="flex gap-2">
                <select
                  className={`${inputCls} flex-1`}
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select a user…</option>
                  {unassignedUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedUserId || assigning}
                  className={btnPrimary}
                >
                  {assigning ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
