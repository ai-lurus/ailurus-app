import { useEffect, useState } from 'react'
import Layout from '../../components/Layout.jsx'
import Modal from '../../components/Modal.jsx'
import { getProjects } from '../../api/projects.js'
import { getSprints, createSprint, updateSprint, deleteSprint } from '../../api/sprints.js'
import { getAllTasks, updateTask } from '../../api/tasks.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toInputDate(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().slice(0, 10)
}

const STATUS_LABEL = { planned: 'Planeado', active: 'Activo', completed: 'Completado' }
const STATUS_CLS = {
  planned:   'bg-slate-600/20 text-slate-400',
  active:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

const inputCls     = 'w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 transition-colors'
const btnPrimary   = 'flex-1 px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'
const btnDanger    = 'px-4 py-2 text-sm font-medium rounded-lg transition-colors'

const inputStyle = {
  backgroundColor: 'hsl(224, 25%, 16%)',
  border: '1px solid hsl(224, 30%, 18%)',
  color: 'hsl(224, 40%, 95%)',
  focusRingColor: 'hsl(244, 100%, 69%)',
}

const btnPrimaryStyle = {
  backgroundColor: 'hsl(244, 100%, 69%)',
  color: 'hsl(224, 30%, 14%)',
}

const btnSecondaryStyle = {
  backgroundColor: 'transparent',
  border: '1px solid hsl(224, 30%, 18%)',
  color: 'hsl(224, 20%, 55%)',
}

const btnDangerStyle = {
  backgroundColor: 'transparent',
  border: '1px solid hsl(0, 100%, 20%)',
  color: 'hsl(0, 100%, 60%)',
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

// ── Sprint Form Modal ─────────────────────────────────────────────────────────

function SprintFormModal({ sprint, projectId, onClose, onSaved }) {
  const isEdit = Boolean(sprint)
  const [form, setForm] = useState({
    name:      sprint?.name      ?? '',
    objective: sprint?.objective ?? '',
    startDate: sprint ? toInputDate(sprint.startDate) : '',
    endDate:   sprint ? toInputDate(sprint.endDate)   : '',
    status:    sprint?.status    ?? 'planned',
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
      const payload = {
        name:      form.name,
        objective: form.objective || null,
        startDate: form.startDate,
        endDate:   form.endDate,
        status:    form.status,
      }
      const saved = isEdit
        ? await updateSprint(sprint.id, payload)
        : await createSprint({ ...payload, projectId })
      onSaved(saved)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={isEdit ? 'Editar Sprint' : 'Nuevo Sprint'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        <Field label="Nombre" required>
          <input style={inputStyle} className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Sprint 1 — MVP" autoFocus />
        </Field>

        <Field label="Objetivo">
          <textarea
            style={inputStyle}
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.objective}
            onChange={(e) => set('objective', e.target.value)}
            placeholder="¿Qué debe quedar listo al terminar este sprint?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio" required>
            <input style={inputStyle} className={inputCls} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </Field>
          <Field label="Fin" required>
            <input style={inputStyle} className={inputCls} type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </Field>
        </div>

        {isEdit && (
          <Field label="Estado">
            <select style={inputStyle} className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="planned">Planeado</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
            </select>
          </Field>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary} style={btnSecondaryStyle}>Cancelar</button>
          <button type="submit" disabled={saving} className={btnPrimary} style={btnPrimaryStyle}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear Sprint'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Sprint Detail Modal ───────────────────────────────────────────────────────

function SprintDetailModal({ sprint, allTasks, onClose, onTaskMoved }) {
  const sprintTasks  = allTasks.filter((t) => t.sprintId === sprint.id)
  const backlogTasks = allTasks.filter((t) => !t.sprintId && t.projectId === sprint.projectId)
  const [adding, setAdding]   = useState(false)
  const [removing, setRemoving] = useState(null)

  async function handleAdd(taskId) {
    setAdding(true)
    try {
      const updated = await updateTask(taskId, { sprintId: sprint.id })
      onTaskMoved(updated)
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(taskId) {
    setRemoving(taskId)
    try {
      const updated = await updateTask(taskId, { sprintId: null })
      onTaskMoved(updated)
    } finally {
      setRemoving(null)
    }
  }

  const STATUS_PILL = {
    backlog:     'bg-slate-600/20 text-slate-400 border border-slate-500/30',
    ready:       'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    in_progress: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    in_review:   'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    blocked:     'bg-red-500/20 text-red-400 border border-red-500/30',
    done:        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  }

  return (
    <Modal title={sprint.name} onClose={onClose} size="lg">
      <div className="space-y-5">
        {/* Objetivo */}
        {sprint.objective && (
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'hsl(259, 100%, 15%)', border: '1px solid hsl(259, 100%, 30%)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'hsl(259, 100%, 69%)' }}>Objetivo del sprint</p>
            <p className="text-sm" style={{ color: 'hsl(224, 40%, 95%)' }}>{sprint.objective}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex gap-4 text-xs" style={{ color: 'hsl(224, 20%, 55%)' }}>
          <span>{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</span>
          <span className={`font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[sprint.status]}`}>
            {STATUS_LABEL[sprint.status]}
          </span>
        </div>

        {/* Tasks in sprint */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'hsl(224, 30%, 70%)' }}>
            Tickets en este sprint ({sprintTasks.length})
          </p>
          {sprintTasks.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'hsl(224, 20%, 55%)' }}>Sin tickets asignados aún.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sprintTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${STATUS_PILL[t.status] ?? STATUS_PILL.backlog}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <p className="flex-1 text-sm truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{t.title}</p>
                  {t.assignee && <span className="text-xs shrink-0" style={{ color: 'hsl(224, 20%, 55%)' }}>{t.assignee.name}</span>}
                  <button
                    onClick={() => handleRemove(t.id)}
                    disabled={removing === t.id}
                    className="shrink-0 transition-colors"
                    style={{ color: 'hsl(224, 20%, 55%)' }}
                    title="Quitar del sprint"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backlog to add */}
        {backlogTasks.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'hsl(224, 30%, 70%)' }}>
              Agregar del backlog ({backlogTasks.length})
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {backlogTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'hsl(224, 30%, 18%)', border: '1px solid hsl(224, 30%, 18%)' }}>
                  <p className="flex-1 text-sm truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{t.title}</p>
                  {t.assignee && <span className="text-xs shrink-0" style={{ color: 'hsl(224, 20%, 55%)' }}>{t.assignee.name}</span>}
                  <button
                    onClick={() => handleAdd(t.id)}
                    disabled={adding}
                    className="shrink-0 transition-colors"
                    style={{ color: 'hsl(259, 100%, 69%)' }}
                    title="Agregar al sprint"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button onClick={onClose} className={btnSecondary} style={btnSecondaryStyle}>Cerrar</button>
        </div>
      </div>
    </Modal>
  )
}

// ── Sprint Card ───────────────────────────────────────────────────────────────

function SprintCard({ sprint, allTasks, onEdit, onDelete, onViewTasks }) {
  const taskCount = allTasks.filter((t) => t.sprintId === sprint.id).length
  const doneCount = allTasks.filter((t) => t.sprintId === sprint.id && t.status === 'done').length
  const pct = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0

  return (
    <div className="rounded-xl p-5 flex flex-col gap-3 transition-colors" style={{ backgroundColor: 'hsl(224, 25%, 16%)', border: '1px solid hsl(224, 30%, 18%)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate" style={{ color: 'hsl(224, 40%, 95%)' }}>{sprint.name}</p>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[sprint.status]}`}>
          {STATUS_LABEL[sprint.status]}
        </span>
      </div>

      {sprint.objective && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'hsl(224, 20%, 55%)' }}>{sprint.objective}</p>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>
          <span>{taskCount} ticket{taskCount !== 1 ? 's' : ''}</span>
          <span>{pct}% completado</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(224, 30%, 18%)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%`, backgroundColor: 'hsl(244, 100%, 69%)' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onViewTasks(sprint)}
          className="flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{ backgroundColor: 'hsl(244, 100%, 15%)', color: 'hsl(244, 100%, 69%)', border: '1px solid hsl(244, 100%, 30%)' }}
        >
          Ver tickets
        </button>
        <button
          onClick={() => onEdit(sprint)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px solid hsl(224, 30%, 18%)', color: 'hsl(224, 20%, 55%)', backgroundColor: 'transparent' }}
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(sprint)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ border: '1px solid hsl(0, 100%, 20%)', color: 'hsl(0, 100%, 60%)', backgroundColor: 'transparent' }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminSprints() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [sprints, setSprints]   = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const [showCreateModal, setShowCreateModal]   = useState(false)
  const [editingSprint, setEditingSprint]       = useState(null)
  const [viewingTasks, setViewingTasks]         = useState(null)
  const [deletingId, setDeletingId]             = useState(null)

  useEffect(() => {
    getProjects().then(setProjects).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selectedProject) { setSprints([]); setAllTasks([]); return }
    setLoading(true)
    Promise.all([
      getSprints(selectedProject),
      getAllTasks({ projectId: selectedProject }),
    ])
      .then(([s, t]) => { setSprints(s); setAllTasks(t) })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedProject])

  function handleSprintSaved(sprint) {
    setSprints((prev) => {
      const idx = prev.findIndex((s) => s.id === sprint.id)
      return idx >= 0
        ? prev.map((s) => (s.id === sprint.id ? sprint : s))
        : [sprint, ...prev]
    })
    setShowCreateModal(false)
    setEditingSprint(null)
  }

  async function handleDelete(sprint) {
    if (!confirm(`¿Eliminar "${sprint.name}"? Los tickets quedarán sin sprint.`)) return
    setDeletingId(sprint.id)
    try {
      await deleteSprint(sprint.id)
      setSprints((prev) => prev.filter((s) => s.id !== sprint.id))
      setAllTasks((prev) => prev.map((t) => t.sprintId === sprint.id ? { ...t, sprintId: null } : t))
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleTaskMoved(updatedTask) {
    setAllTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)))
    // Refresh viewing sprint's task list by updating the sprint's task count
    if (viewingTasks) {
      setViewingTasks((s) => ({ ...s })) // force re-render
    }
  }

  const planned   = sprints.filter((s) => s.status === 'planned')
  const active    = sprints.filter((s) => s.status === 'active')
  const completed = sprints.filter((s) => s.status === 'completed')

  return (
    <Layout>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>Sprints</h1>
            <p className="text-sm mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Organiza el trabajo por sprints y define los objetivos de cada uno.</p>
          </div>
          {selectedProject && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'hsl(224, 30%, 14%)' }}
            >
              + Nuevo Sprint
            </button>
          )}
        </div>

        {/* Project selector */}
        <div className="mb-6">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
            style={inputStyle}
          >
            <option value="">Selecciona un proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm px-4 py-3 rounded-lg mb-4" style={{ backgroundColor: 'hsl(0, 100%, 15%)', color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

        {!selectedProject && (
          <div className="text-center py-20" style={{ color: 'hsl(224, 20%, 55%)' }}>
            <p className="text-sm">Selecciona un proyecto para ver sus sprints.</p>
          </div>
        )}

        {selectedProject && loading && (
          <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Cargando sprints…</p>
        )}

        {selectedProject && !loading && sprints.length === 0 && (
          <div className="text-center py-20" style={{ color: 'hsl(224, 20%, 55%)' }}>
            <p className="text-sm font-medium">Sin sprints aún.</p>
            <p className="text-xs mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        )}

        {/* Sprint sections */}
        {active.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'hsl(120, 100%, 50%)' }}>Activo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {active.map((s) => (
                <SprintCard
                  key={s.id}
                  sprint={s}
                  allTasks={allTasks}
                  onEdit={setEditingSprint}
                  onDelete={handleDelete}
                  onViewTasks={setViewingTasks}
                />
              ))}
            </div>
          </section>
        )}

        {planned.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'hsl(224, 20%, 55%)' }}>Planeados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {planned.map((s) => (
                <SprintCard
                  key={s.id}
                  sprint={s}
                  allTasks={allTasks}
                  onEdit={setEditingSprint}
                  onDelete={handleDelete}
                  onViewTasks={setViewingTasks}
                />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'hsl(224, 20%, 55%)' }}>Completados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {completed.map((s) => (
                <SprintCard
                  key={s.id}
                  sprint={s}
                  allTasks={allTasks}
                  onEdit={setEditingSprint}
                  onDelete={handleDelete}
                  onViewTasks={setViewingTasks}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {showCreateModal && (
        <SprintFormModal
          projectId={selectedProject}
          onClose={() => setShowCreateModal(false)}
          onSaved={handleSprintSaved}
        />
      )}

      {editingSprint && (
        <SprintFormModal
          sprint={editingSprint}
          projectId={selectedProject}
          onClose={() => setEditingSprint(null)}
          onSaved={handleSprintSaved}
        />
      )}

      {viewingTasks && (
        <SprintDetailModal
          sprint={viewingTasks}
          allTasks={allTasks}
          onClose={() => setViewingTasks(null)}
          onTaskMoved={handleTaskMoved}
        />
      )}
    </Layout>
  )
}
