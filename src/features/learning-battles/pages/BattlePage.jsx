import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../../../components/Layout.jsx'
import BattleScreen from '../components/BattleScreen.jsx'
import { getTopicDetail, getEnemies, saveBattleProgress } from '../../../api/battles.js'
import { useAvatarConfig } from '../hooks/useAvatarConfig.js'

export default function BattlePage() {
  const { topicId } = useParams()
  const navigate = useNavigate()

  const [topic, setTopic] = useState(null)
  const [enemies, setEnemies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeBattle, setActiveBattle] = useState(null)
  const [activeEnemy, setActiveEnemy] = useState(null)

  const { config: avatarConfig, loading: avatarLoading } = useAvatarConfig()

  useEffect(() => {
    Promise.all([getTopicDetail(topicId), getEnemies()])
      .then(([topicData, enemiesData]) => {
        setTopic(topicData)
        setEnemies(enemiesData)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [topicId])

  function pickRandomEnemy(enemyList) {
    if (!enemyList || enemyList.length === 0) return null
    return enemyList[Math.floor(Math.random() * enemyList.length)]
  }

  function handleSelectBattle(battle) {
    setActiveBattle(battle)
    setActiveEnemy(pickRandomEnemy(enemies))
  }

  const handleBattleEnd = useCallback(
    async (result, correctCount, enemy) => {
      if (!activeBattle) return
      try {
        await saveBattleProgress({
          battleId: activeBattle.id,
          topicId,
          score: correctCount,
          completed: result === 'win',
          enemyImageId: enemy?.id ?? null,
        })
        // Refresh topic to get updated progress
        const updated = await getTopicDetail(topicId)
        setTopic(updated)
      } catch (e) {
        console.error('Failed to save progress:', e)
      }
      setActiveBattle(null)
      setActiveEnemy(null)
    },
    [activeBattle, topicId]
  )

  if (loading || avatarLoading) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">{error}</p>
        </div>
      </Layout>
    )
  }

  if (activeBattle) {
    return (
      <Layout>
        <div className="px-8 py-8">
          <button
            onClick={() => { setActiveBattle(null); setActiveEnemy(null) }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
          >
            ← Back to topic
          </button>
          <BattleScreen
            battle={activeBattle}
            enemy={activeEnemy}
            avatarConfig={avatarConfig}
            onBattleEnd={handleBattleEnd}
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-8 py-8 space-y-6 max-w-2xl mx-auto">
        {/* Back nav */}
        <button
          onClick={() => navigate('/learning/battles')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          ← Learning Map
        </button>

        {/* Topic header */}
        {topic && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl shrink-0">
                {topic.icon || '📚'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{topic.title}</h1>
                {topic.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{topic.description}</p>
                )}
              </div>
            </div>

            <TopicProgressBar battles={topic.battles ?? []} />
          </div>
        )}

        {/* Battle list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Battles</h2>
          {topic?.battles?.length === 0 && (
            <p className="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">
              No battles configured for this topic yet.
            </p>
          )}
          {topic?.battles?.map((battle, index) => (
            <BattleCard
              key={battle.id}
              battle={battle}
              index={index}
              allBattles={topic.battles}
              onStart={handleSelectBattle}
            />
          ))}
        </div>
      </div>
    </Layout>
  )
}

function TopicProgressBar({ battles }) {
  const total = battles.length
  const completed = battles.filter((b) => b.progress?.completed).length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 shrink-0">{completed}/{total} · {pct}%</span>
      </div>
    </div>
  )
}

function BattleCard({ battle, index, allBattles, onStart }) {
  const completed = battle.progress?.completed ?? false
  const correctCount = battle.progress?.correctCount ?? null
  const totalQuestions = battle.questionsJson?.length ?? 12

  // A battle is available if it's the first, or the previous one is completed
  const isLocked = index > 0 && !(allBattles[index - 1]?.progress?.completed)

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all ${
        completed
          ? 'bg-green-50 border-green-200'
          : isLocked
          ? 'bg-gray-50 border-gray-200 opacity-60'
          : 'bg-white border-indigo-200 shadow-sm shadow-indigo-50'
      }`}
    >
      {/* Index badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
          completed
            ? 'bg-green-500 text-white'
            : isLocked
            ? 'bg-gray-300 text-gray-500'
            : 'bg-indigo-100 text-indigo-700'
        }`}
      >
        {completed ? '✓' : isLocked ? '🔒' : index + 1}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
          {battle.title}
        </p>
        {completed && correctCount !== null && (
          <p className="text-xs text-green-600 mt-0.5">
            Best: {correctCount}/{totalQuestions} correct
          </p>
        )}
        {!completed && !isLocked && (
          <p className="text-xs text-gray-400 mt-0.5">{totalQuestions} questions</p>
        )}
      </div>

      {/* Action */}
      {!isLocked && (
        <button
          onClick={() => onStart(battle)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
            completed
              ? 'bg-white border border-green-300 text-green-700 hover:bg-green-50'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {completed ? 'Replay' : 'Start'}
        </button>
      )}
    </div>
  )
}
