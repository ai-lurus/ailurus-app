import { useEffect, useState, useCallback } from 'react'
import client from '../../api/client.js'
import { getOneOnOnes, createOneOnOneNote, updateOneOnOneNote, deleteOneOnOneNote } from '../../api/oneOnOnes.js'
import { getPerformanceReviews, createPerformanceReview, updatePerformanceReview } from '../../api/performanceReviews.js'
import { getTaskHistory } from '../../api/tasks.js'

// ── Mood helpers ──────────────────────────────────────────────────────────────

const MOOD_COLORS = {
  great:     'bg-emerald-400',
  good:      'bg-sky-400',
  okay:      'bg-amber-400',
  struggling:'bg-rose-400',
}
const MOOD_LABELS = { great: 'Great', good: 'Good', okay: 'Okay', struggling: 'Struggling' }
const MOOD_VALUES = { great: 4, good: 3, okay: 2, struggling: 1 }

function moodAvg(statuses) {
  const withMood = statuses.filter((s) => s.mood)
  if (!withMood.length) return null
  const avg = withMood.reduce((sum, s) => sum + (MOOD_VALUES[s.mood] ?? 0), 0) / withMood.length
  const rounded = Math.round(avg)
  return Object.entries(MOOD_VALUES).find(([, v]) => v === rounded)?.[0] ?? 'okay'
}

// ── Rating bar ────────────────────────────────────────────────────────────────

function RatingBar({ label, value }) {
  const pct = value ? (value / 5) * 100 : 0
  const color = value >= 4 ? 'bg-emerald-500' : value >= 3 ? 'bg-sky-500' : value >= 2 ? 'bg-amber-500' : 'bg-rose-500'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value ?? '—'}</span>
    </div>
  )
}

// ── Tab Activity ──────────────────────────────────────────────────────────────

function ActivityTab({ userId }) {
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const to   = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 29)
    const fromStr = from.toISOString().slice(0, 10)
    const toStr   = to.toISOString().slice(0, 10)

    client.get('/api/daily-status', { params: { userId, from: fromStr, to: toStr } })
      .then(({ data }) => setStatuses(data.statuses ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg msg={error} />

  // Build 30-day grid
  const days = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const status = statuses.find((s) => s.date?.slice(0, 10) === dateStr)
    days.push({ dateStr, status })
  }

  const withEod     = statuses.filter((s) => s.eodSubmittedAt)
  const eodPct      = statuses.length ? Math.round((withEod.length / statuses.length) * 100) : 0
  const avgMood     = moodAvg(statuses)
  const avgHrs      = statuses.filter((s) => s.availableHrs).length
    ? (statuses.reduce((s, x) => s + parseFloat(x.availableHrs ?? 0), 0) / statuses.filter((s) => s.availableHrs).length).toFixed(1)
    : null

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Mood" value={avgMood ? MOOD_LABELS[avgMood] : '—'} />
        <StatCard label="EOD Completion" value={`${eodPct}%`} />
        <StatCard label="Avg Hours" value={avgHrs ? `${avgHrs}h` : '—'} />
      </div>

      {/* Mood grid */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Last 30 days</p>
        <div className="flex flex-wrap gap-1.5">
          {days.map(({ dateStr, status }) => {
            const mood = status?.eodMood ?? status?.mood
            const color = mood ? MOOD_COLORS[mood] : 'bg-gray-200'
            return (
              <div key={dateStr} className="relative group">
                <div className={`w-5 h-5 rounded-full cursor-pointer ${color}`} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                    {dateStr}{mood ? ` · ${MOOD_LABELS[mood]}` : ' · No data'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div className="flex gap-3 mt-2 flex-wrap">
          {Object.entries(MOOD_COLORS).map(([mood, cls]) => (
            <span key={mood} className="inline-flex items-center gap-1 text-xs text-gray-500">
              <span className={`w-2.5 h-2.5 rounded-full ${cls}`} />
              {MOOD_LABELS[mood]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            No data
          </span>
        </div>
      </div>

      {/* Recent check-ins list */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent check-ins</p>
        <div className="space-y-1">
          {statuses.slice(0, 10).map((s) => {
            const isOpen = expanded === s.id
            const mood   = s.mood
            const dot    = mood ? MOOD_COLORS[mood] : 'bg-gray-200'
            return (
              <div key={s.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
                  <span className="text-xs text-gray-700 flex-1">{s.date?.slice(0, 10)}</span>
                  {s.eodSubmittedAt && (
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">EOD ✓</span>
                  )}
                  <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-1.5 text-xs text-gray-600 bg-gray-50/50">
                    {s.availableHrs && <p><span className="font-medium">Hours:</span> {s.availableHrs}h</p>}
                    {s.notes && <p><span className="font-medium">Notes:</span> {s.notes}</p>}
                    {s.blockers && <p><span className="font-medium text-rose-600">Blockers:</span> {s.blockers}</p>}
                    {s.eodCompleted && <p><span className="font-medium text-emerald-600">Completed:</span> {s.eodCompleted}</p>}
                    {s.eodNotes && <p><span className="font-medium">EOD Notes:</span> {s.eodNotes}</p>}
                  </div>
                )}
              </div>
            )
          })}
          {statuses.length === 0 && <p className="text-xs text-gray-400">No check-ins in the last 30 days.</p>}
        </div>
      </div>
    </div>
  )
}

// ── Tab Tickets ───────────────────────────────────────────────────────────────

function TicketsTab({ userId }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    const to   = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - 55) // ~8 weeks
    getTaskHistory(userId, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg msg={error} />

  const weeks = data?.weeks ?? []
  const tasks = data?.tasks ?? []
  const maxPts = Math.max(...weeks.map((w) => w.totalPoints), 1)

  return (
    <div className="space-y-5">
      {/* Velocity chart */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Story Points / Week (last 8 weeks)</p>
        {weeks.length === 0 ? (
          <p className="text-xs text-gray-400">No completed tickets in this period.</p>
        ) : (
          <div className="flex items-end gap-2 h-24">
            {weeks.slice(0, 8).reverse().map((w) => {
              const heightPct = Math.round((w.totalPoints / maxPts) * 100)
              return (
                <div key={w.week} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                  <span className="text-xs font-semibold text-gray-700">{w.totalPoints}</span>
                  <div className="w-full bg-indigo-100 rounded-t-sm relative group" style={{ height: `${Math.max(heightPct, 4)}%` }}>
                    <div className="w-full h-full bg-indigo-500 rounded-t-sm" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {w.week} · {w.tasks.length} tasks
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 truncate w-full text-center">{w.week.slice(5)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Tasks list */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Completed & In Review</p>
        <div className="space-y-1">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 text-xs">
              <span className={`px-1.5 py-0.5 rounded-full font-medium ${t.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700'}`}>
                {t.status === 'done' ? 'done' : 'in review'}
              </span>
              <span className="flex-1 text-gray-700 truncate">{t.title}</span>
              <span className="text-gray-400 shrink-0">{t.project?.name}</span>
              {t.storyPoints != null && (
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold shrink-0">{t.storyPoints}pts</span>
              )}
            </div>
          ))}
          {tasks.length === 0 && <p className="text-xs text-gray-400">No tickets in this period.</p>}
        </div>
      </div>
    </div>
  )
}

// ── Tab 1on1s ─────────────────────────────────────────────────────────────────

const EMPTY_NOTE_FORM = { sessionDate: '', notes: '', strengths: '', improvements: '', agreements: '' }

function OneOnOnesTab({ userId }) {
  const [notes, setNotes]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_NOTE_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState(null)
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    getOneOnOnes(userId)
      .then(setNotes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...EMPTY_NOTE_FORM, sessionDate: new Date().toISOString().slice(0, 10) })
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(note) {
    setEditingId(note.id)
    setForm({
      sessionDate:  note.sessionDate?.slice(0, 10) ?? '',
      notes:        note.notes ?? '',
      strengths:    note.strengths ?? '',
      improvements: note.improvements ?? '',
      agreements:   note.agreements ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        subjectId:    userId,
        sessionDate:  form.sessionDate,
        notes:        form.notes,
        strengths:    form.strengths || null,
        improvements: form.improvements || null,
        agreements:   form.agreements || null,
      }
      if (editingId) {
        const updated = await updateOneOnOneNote(editingId, payload)
        setNotes((prev) => prev.map((n) => (n.id === editingId ? updated : n)))
      } else {
        const created = await createOneOnOneNote(payload)
        setNotes((prev) => [created, ...prev])
      }
      cancel()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this 1-on-1 note?')) return
    try {
      await deleteOneOnOneNote(id)
      setNotes((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg msg={error} />

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={openNew} className={btnAction}>+ New Session</button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-indigo-200 rounded-xl p-4 space-y-3 bg-indigo-50/30">
          <p className="text-xs font-semibold text-indigo-700">{editingId ? 'Edit Session' : 'New 1-on-1 Session'}</p>
          {formError && <p className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">{formError}</p>}
          <FormField label="Session Date" required>
            <input className={inputCls} type="date" value={form.sessionDate} onChange={(e) => setField('sessionDate', e.target.value)} required />
          </FormField>
          <FormField label="Notes" required>
            <textarea className={`${inputCls} h-20 resize-none`} value={form.notes} onChange={(e) => setField('notes', e.target.value)} required placeholder="General session notes…" />
          </FormField>
          <FormField label="Strengths">
            <textarea className={`${inputCls} h-16 resize-none`} value={form.strengths} onChange={(e) => setField('strengths', e.target.value)} placeholder="What's going well…" />
          </FormField>
          <FormField label="Areas for Improvement">
            <textarea className={`${inputCls} h-16 resize-none`} value={form.improvements} onChange={(e) => setField('improvements', e.target.value)} placeholder="Growth opportunities…" />
          </FormField>
          <FormField label="Agreements">
            <textarea className={`${inputCls} h-16 resize-none`} value={form.agreements} onChange={(e) => setField('agreements', e.target.value)} placeholder="Action items / commitments…" />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={cancel} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {notes.map((note) => {
          const isOpen = expanded === note.id
          return (
            <div key={note.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : note.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
              >
                <span className="text-xs font-semibold text-gray-700 flex-1">{note.sessionDate?.slice(0, 10)}</span>
                <span className="text-xs text-gray-400">by {note.author?.name}</span>
                <span className="text-gray-400 text-xs ml-2">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-3 space-y-2 bg-gray-50/50 text-xs text-gray-600">
                  <p><span className="font-medium text-gray-700">Notes:</span> {note.notes}</p>
                  {note.strengths    && <p><span className="font-medium text-emerald-700">Strengths:</span> {note.strengths}</p>}
                  {note.improvements && <p><span className="font-medium text-amber-700">Improvements:</span> {note.improvements}</p>}
                  {note.agreements   && <p><span className="font-medium text-indigo-700">Agreements:</span> {note.agreements}</p>}
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEdit(note)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(note.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {notes.length === 0 && !showForm && <p className="text-xs text-gray-400">No 1-on-1 sessions recorded yet.</p>}
      </div>
    </div>
  )
}

// ── Tab Evaluaciones ──────────────────────────────────────────────────────────

const EMPTY_REVIEW_FORM = {
  periodLabel: '', periodStart: '', periodEnd: '',
  ratingTechnical: '', ratingComms: '', ratingAutonomy: '', ratingTeamwork: '', overallRating: '',
  summary: '',
}

function EvaluationsTab({ userId }) {
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_REVIEW_FORM)
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState(null)
  const [expanded, setExpanded]   = useState(null)

  useEffect(() => {
    getPerformanceReviews(userId)
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...EMPTY_REVIEW_FORM })
    setFormError(null)
    setShowForm(true)
  }

  function openEdit(review) {
    setEditingId(review.id)
    setForm({
      periodLabel:     review.periodLabel ?? '',
      periodStart:     review.periodStart?.slice(0, 10) ?? '',
      periodEnd:       review.periodEnd?.slice(0, 10) ?? '',
      ratingTechnical: review.ratingTechnical?.toString() ?? '',
      ratingComms:     review.ratingComms?.toString() ?? '',
      ratingAutonomy:  review.ratingAutonomy?.toString() ?? '',
      ratingTeamwork:  review.ratingTeamwork?.toString() ?? '',
      overallRating:   review.overallRating?.toString() ?? '',
      summary:         review.summary ?? '',
    })
    setFormError(null)
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        subjectId:       userId,
        periodLabel:     form.periodLabel,
        periodStart:     form.periodStart,
        periodEnd:       form.periodEnd,
        ratingTechnical: form.ratingTechnical ? parseInt(form.ratingTechnical) : null,
        ratingComms:     form.ratingComms     ? parseInt(form.ratingComms)     : null,
        ratingAutonomy:  form.ratingAutonomy  ? parseInt(form.ratingAutonomy)  : null,
        ratingTeamwork:  form.ratingTeamwork  ? parseInt(form.ratingTeamwork)  : null,
        overallRating:   form.overallRating   ? parseInt(form.overallRating)   : null,
        summary:         form.summary || null,
      }
      if (editingId) {
        const updated = await updatePerformanceReview(editingId, payload)
        setReviews((prev) => prev.map((r) => (r.id === editingId ? updated : r)))
      } else {
        const created = await createPerformanceReview(payload)
        setReviews((prev) => [created, ...prev])
      }
      cancel()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (error)   return <ErrorMsg msg={error} />

  const ratingOptions = ['', '1', '2', '3', '4', '5']

  return (
    <div className="space-y-4">
      {!showForm && (
        <button onClick={openNew} className={btnAction}>+ New Evaluation</button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="border border-indigo-200 rounded-xl p-4 space-y-3 bg-indigo-50/30">
          <p className="text-xs font-semibold text-indigo-700">{editingId ? 'Edit Evaluation' : 'New Evaluation'}</p>
          {formError && <p className="text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">{formError}</p>}
          <FormField label="Period Label" required>
            <input className={inputCls} value={form.periodLabel} onChange={(e) => setField('periodLabel', e.target.value)} required placeholder="e.g. Q1 2026" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Period Start" required>
              <input className={inputCls} type="date" value={form.periodStart} onChange={(e) => setField('periodStart', e.target.value)} required />
            </FormField>
            <FormField label="Period End" required>
              <input className={inputCls} type="date" value={form.periodEnd} onChange={(e) => setField('periodEnd', e.target.value)} required />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['ratingTechnical', 'Technical'],
              ['ratingComms', 'Communication'],
              ['ratingAutonomy', 'Autonomy'],
              ['ratingTeamwork', 'Teamwork'],
            ].map(([field, label]) => (
              <FormField key={field} label={label}>
                <select className={inputCls} value={form[field]} onChange={(e) => setField(field, e.target.value)}>
                  {ratingOptions.map((v) => (
                    <option key={v} value={v}>{v || '— no rating —'}</option>
                  ))}
                </select>
              </FormField>
            ))}
          </div>
          <FormField label="Overall Rating">
            <select className={inputCls} value={form.overallRating} onChange={(e) => setField('overallRating', e.target.value)}>
              {ratingOptions.map((v) => (
                <option key={v} value={v}>{v || '— no rating —'}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Summary">
            <textarea className={`${inputCls} h-20 resize-none`} value={form.summary} onChange={(e) => setField('summary', e.target.value)} placeholder="Overall assessment…" />
          </FormField>
          <div className="flex gap-2">
            <button type="button" onClick={cancel} className={btnSecondary}>Cancel</button>
            <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {reviews.map((review) => {
          const isOpen = expanded === review.id
          const overall = review.overallRating
          const overallColor = overall >= 4 ? 'text-emerald-600' : overall >= 3 ? 'text-sky-600' : overall >= 2 ? 'text-amber-600' : 'text-rose-600'
          return (
            <div key={review.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : review.id)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
              >
                <span className="text-xs font-semibold text-gray-700 flex-1">{review.periodLabel}</span>
                {overall != null && (
                  <span className={`text-xs font-bold ${overallColor}`}>★ {overall}/5</span>
                )}
                <span className="text-xs text-gray-400">{review.periodEnd?.slice(0, 10)}</span>
                <span className="text-gray-400 text-xs ml-2">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 bg-gray-50/50">
                  <p className="text-xs text-gray-400">{review.periodStart?.slice(0, 10)} → {review.periodEnd?.slice(0, 10)} · by {review.author?.name}</p>
                  <div className="space-y-1.5">
                    <RatingBar label="Technical"     value={review.ratingTechnical} />
                    <RatingBar label="Communication" value={review.ratingComms} />
                    <RatingBar label="Autonomy"      value={review.ratingAutonomy} />
                    <RatingBar label="Teamwork"      value={review.ratingTeamwork} />
                    {review.overallRating != null && (
                      <RatingBar label="Overall" value={review.overallRating} />
                    )}
                  </div>
                  {review.summary && (
                    <p className="text-xs text-gray-600"><span className="font-medium">Summary:</span> {review.summary}</p>
                  )}
                  <button onClick={() => openEdit(review)} className="text-indigo-600 hover:underline text-xs">Edit</button>
                </div>
              )}
            </div>
          )
        })}
        {reviews.length === 0 && !showForm && <p className="text-xs text-gray-400">No evaluations recorded yet.</p>}
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'activity',    label: 'Activity' },
  { id: 'tickets',     label: 'Tickets' },
  { id: 'oneonones',   label: '1 on 1s' },
  { id: 'evaluations', label: 'Evaluations' },
]

export default function DeveloperProfilePanel({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('activity')

  // Trap ESC
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-indigo-700">{user.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user.role} · {user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5 shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-3 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {activeTab === 'activity'    && <ActivityTab    userId={user.id} />}
          {activeTab === 'tickets'     && <TicketsTab     userId={user.id} />}
          {activeTab === 'oneonones'   && <OneOnOnesTab   userId={user.id} />}
          {activeTab === 'evaluations' && <EvaluationsTab userId={user.id} />}
        </div>
      </div>
    </>
  )
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function Spinner() {
  return <p className="text-xs text-gray-400 py-6 text-center">Loading…</p>
}

function ErrorMsg({ msg }) {
  return <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
      <p className="text-sm font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls    = 'w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300'
const btnPrimary  = 'flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50'
const btnSecondary = 'px-4 py-2 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors'
const btnAction   = 'text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors'
