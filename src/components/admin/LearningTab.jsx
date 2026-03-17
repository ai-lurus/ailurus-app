import { useEffect, useState } from 'react'
import { getUsers } from '../../api/users.js'
import {
  getLearningPaths,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
  addLearningTopic,
  deleteLearningTopic,
} from '../../api/learning.js'
import Modal from '../Modal.jsx'

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls     = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary   = 'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors'
const btnAction    = 'text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors'
const btnDanger    = 'text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-100 px-2 py-1 rounded-lg transition-colors'

const RESOURCE_TYPES = ['article', 'video', 'course', 'practice']

const STATUS_STYLES = {
  pending:     'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
}

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

// ── New Path Modal ─────────────────────────────────────────────────────────────
function NewPathModal({ developers, onClose, onCreated }) {
  const [form, setForm] = useState({
    userId: developers[0]?.id ?? '',
    title: '',
    careerPath: '',
    description: '',
    dueDate: '',
  })
  const [topics, setTopics] = useState([{ title: '', resourceType: 'article' }])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setTopic(idx, field, value) {
    setTopics((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t))
  }

  function addTopic() {
    setTopics((prev) => [...prev, { title: '', resourceType: 'article' }])
  }

  function removeTopic(idx) {
    setTopics((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const filteredTopics = topics
        .filter((t) => t.title.trim())
        .map((t, idx) => ({ ...t, orderIndex: idx }))

      const path = await createLearningPath({
        userId:      form.userId,
        title:       form.title.trim(),
        careerPath:  form.careerPath.trim() || undefined,
        description: form.description.trim() || undefined,
        dueDate:     form.dueDate || undefined,
        topics:      filteredTopics,
      })
      onCreated(path)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="New Learning Path" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Developer" required>
          <select className={inputCls} value={form.userId} onChange={(e) => set('userId', e.target.value)}>
            {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field label="Path Title" required>
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Become a Senior React Developer" />
        </Field>

        <Field label="Career Path">
          <input className={inputCls} value={form.careerPath} onChange={(e) => set('careerPath', e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
        </Field>

        <Field label="Description">
          <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief overview of this path…" />
        </Field>

        <Field label="Due Date">
          <input className={inputCls} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>

        {/* Topics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-600">Topics</label>
            <button type="button" onClick={addTopic} className={btnAction}>+ Add Topic</button>
          </div>
          <div className="space-y-2">
            {topics.map((t, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  className={`${inputCls} flex-1`}
                  value={t.title}
                  onChange={(e) => setTopic(idx, 'title', e.target.value)}
                  placeholder={`Topic ${idx + 1} title`}
                />
                <select
                  className="px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none"
                  value={t.resourceType}
                  onChange={(e) => setTopic(idx, 'resourceType', e.target.value)}
                >
                  {RESOURCE_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
                {topics.length > 1 && (
                  <button type="button" onClick={() => removeTopic(idx)} className="text-gray-400 hover:text-red-500 px-1 text-lg leading-none">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Creating…' : 'Create Path'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Add Topic Modal ────────────────────────────────────────────────────────────
function AddTopicModal({ path, onClose, onAdded }) {
  const [form, setForm] = useState({ title: '', description: '', resourceUrl: '', resourceType: 'article', dueDate: '' })
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
      const topic = await addLearningTopic(path.id, {
        title:        form.title.trim(),
        description:  form.description.trim() || undefined,
        resourceUrl:  form.resourceUrl.trim() || undefined,
        resourceType: form.resourceType,
        dueDate:      form.dueDate || undefined,
      })
      onAdded(topic)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Add Topic — ${path.title}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Title" required>
          <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. React hooks deep dive" />
        </Field>

        <Field label="Description">
          <textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What will the developer learn?" />
        </Field>

        <Field label="Resource URL">
          <input className={inputCls} type="url" value={form.resourceUrl} onChange={(e) => set('resourceUrl', e.target.value)} placeholder="https://…" />
        </Field>

        <Field label="Resource Type">
          <select className={inputCls} value={form.resourceType} onChange={(e) => set('resourceType', e.target.value)}>
            {RESOURCE_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </Field>

        <Field label="Due Date">
          <input className={inputCls} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? 'Adding…' : 'Add Topic'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Path Card ──────────────────────────────────────────────────────────────────
function PathCard({ path, onDelete, onAddTopic, onTopicDelete }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-800">{path.title}</p>
            {path.generatedByAI && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI</span>
            )}
            {path.careerPath && (
              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{path.careerPath}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs">
              <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${path.progressPct}%` }} />
            </div>
            <span className="text-xs text-gray-400">{path.progressPct}% · {path.topics?.length ?? 0} topics</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded((v) => !v)} className={btnAction}>
            {expanded ? 'Collapse' : 'View Topics'}
          </button>
          <button onClick={() => onAddTopic(path)} className={btnAction}>+ Topic</button>
          <button onClick={() => onDelete(path.id)} className={btnDanger}>Delete</button>
        </div>
      </div>

      {/* Topics */}
      {expanded && (
        <div className="divide-y divide-gray-50">
          {(path.topics ?? []).length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No topics yet.</p>
          ) : (
            path.topics.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{t.title}</p>
                  {t.description && <p className="text-xs text-gray-400 truncate">{t.description}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${STATUS_STYLES[t.status]}`}>
                  {t.status.replace('_', ' ')}
                </span>
                <button onClick={() => onTopicDelete(path.id, t.id)} className={btnDanger}>×</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Tab ───────────────────────────────────────────────────────────────────
export default function LearningTab() {
  const [developers, setDevelopers]   = useState([])
  const [selectedDev, setSelectedDev] = useState(null)
  const [paths, setPaths]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [pathsLoading, setPathsLoading] = useState(false)
  const [error, setError]             = useState(null)
  const [showNewPath, setShowNewPath]     = useState(false)
  const [addingTopicTo, setAddingTopicTo] = useState(null)

  // Load developer list
  useEffect(() => {
    getUsers()
      .then((users) => {
        const devs = users.filter((u) => u.role === 'developer')
        setDevelopers(devs)
        if (devs.length > 0) setSelectedDev(devs[0])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  // Load paths for selected developer
  useEffect(() => {
    if (!selectedDev) return
    setPathsLoading(true)
    getLearningPaths(selectedDev.id)
      .then(setPaths)
      .catch((e) => setError(e.message))
      .finally(() => setPathsLoading(false))
  }, [selectedDev])

  function handlePathCreated(path) {
    if (path.userId === selectedDev?.id) {
      setPaths((prev) => [path, ...prev])
    }
    setShowNewPath(false)
  }

  async function handlePathDelete(pathId) {
    if (!confirm('Delete this learning path and all its topics?')) return
    try {
      await deleteLearningPath(pathId)
      setPaths((prev) => prev.filter((p) => p.id !== pathId))
    } catch (err) {
      alert(err.message)
    }
  }

  function handleTopicAdded(topic) {
    setPaths((prev) =>
      prev.map((p) =>
        p.id === addingTopicTo.id
          ? { ...p, topics: [...(p.topics ?? []), topic] }
          : p
      )
    )
    setAddingTopicTo(null)
  }

  async function handleTopicDelete(pathId, topicId) {
    if (!confirm('Delete this topic?')) return
    try {
      await deleteLearningTopic(topicId)
      setPaths((prev) =>
        prev.map((p) => {
          if (p.id !== pathId) return p
          const newTopics = p.topics.filter((t) => t.id !== topicId)
          const completed = newTopics.filter((t) => t.status === 'completed').length
          const progressPct = newTopics.length === 0 ? 0 : Math.round((completed / newTopics.length) * 100)
          return { ...p, topics: newTopics, progressPct }
        })
      )
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
  if (error)   return <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600">Developer</label>
          <select
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            value={selectedDev?.id ?? ''}
            onChange={(e) => {
              const dev = developers.find((d) => d.id === e.target.value)
              setSelectedDev(dev ?? null)
            }}
          >
            {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNewPath(true)} className={btnAction} disabled={developers.length === 0}>
          + New Path
        </button>
      </div>

      {/* Path list */}
      {pathsLoading ? (
        <p className="text-sm text-gray-400 py-4 text-center">Loading paths…</p>
      ) : paths.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-10 text-center">
          <p className="text-sm text-gray-400">No learning paths for this developer yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map((path) => (
            <PathCard
              key={path.id}
              path={path}
              onDelete={handlePathDelete}
              onAddTopic={setAddingTopicTo}
              onTopicDelete={handleTopicDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showNewPath && (
        <NewPathModal
          developers={developers}
          onClose={() => setShowNewPath(false)}
          onCreated={handlePathCreated}
        />
      )}

      {addingTopicTo && (
        <AddTopicModal
          path={addingTopicTo}
          onClose={() => setAddingTopicTo(null)}
          onAdded={handleTopicAdded}
        />
      )}
    </div>
  )
}
