import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../../components/Layout.jsx'
import ProgressMap from '../components/ProgressMap.jsx'
import AvatarBuilder from '../components/AvatarBuilder.jsx'
import AvatarSVG from '../components/AvatarSVG.jsx'
import { getMyPaths } from '../../../api/battles.js'
import { useAvatarConfig } from '../hooks/useAvatarConfig.js'

export default function LearningMapPage() {
  const navigate = useNavigate()
  const [paths, setPaths] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false)
  const [selectedPath, setSelectedPath] = useState(null)
  const { config: avatarConfig, loading: avatarLoading } = useAvatarConfig()

  useEffect(() => {
    getMyPaths()
      .then((data) => {
        setPaths(data)
        if (data.length > 0) setSelectedPath(data[0])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleTopicClick(topic) {
    navigate(`/learning/battles/${topic.id}`)
  }

  if (loading || avatarLoading) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Learning Battles</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Defeat enemies by answering questions. Master topics to advance the map.
            </p>
          </div>
          <button
            onClick={() => setShowAvatarBuilder((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
          >
            <AvatarSVG config={avatarConfig} size={28} />
            Edit Avatar
          </button>
        </div>

        {/* Avatar Builder panel */}
        {showAvatarBuilder && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Avatar Builder</h2>
              <button
                onClick={() => setShowAvatarBuilder(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ×
              </button>
            </div>
            <AvatarBuilder onSaved={() => setShowAvatarBuilder(false)} />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        )}

        {/* Path selector if multiple paths */}
        {paths.length > 1 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-medium text-gray-500">Learning Path:</span>
            {paths.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPath(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selectedPath?.id === p.id
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* No paths state */}
        {paths.length === 0 && (
          <div className="border border-dashed border-gray-200 rounded-2xl py-16 text-center">
            <div className="text-5xl mb-3">⚔️</div>
            <h3 className="text-gray-700 font-semibold mb-1">No Battle Path Assigned</h3>
            <p className="text-sm text-gray-400">Ask your admin to assign you a learning battle path.</p>
          </div>
        )}

        {/* Map */}
        {selectedPath && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-800">{selectedPath.title}</h2>
              <span className="text-xs text-gray-400">
                {selectedPath.topics?.length ?? 0} topics
              </span>
            </div>
            <PathStats topics={selectedPath.topics ?? []} />
            <div className="mt-4">
              <ProgressMap topics={selectedPath.topics ?? []} onTopicClick={handleTopicClick} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

function PathStats({ topics }) {
  const total = topics.reduce((sum, t) => sum + (t.battles?.length ?? 0), 0)
  const completed = topics.reduce(
    (sum, t) => sum + (t.battles?.filter((b) => b.progress?.completed).length ?? 0),
    0
  )
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 shrink-0">{completed}/{total} battles · {pct}%</span>
    </div>
  )
}
