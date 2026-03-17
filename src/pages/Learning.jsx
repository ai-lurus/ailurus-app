import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getLearningPaths, updateLearningTopic } from '../api/learning.js'
import Layout from '../components/Layout.jsx'
import { ChevronDownIcon, ChevronUpIcon, ArrowLeftIcon, SparklesIcon } from '../components/Icons.jsx'

const STATUS_STYLES = {
  pending:     'bg-slate-100 text-slate-500',
  in_progress: 'bg-blue-50 text-blue-600 border border-blue-100',
  completed:   'bg-emerald-50 text-emerald-600 border border-emerald-100',
}

const STATUS_LABELS = {
  pending:     'Pending',
  in_progress: 'In Progress',
  completed:   'Completed',
}

function ResourceIcon({ type }) {
  switch (type) {
    case 'video':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      )
    case 'course':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      )
    case 'practice':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      )
    default: // article
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      )
  }
}

function ProgressBar({ pct }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-1.5 bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-400 w-9 text-right">{pct}%</span>
    </div>
  )
}

function TopicRow({ topic, onStatusChange, updating }) {
  const nextStatus = {
    pending:     'in_progress',
    in_progress: 'completed',
    completed:   'pending',
  }

  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
        <ResourceIcon type={topic.resourceType} />
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{topic.title}</p>
        {topic.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topic.description}</p>
        )}
        {topic.resourceUrl && (
          <a
            href={topic.resourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-600 hover:underline mt-0.5 block truncate"
          >
            {topic.resourceUrl}
          </a>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[topic.status]}`}>
          {STATUS_LABELS[topic.status]}
        </span>
        <button
          onClick={() => onStatusChange(topic.id, nextStatus[topic.status])}
          disabled={updating === topic.id}
          className="text-xs text-indigo-600 hover:bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          title="Cycle status"
        >
          {updating === topic.id ? '…' : '↻'}
        </button>
      </div>
    </div>
  )
}

function PathCard({ path, onTopicUpdate, updating }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">{path.title}</h3>
              {path.generatedByAI && (
                <span className="text-xs bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  AI Generated
                </span>
              )}
              {path.careerPath && (
                <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {path.careerPath}
                </span>
              )}
            </div>
            {path.description && (
              <p className="text-xs text-slate-500 mt-1">{path.description}</p>
            )}
          </div>
          {expanded
            ? <ChevronUpIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            : <ChevronDownIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          }
        </div>

        <div className="mt-3">
          <ProgressBar pct={path.progressPct} />
        </div>

        <p className="text-xs text-slate-400 mt-2">
          {path.topics.length} topics · {path.topics.filter((t) => t.status === 'completed').length} completed
        </p>
      </div>

      {expanded && (
        <div className="border-t border-slate-100">
          {path.topics.length === 0 ? (
            <p className="text-sm text-slate-400 px-5 py-4">No topics yet.</p>
          ) : (
            path.topics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                onStatusChange={onTopicUpdate}
                updating={updating}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Learning() {
  const { user, loading } = useAuth()
  const navigate          = useNavigate()
  const [paths, setPaths]       = useState([])
  const [fetching, setFetching] = useState(true)
  const [error, setError]       = useState(null)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'developer')) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    getLearningPaths()
      .then(setPaths)
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false))
  }, [user])

  async function handleTopicStatusChange(topicId, newStatus) {
    setUpdating(topicId)
    try {
      const updated = await updateLearningTopic(topicId, { status: newStatus })
      setPaths((prev) =>
        prev.map((path) => {
          const topicIdx = path.topics.findIndex((t) => t.id === topicId)
          if (topicIdx === -1) return path
          const newTopics = path.topics.map((t) =>
            t.id === topicId ? { ...t, ...updated } : t
          )
          const completed = newTopics.filter((t) => t.status === 'completed').length
          const progressPct = newTopics.length === 0 ? 0 : Math.round((completed / newTopics.length) * 100)
          return { ...path, topics: newTopics, progressPct }
        })
      )
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  if (loading || fetching) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40 text-slate-400 text-sm">Loading…</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-8 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-3 transition-colors cursor-pointer"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to home
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Learning & Growth</h1>
          <p className="text-slate-500 mt-1 text-sm">Your career path and study plan.</p>
        </div>

        {/* Paths */}
        {paths.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="text-slate-800 font-semibold">No learning paths yet</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
              Ask the AI assistant on your home page to generate a plan, or wait for your admin to assign one.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Go to AI Assistant →
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {paths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onTopicUpdate={handleTopicStatusChange}
                updating={updating}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
