import { useEffect, useState } from 'react'
import { useBattle } from '../hooks/useBattle.js'
import AvatarSVG from './AvatarSVG.jsx'
import EnemyDisplay, { HpBar } from './EnemyDisplay.jsx'
import BattleQuestion from './BattleQuestion.jsx'
import { MAX_HP, STREAK_CRIT_THRESHOLD } from '../utils/battleEngine.js'

export default function BattleScreen({ battle, enemy, avatarConfig, onBattleEnd }) {
  const { state, initBattle, selectAnswer, nextQuestion } = useBattle()
  const [playerShaking, setPlayerShaking] = useState(false)
  const [enemyShaking, setEnemyShaking] = useState(false)
  const [critFlash, setCritFlash] = useState(false)
  const [dodgeFlash, setDodgeFlash] = useState(false)

  useEffect(() => {
    if (!battle?.questionsJson) return
    initBattle(battle.questionsJson, enemy)
  }, [battle, enemy, initBattle])

  useEffect(() => {
    if (!state || state.phase !== 'explanation') return

    const lastAnswer = state.answered[state.answered.length - 1]
    if (!lastAnswer) return

    if (lastAnswer.isCorrect) {
      setEnemyShaking(true)
      setTimeout(() => setEnemyShaking(false), 600)

      if (state.lastEvent?.isCritical) {
        setCritFlash(true)
        setTimeout(() => setCritFlash(false), 800)
      }
    } else {
      setPlayerShaking(true)
      setTimeout(() => setPlayerShaking(false), 600)

      if (state.lastEvent?.isDodged) {
        setDodgeFlash(true)
        setTimeout(() => setDodgeFlash(false), 800)
      }
    }
  }, [state?.answered?.length])

  if (!state) {
    return <p className="text-center text-sm text-gray-400 py-8">Loading battle…</p>
  }

  if (state.phase === 'result') {
    const won = state.result === 'win'
    return (
      <BattleResult
        won={won}
        correctCount={state.correctCount}
        totalQuestions={state.questions.length}
        playerHp={state.playerHp}
        enemyHp={state.enemyHp}
        onDone={() => onBattleEnd(state.result, state.correctCount, enemy)}
      />
    )
  }

  const currentQ = state.questions[state.currentQuestionIndex]
  const streakReady = state.streak >= STREAK_CRIT_THRESHOLD

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto relative">
      {/* Critical flash overlay */}
      {critFlash && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-10 flex items-center justify-center">
          <span className="text-yellow-400 text-4xl font-black drop-shadow-lg animate-bounce">
            ⚡ CRITICAL!
          </span>
        </div>
      )}
      {dodgeFlash && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-10 flex items-center justify-center">
          <span className="text-orange-400 text-4xl font-black drop-shadow-lg animate-bounce">
            🛡️ DODGED!
          </span>
        </div>
      )}

      {/* Battle header */}
      <div className="flex items-center justify-between bg-gray-900 rounded-2xl px-6 py-4">
        <p className="text-white font-bold text-sm">{battle.title}</p>
        <div className="flex items-center gap-3">
          {state.streak >= 2 && (
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              streakReady
                ? 'bg-yellow-400 text-yellow-900 animate-pulse'
                : 'bg-orange-500 text-white'
            }`}>
              {streakReady ? '⚡' : '🔥'} x{state.streak}
            </span>
          )}
          <span className="text-gray-400 text-xs">
            {state.currentQuestionIndex + 1}/{state.questions.length}
          </span>
        </div>
      </div>

      {/* Arena */}
      <div className="grid grid-cols-2 gap-6 items-end">
        {/* Player side */}
        <div className={`flex flex-col items-center gap-3 transition-transform ${playerShaking ? 'animate-shake' : ''}`}>
          <HpBar hp={state.playerHp} maxHp={MAX_HP} label="Your HP" color="bg-indigo-500" />
          <div className="w-28 h-36 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 flex items-center justify-center">
            <AvatarSVG config={avatarConfig} size={96} />
          </div>
          <p className="text-xs text-gray-400 font-medium">YOU</p>
        </div>

        {/* Enemy side */}
        <EnemyDisplay enemy={enemy} hp={state.enemyHp} isShaking={enemyShaking} />
      </div>

      {/* VS divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-lg font-black text-gray-300">VS</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Question */}
      <BattleQuestion
        question={currentQ}
        questionNumber={state.currentQuestionIndex + 1}
        totalQuestions={state.questions.length}
        selectedIndex={state.selectedIndex}
        onSelect={selectAnswer}
        showExplanation={state.showExplanation}
        onNext={nextQuestion}
        lastEvent={state.lastEvent}
      />
    </div>
  )
}

function BattleResult({ won, correctCount, totalQuestions, playerHp, enemyHp, onDone }) {
  const hpKO = won ? enemyHp <= 0 : playerHp <= 0
  const subtitle = won
    ? hpKO ? 'Enemy defeated! KO victory!' : 'Battle complete!'
    : hpKO ? 'You were knocked out!' : 'You need 10+ to win. Try again!'

  return (
    <div className="flex flex-col items-center gap-6 py-12 text-center">
      <div className="text-7xl">{won ? '🏆' : '💀'}</div>
      <div>
        <h2 className={`text-2xl font-black mb-1 ${won ? 'text-green-600' : 'text-red-600'}`}>
          {won ? 'Victory!' : 'Defeated!'}
        </h2>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
      <div className="w-full max-w-xs bg-gray-50 rounded-xl px-6 py-4 border border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Score</span>
          <span className="font-bold">{correctCount}/{totalQuestions}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>Accuracy</span>
          <span className="font-bold">{Math.round((correctCount / totalQuestions) * 100)}%</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>Your HP remaining</span>
          <span className="font-bold">{Math.ceil(playerHp)}</span>
        </div>
      </div>
      <button
        onClick={onDone}
        className={`px-8 py-3 text-white font-bold rounded-xl transition-colors ${
          won
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {won ? 'Continue' : 'Try Again'}
      </button>
    </div>
  )
}
