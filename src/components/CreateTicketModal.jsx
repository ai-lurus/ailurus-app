import { useEffect, useState } from 'react'
import { createTask } from '../api/tasks.js'
import { getProjects } from '../api/projects.js'

const CATEGORIES = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'design',      label: 'Design' },
  { value: 'marketing',   label: 'Marketing' },
  { value: 'other',       label: 'Other' },
]

export default function CreateTicketModal({ userId, onClose, onCreated }) {
  const [projects, setProjects]     = useState([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  const [form, setForm] = useState({
    projectId:    '',
    title:        '',
    description:  '',
    category:     'engineering',
    estimatedHrs: '',
  })

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => setError(err.message))
      .finally(() => setLoadingProjects(false))
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.projectId || !form.title.trim()) {
      setError('Project and title are required.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        projectId:   form.projectId,
        title:       form.title.trim(),
        description: form.description.trim() || undefined,
        category:    form.category,
        assignedTo:  userId,
        estimatedHrs: form.estimatedHrs ? parseFloat(form.estimatedHrs) : undefined,
      }
      const task = await createTask(payload)
      onCreated(task)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" style={{ backgroundColor: 'hsl(224, 30%, 14%)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          <h2 className="text-base font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>New Ticket</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'hsl(224, 20%, 55%)' }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Project */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'hsl(224, 20%, 55%)' }}>Project *</label>
            {loadingProjects ? (
              <p className="text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading projects…</p>
            ) : (
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                required
                className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                  focusRingColor: 'hsl(244, 100%, 69%)',
                }}
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'hsl(224, 20%, 55%)' }}>Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Short description of the task"
              className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{
                backgroundColor: 'hsl(224, 25%, 16%)',
                border: '1px solid hsl(224, 30%, 18%)',
                color: 'hsl(224, 40%, 95%)',
                placeholderColor: 'hsl(224, 20%, 55%)',
                focusRingColor: 'hsl(244, 100%, 69%)',
              }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: 'hsl(224, 20%, 55%)' }}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="What needs to be done? Add context, acceptance criteria…"
              className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
              style={{
                backgroundColor: 'hsl(224, 25%, 16%)',
                border: '1px solid hsl(224, 30%, 18%)',
                color: 'hsl(224, 40%, 95%)',
                placeholderColor: 'hsl(224, 20%, 55%)',
                focusRingColor: 'hsl(244, 100%, 69%)',
              }}
            />
          </div>

          {/* Category + Estimated hours */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'hsl(224, 20%, 55%)' }}>Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                  focusRingColor: 'hsl(244, 100%, 69%)',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: 'hsl(224, 20%, 55%)' }}>Est. hours</label>
              <input
                type="number"
                name="estimatedHrs"
                value={form.estimatedHrs}
                onChange={handleChange}
                min="0"
                step="0.5"
                placeholder="e.g. 2"
                className="text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  border: '1px solid hsl(224, 30%, 18%)',
                  color: 'hsl(224, 40%, 95%)',
                  placeholderColor: 'hsl(224, 20%, 55%)',
                  focusRingColor: 'hsl(244, 100%, 69%)',
                }}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 10%)', border: '1px solid hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid hsl(224, 30%, 18%)',
                color: 'hsl(224, 20%, 55%)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loadingProjects}
              className="flex-1 text-sm font-semibold px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}
            >
              {submitting ? 'Creating…' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
