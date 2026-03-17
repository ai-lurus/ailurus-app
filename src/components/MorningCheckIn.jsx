import { useEffect, useState } from 'react'
import { getTodayStatus, submitDailyStatus } from '../api/dailyStatus.js'
import { SunIcon, ClockIcon, CalendarIcon, WarningIcon, CheckCircleIcon } from './Icons.jsx'

const MOODS = [
  { value: 'great',      label: 'Great',     dot: 'bg-emerald-400', active: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'good',       label: 'Good',      dot: 'bg-sky-400',     active: 'border-sky-400 bg-sky-50 text-sky-700' },
  { value: 'okay',       label: 'Okay',      dot: 'bg-amber-400',   active: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'struggling', label: 'Rough day', dot: 'bg-rose-400',    active: 'border-rose-400 bg-rose-50 text-rose-700' },
]

const MOOD_SUMMARY = {
  great:      `You're feeling great today — let's make it count!`,
  good:       `Good energy today. You've got this.`,
  okay:       'Okay day so far. Take it one task at a time.',
  struggling: `Rough start — that's okay. You showed up, that matters.`,
}

function CheckInForm({ onSubmit, submitting }) {
  const today = new Date().toISOString().slice(0, 10)
  const [mood, setMood]               = useState('')
  const [availableHrs, setAvailableHrs] = useState('')
  const [appointments, setAppointments] = useState('')
  const [blockers, setBlockers]         = useState('')
  const [error, setError]               = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!mood) { setError('Please pick a mood before continuing.'); return }
    setError(null)
    onSubmit({ date: today, mood, availableHrs: availableHrs || null, appointments: appointments || null, blockers: blockers || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mood */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
          How are you feeling?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => {
            const isActive = mood === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer ${
                  isActive ? m.active : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${m.dot}`} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Available hours */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Hours available today
        </label>
        <input
          type="number"
          min="0"
          max="12"
          step="0.5"
          value={availableHrs}
          onChange={(e) => setAvailableHrs(e.target.value)}
          placeholder="e.g. 6"
          className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
        />
      </div>

      {/* Appointments */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Appointments or commitments
        </label>
        <input
          type="text"
          value={appointments}
          onChange={(e) => setAppointments(e.target.value)}
          placeholder="e.g. Team standup at 10am, dentist at 3pm"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
        />
      </div>

      {/* Blockers */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Blockers from yesterday
        </label>
        <textarea
          rows={2}
          value={blockers}
          onChange={(e) => setBlockers(e.target.value)}
          placeholder="Anything that slowed you down or is still unresolved…"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
      >
        {submitting ? 'Saving…' : 'Start my day →'}
      </button>
    </form>
  )
}

function CheckInSummary({ status }) {
  const mood = MOODS.find((m) => m.value === status.mood)
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${mood?.dot ?? 'bg-slate-400'}`} />
        <p className="font-medium text-slate-800 text-sm">{MOOD_SUMMARY[status.mood]}</p>
      </div>
      {status.availableHrs && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {status.availableHrs}h available today
        </div>
      )}
      {status.appointments && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {status.appointments}
        </div>
      )}
      {status.blockers && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <WarningIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Blocker: {status.blockers}
        </div>
      )}
    </div>
  )
}

export default function MorningCheckIn({ onStatusReady }) {
  const [status, setStatus]         = useState(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getTodayStatus()
      .then((s) => {
        setStatus(s)
        if (s) onStatusReady?.(s)
      })
      .catch((err) => {
        setError(err.message)
        setStatus(null)
      })
  }, [onStatusReady])

  async function handleSubmit(formData) {
    setSubmitting(true)
    try {
      const saved = await submitDailyStatus(formData)
      setStatus(saved)
      onStatusReady?.(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading   = status === undefined
  const isSubmitted = status !== null && status !== undefined

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <SunIcon className="w-5 h-5 text-amber-500 shrink-0" />
        <h2 className="text-base font-bold text-slate-900">Morning Check-in</h2>
        {isSubmitted && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            <CheckCircleIcon className="w-3 h-3" />
            Done
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm text-slate-400">Loading…</p>}

      {!isLoading && error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!isLoading && !error && (
        isSubmitted
          ? <CheckInSummary status={status} />
          : <CheckInForm onSubmit={handleSubmit} submitting={submitting} />
      )}
    </section>
  )
}
