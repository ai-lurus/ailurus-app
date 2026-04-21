import { useEffect, useState } from 'react'
import { getTodayStatus, submitEodStatus } from '../api/dailyStatus.js'
import { MoonIcon, WarningIcon, CheckCircleIcon } from './Icons.jsx'

const MOODS = [
  { value: 'great',      label: 'Great',     dot: 'bg-emerald-400', active: 'border-emerald-400 bg-emerald-500/20 text-emerald-400' },
  { value: 'good',       label: 'Good',      dot: 'bg-sky-400',     active: 'border-sky-400 bg-sky-500/20 text-sky-400' },
  { value: 'okay',       label: 'Okay',      dot: 'bg-amber-400',   active: 'border-amber-400 bg-amber-500/20 text-amber-400' },
  { value: 'struggling', label: 'Rough day', dot: 'bg-rose-400',    active: 'border-rose-400 bg-rose-500/20 text-rose-400' },
]

const MOOD_SUMMARY = {
  great:      'Ended on a high note — great work today!',
  good:       'Solid day. You made things happen.',
  okay:       'Got through it. Every day counts.',
  struggling: 'Tough day — rest up and come back stronger.',
}

function getLocalDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function EodForm({ onSubmit, submitting }) {
  const today = getLocalDate()
  const [eodMood, setEodMood]           = useState('')
  const [eodCompleted, setEodCompleted] = useState('')
  const [eodBlockers, setEodBlockers]   = useState('')
  const [eodNotes, setEodNotes]         = useState('')
  const [error, setError]               = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    if (!eodMood) { setError('Please pick a mood before continuing.'); return }
    setError(null)
    onSubmit({
      date: today,
      eodMood,
      eodCompleted: eodCompleted || null,
      eodBlockers: eodBlockers || null,
      eodNotes: eodNotes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* EOD Mood */}
      <div>
        <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: 'hsl(224, 20%, 55%)' }}>
          How did your day go?
        </label>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((m) => {
            const isActive = eodMood === m.value
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setEodMood(m.value)}
                className={`flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer ${
                  isActive ? m.active : 'border-[hsl(224,30%,18%)] bg-[hsl(224,35%,10%)] text-[hsl(224,20%,55%)]'
                }`}
                style={isActive ? {} : {
                  borderColor: 'hsl(224, 30%, 18%)',
                  backgroundColor: 'hsl(224, 25%, 16%)',
                  color: 'hsl(224, 20%, 55%)',
                }}
              >
                <span className={`w-3 h-3 rounded-full ${m.dot}`} />
                {m.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Completed */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(224, 20%, 55%)' }}>
          What did you get done?
        </label>
        <textarea
          rows={2}
          value={eodCompleted}
          onChange={(e) => setEodCompleted(e.target.value)}
          placeholder="Tasks completed, PRs merged, designs finished…"
          className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition-colors"
          style={{
            backgroundColor: 'hsl(224, 25%, 16%)',
            border: '1px solid hsl(224, 30%, 18%)',
            color: 'hsl(224, 40%, 95%)',
            placeholderColor: 'hsl(224, 20%, 55%)',
            focusRingColor: 'hsl(51, 100%, 50%)',
          }}
        />
      </div>

      {/* Blockers */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(224, 20%, 55%)' }}>
          Any blockers hit today?
        </label>
        <textarea
          rows={2}
          value={eodBlockers}
          onChange={(e) => setEodBlockers(e.target.value)}
          placeholder="Things that slowed you down or remain unresolved…"
          className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition-colors"
          style={{
            backgroundColor: 'hsl(224, 25%, 16%)',
            border: '1px solid hsl(224, 30%, 18%)',
            color: 'hsl(224, 40%, 95%)',
            placeholderColor: 'hsl(224, 20%, 55%)',
            focusRingColor: 'hsl(51, 100%, 50%)',
          }}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(224, 20%, 55%)' }}>
          Notes <span className="normal-case font-normal" style={{ color: 'hsl(224, 20%, 55%)' }}>(optional)</span>
        </label>
        <textarea
          rows={2}
          value={eodNotes}
          onChange={(e) => setEodNotes(e.target.value)}
          placeholder="Anything else worth noting…"
          className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 transition-colors"
          style={{
            backgroundColor: 'hsl(224, 25%, 16%)',
            border: '1px solid hsl(224, 30%, 18%)',
            color: 'hsl(224, 40%, 95%)',
            placeholderColor: 'hsl(224, 20%, 55%)',
            focusRingColor: 'hsl(51, 100%, 50%)',
          }}
        />
      </div>

      {error && <p className="text-sm" style={{ color: 'hsl(0, 100%, 60%)' }}>{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2.5 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
        style={{ backgroundColor: 'hsl(259, 100%, 69%)' }}
      >
        {submitting ? 'Saving…' : 'Wrap up my day →'}
      </button>
    </form>
  )
}

function EodSummary({ status }) {
  const mood = MOODS.find((m) => m.value === status.eodMood)
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${mood?.dot ?? 'bg-slate-400'}`} />
        <p className="font-medium text-sm" style={{ color: 'hsl(224, 40%, 95%)' }}>{MOOD_SUMMARY[status.eodMood]}</p>
      </div>
      {status.eodCompleted && (
        <div className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>
          <span className="font-medium" style={{ color: 'hsl(224, 30%, 70%)' }}>Done: </span>
          {status.eodCompleted}
        </div>
      )}
      {status.eodBlockers && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <WarningIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          Blocker: {status.eodBlockers}
        </div>
      )}
      {status.eodNotes && (
        <div className="text-sm italic" style={{ color: 'hsl(224, 20%, 55%)' }}>{status.eodNotes}</div>
      )}
    </div>
  )
}

export default function EodCheckIn({ morningStatus }) {
  const [status, setStatus]         = useState(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getTodayStatus()
      .then(setStatus)
      .catch((err) => {
        setError(err.message)
        setStatus(null)
      })
  }, [])

  async function handleSubmit(formData) {
    setSubmitting(true)
    try {
      const saved = await submitEodStatus(formData)
      setStatus(saved)
    } catch (err) {
      setError(err.response?.data?.error ?? err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Don't render until morning check-in is confirmed done
  if (!morningStatus) return null

  const isLoading   = status === undefined
  const isSubmitted = status?.eodSubmittedAt != null

  return (
    <section className="rounded-2xl p-6" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
      <div className="flex items-center gap-2 mb-5">
        <MoonIcon className="w-5 h-5" style={{ color: 'hsl(259, 100%, 69%)' }} />
        <h2 className="text-base font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>End-of-Day Check-in</h2>
        {isSubmitted && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsl(120, 100%, 15%)', color: 'hsl(120, 100%, 50%)' }}>
            <CheckCircleIcon className="w-3 h-3" />
            Done
          </span>
        )}
      </div>

      {isLoading && <p className="text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</p>}

      {!isLoading && error && (
        <p className="text-sm" style={{ color: 'hsl(0, 100%, 60%)' }}>{error}</p>
      )}

      {!isLoading && !error && (
        isSubmitted
          ? <EodSummary status={status} />
          : <EodForm onSubmit={handleSubmit} submitting={submitting} />
      )}
    </section>
  )
}
