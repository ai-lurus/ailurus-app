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
  planned:   'bg-slate-100 text-slate-600',
  active:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border border-blue-100',
}

const inputCls     = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary   = 'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors'
const btnDanger    = 'px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
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
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <Field label="Nombre" required>
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Sprint 1 — MVP" autoFocus />
        </Field>

        <Field label="Objetivo">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.objective}
            onChange={(e) => set('objective', e.target.value)}
            placeholder="¿Qué debe quedar listo al terminar este sprint?"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Inicio" required>
            <input className={inputCls} type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
          </Field>
          <Field label="Fin" required>
            <input className={inputCls} type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </Field>
        </div>

        {isEdit && (
          <Field label="Estado">
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="planned">Planeado</option>
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
            </select>
          </Field>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={saving} className={btnPrimary}>
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
    backlog:     'bg-slate-100 text-slate-500',
    ready:       'bg-sky-50 text-sky-700',
    in_progress: 'bg-amber-50 text-amber-700',
    in_review:   'bg-purple-50 text-purple-700',
    blocked:     'bg-red-50 text-red-600',
    done:        'bg-emerald-50 text-emerald-700',
  }

  return (
    <Modal title={sprint.name} onClose={onClose} size="lg">
      <div className="space-y-5">
        {/* Objetivo */}
        {sprint.objective && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-indigo-600 mb-1">Objetivo del sprint</p>
            <p className="text-sm text-indigo-900">{sprint.objective}</p>
          </div>
        )}

        {/* Meta */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</span>
          <span className={`font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[sprint.status]}`}>
            {STATUS_LABEL[sprint.status]}
          </span>
        </div>

        {/* Tasks in sprint */}
        <div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
            Tickets en este sprint ({sprintTasks.length})
          </p>
          {sprintTasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Sin tickets asignados aún.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {sprintTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2">
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${STATUS_PILL[t.status] ?? STATUS_PILL.backlog}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <p className="flex-1 text-sm text-slate-800 truncate">{t.title}</p>
                  {t.assignee && <span className="text-xs text-slate-400 shrink-0">{t.assignee.name}</span>}
                  <button
                    onClick={() => handleRemove(t.id)}
                    disabled={removing === t.id}
                    className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
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
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Agregar del backlog ({backlogTasks.length})
            </p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {backlogTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                  <p className="flex-1 text-sm text-slate-700 truncate">{t.title}</p>
                  {t.assignee && <span className="text-xs text-slate-400 shrink-0">{t.assignee.name}</span>}
                  <button
                    onClick={() => handleAdd(t.id)}
                    disabled={adding}
                    className="shrink-0 text-slate-300 hover:text-indigo-500 transition-colors"
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
          <button onClick={onClose} className={btnSecondary}>Cerrar</button>
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
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-snug truncate">{sprint.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(sprint.startDate)} → {fmt(sprint.endDate)}</p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[sprint.status]}`}>
          {STATUS_LABEL[sprint.status]}
        </span>
      </div>

      {sprint.objective && (
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{sprint.objective}</p>
      )}

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{taskCount} ticket{taskCount !== 1 ? 's' : ''}</span>
          <span>{pct}% completado</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onViewTasks(sprint)}
          className="flex-1 text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
        >
          Ver tickets
        </button>
        <button
          onClick={() => onEdit(sprint)}
          className="text-xs font-medium px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(sprint)}
          className="text-xs font-medium px-3 py-1.5 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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
            <h1 className="text-xl font-bold text-slate-900">Sprints</h1>
            <p className="text-sm text-slate-500 mt-0.5">Organiza el trabajo por sprints y define los objetivos de cada uno.</p>
          </div>
          {selectedProject && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
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
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Selecciona un proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg mb-4">{error}</p>}

        {!selectedProject && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-sm">Selecciona un proyecto para ver sus sprints.</p>
          </div>
        )}

        {selectedProject && loading && (
          <p className="text-sm text-slate-400">Cargando sprints…</p>
        )}

        {selectedProject && !loading && sprints.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p className="text-sm font-medium">Sin sprints aún.</p>
            <p className="text-xs mt-1">Crea el primero con el botón de arriba.</p>
          </div>
        )}

        {/* Sprint sections */}
        {active.length > 0 && (
          <section className="mb-8">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">Activo</p>
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
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Planeados</p>
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
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Completados</p>
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
