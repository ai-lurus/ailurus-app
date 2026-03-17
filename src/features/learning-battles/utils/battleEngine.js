/**
 * Battle mechanics and calculations.
 */

export const MAX_HP = 100
export const QUESTIONS_PER_BATTLE = 12
export const WIN_THRESHOLD = 10 // correct answers needed to win (≥ 10/12 = ≥ 80%)

export const BASE_DAMAGE_MIN = 6
export const BASE_DAMAGE_MAX = 15
export const CRIT_CHANCE = 0.20        // 20% chance of critical hit
export const DODGE_CHANCE = 0.15       // 15% chance to dodge (half damage on wrong)
export const STREAK_CRIT_THRESHOLD = 3 // 3 correct in a row = guaranteed crit

function randomDamage() {
  return BASE_DAMAGE_MIN + Math.random() * (BASE_DAMAGE_MAX - BASE_DAMAGE_MIN)
}

/**
 * Calculate HP loss for attacker and defender.
 * Returns { playerHpLoss, enemyHpLoss, isCritical, isDodged, damage }
 */
export function calculateHit(isCorrect, streak = 0) {
  const base = randomDamage()

  if (isCorrect) {
    const isCritical = streak >= STREAK_CRIT_THRESHOLD || Math.random() < CRIT_CHANCE
    const damage = isCritical ? base * 2 : base
    return { playerHpLoss: 0, enemyHpLoss: damage, isCritical, isDodged: false, damage }
  }

  const isDodged = Math.random() < DODGE_CHANCE
  const damage = isDodged ? base * 0.5 : base
  return { playerHpLoss: damage, enemyHpLoss: 0, isCritical: false, isDodged, damage }
}

/**
 * Determine battle outcome based on correct count (used when all questions answered).
 * Returns 'win' | 'lose'
 */
export function getBattleResult(correctCount) {
  return correctCount >= WIN_THRESHOLD ? 'win' : 'lose'
}

/**
 * Clamp HP to [0, MAX_HP].
 */
export function clampHp(hp) {
  return Math.max(0, Math.min(MAX_HP, hp))
}

/**
 * Pick a random enemy from the enemy list.
 */
export function pickRandomEnemy(enemies) {
  if (!enemies || enemies.length === 0) return null
  return enemies[Math.floor(Math.random() * enemies.length)]
}

/**
 * Get initial battle state.
 */
export function initBattleState(questions, enemy) {
  return {
    questions,
    currentQuestionIndex: 0,
    playerHp: MAX_HP,
    enemyHp: MAX_HP,
    correctCount: 0,
    streak: 0,
    answered: [],       // array of { questionIndex, selectedIndex, isCorrect }
    lastEvent: null,    // { isCritical, isDodged, damage, isCorrect }
    showExplanation: false,
    selectedIndex: null,
    enemy,
    phase: 'question',  // 'question' | 'explanation' | 'result'
    result: null,       // 'win' | 'lose' | null
  }
}

/**
 * Process an answer selection. Returns updated state (immutable).
 */
export function processAnswer(state, selectedIndex) {
  const q = state.questions[state.currentQuestionIndex]
  const isCorrect = selectedIndex === q.correctIndex
  const { playerHpLoss, enemyHpLoss, isCritical, isDodged, damage } = calculateHit(isCorrect, state.streak)

  const newStreak = isCorrect ? state.streak + 1 : 0
  const newPlayerHp = clampHp(state.playerHp - playerHpLoss)
  const newEnemyHp  = clampHp(state.enemyHp  - enemyHpLoss)
  const newCorrect  = state.correctCount + (isCorrect ? 1 : 0)
  const newAnswered = [
    ...state.answered,
    { questionIndex: state.currentQuestionIndex, selectedIndex, isCorrect },
  ]

  return {
    ...state,
    playerHp: newPlayerHp,
    enemyHp: newEnemyHp,
    correctCount: newCorrect,
    streak: newStreak,
    answered: newAnswered,
    lastEvent: { isCritical, isDodged, damage, isCorrect },
    selectedIndex,
    showExplanation: true,
    phase: 'explanation',
  }
}

/**
 * Advance to next question or finish battle. Returns updated state.
 * Checks HP-based early finish before checking question count.
 */
export function advanceQuestion(state) {
  // Early finish: someone reached 0 HP
  if (state.playerHp <= 0) {
    return { ...state, phase: 'result', result: 'lose', showExplanation: false, lastEvent: null }
  }
  if (state.enemyHp <= 0) {
    return { ...state, phase: 'result', result: 'win', showExplanation: false, lastEvent: null }
  }

  const nextIndex = state.currentQuestionIndex + 1
  const isDone = nextIndex >= state.questions.length

  if (isDone) {
    const result = getBattleResult(state.correctCount)
    return { ...state, phase: 'result', result, showExplanation: false, lastEvent: null }
  }

  return {
    ...state,
    currentQuestionIndex: nextIndex,
    selectedIndex: null,
    showExplanation: false,
    phase: 'question',
    lastEvent: null,
  }
}
