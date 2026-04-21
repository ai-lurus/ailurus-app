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
const inputStyle = { backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(224, 30%, 20%)', color: 'hsl(224, 40%, 95%)', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', width: '100%' }
const btnPrimaryStyle = { flex: 1, padding: '8px 16px', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', fontSize: '14px', fontWeight: '600', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnSecondaryStyle = { padding: '8px 16px', border: '1px solid hsl(224, 30%, 18%)', color: 'hsl(224, 40%, 95%)', fontSize: '14px', fontWeight: '500', borderRadius: '8px', backgroundColor: 'transparent', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnActionStyle = { padding: '6px 12px', fontSize: '12px', fontWeight: '600', backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)', borderRadius: '6px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }
const btnDangerStyle = { padding: '4px 8px', fontSize: '12px', fontWeight: '600', backgroundColor: 'transparent', color: 'hsl(0, 100%, 60%)', border: '1px solid hsl(0, 100%, 30%)', borderRadius: '6px', cursor: 'pointer', transition: 'background-color 0.2s' }

const RESOURCE_TYPES = ['article', 'video', 'course', 'practice']

const STATUS_STYLES = {
  pending:     { backgroundColor: 'hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)' },
  in_progress: { backgroundColor: 'hsl(217, 100%, 20%)', color: 'hsl(217, 100%, 50%)' },
  completed:   { backgroundColor: 'hsl(120, 100%, 20%)', color: 'hsl(120, 100%, 50%)' },
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
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Developer" required>
          <select style={inputStyle} value={form.userId} onChange={(e) => set('userId', e.target.value)}>
            {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field label="Path Title" required>
          <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. Become a Senior React Developer" />
        </Field>

        <Field label="Career Path">
          <input style={inputStyle} value={form.careerPath} onChange={(e) => set('careerPath', e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
        </Field>

        <Field label="Description">
          <textarea style={inputStyle} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Brief overview of this path…" />
        </Field>

        <Field label="Due Date">
          <input style={inputStyle} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>

        {/* Topics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium" style={{ color: 'hsl(224, 20%, 55%)' }}>Topics</label>
            <button type="button" onClick={addTopic} style={btnActionStyle}>+ Add Topic</button>
          </div>
          <div className="space-y-2">
            {topics.map((t, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={t.title}
                  onChange={(e) => setTopic(idx, 'title', e.target.value)}
                  placeholder={`Topic ${idx + 1} title`}
                />
                <select
                  style={{ ...inputStyle, flex: 0, width: 'auto', padding: '6px 8px', fontSize: '12px' }}
                  value={t.resourceType}
                  onChange={(e) => setTopic(idx, 'resourceType', e.target.value)}
                >
                  {RESOURCE_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
                {topics.length > 1 && (
                  <button type="button" onClick={() => removeTopic(idx)} className="px-1 text-lg leading-none" style={{ color: 'hsl(224, 20%, 55%)', cursor: 'pointer' }}>×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
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
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Title" required>
          <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} required placeholder="e.g. React hooks deep dive" />
        </Field>

        <Field label="Description">
          <textarea style={inputStyle} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What will the developer learn?" />
        </Field>

        <Field label="Resource URL">
          <input style={inputStyle} type="url" value={form.resourceUrl} onChange={(e) => set('resourceUrl', e.target.value)} placeholder="https://…" />
        </Field>

        <Field label="Resource Type">
          <select style={inputStyle} value={form.resourceType} onChange={(e) => set('resourceType', e.target.value)}>
            {RESOURCE_TYPES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </Field>

        <Field label="Due Date">
          <input style={inputStyle} type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} style={btnSecondaryStyle}>Cancel</button>
          <button type="submit" disabled={saving} style={btnPrimaryStyle}>
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
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(224, 30%, 18%)' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ backgroundColor: 'hsl(224, 25%, 16%)', borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold" style={{ color: 'hsl(224, 40%, 95%)' }}>{path.title}</p>
            {path.generatedByAI && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(276, 100%, 20%)', color: 'hsl(276, 100%, 50%)' }}>AI</span>
            )}
            {path.careerPath && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(244, 100%, 20%)', color: 'hsl(244, 100%, 69%)' }}>{path.careerPath}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-xs" style={{ backgroundColor: 'hsl(224, 30%, 18%)' }}>
              <div className="h-1.5 rounded-full" style={{ width: `${path.progressPct}%`, backgroundColor: 'hsl(244, 100%, 69%)' }} />
            </div>
            <span className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>{path.progressPct}% · {path.topics?.length ?? 0} topics</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setExpanded((v) => !v)} style={btnActionStyle}>
            {expanded ? 'Collapse' : 'View Topics'}
          </button>
          <button onClick={() => onAddTopic(path)} style={btnActionStyle}>+ Topic</button>
          <button onClick={() => onDelete(path.id)} style={btnDangerStyle}>Delete</button>
        </div>
      </div>

      {/* Topics */}
      {expanded && (
        <div style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
          {(path.topics ?? []).length === 0 ? (
            <p className="text-xs px-4 py-3" style={{ color: 'hsl(224, 20%, 55%)' }}>No topics yet.</p>
          ) : (
            path.topics.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 gap-3" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{t.title}</p>
                  {t.description && <p className="text-xs truncate" style={{ color: 'hsl(224, 20%, 55%)' }}>{t.description}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0" style={STATUS_STYLES[t.status]}>
                  {t.status.replace('_', ' ')}
                </span>
                <button onClick={() => onTopicDelete(path.id, t.id)} style={btnDangerStyle}>×</button>
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

  if (loading) return <p className="text-sm py-8 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</p>
  if (error)   return <p className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>

  return (
    <div className="space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium" style={{ color: 'hsl(224, 20%, 55%)' }}>Developer</label>
          <select
            style={{ ...inputStyle, padding: '6px 12px', fontSize: '14px', flex: 0, width: 'auto' }}
            value={selectedDev?.id ?? ''}
            onChange={(e) => {
              const dev = developers.find((d) => d.id === e.target.value)
              setSelectedDev(dev ?? null)
            }}
          >
            {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button onClick={() => setShowNewPath(true)} style={btnActionStyle} disabled={developers.length === 0}>
          + New Path
        </button>
      </div>

      {/* Path list */}
      {pathsLoading ? (
        <p className="text-sm py-4 text-center" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading paths…</p>
      ) : paths.length === 0 ? (
        <div className="rounded-xl py-10 text-center" style={{ border: '1px dashed hsl(224, 30%, 18%)' }}>
          <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>No learning paths for this developer yet.</p>
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
