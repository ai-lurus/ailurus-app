import { useReducer, useCallback } from 'react'
import {
  initBattleState,
  processAnswer,
  advanceQuestion,
} from '../utils/battleEngine.js'

function reducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return initBattleState(action.questions, action.enemy)
    case 'SELECT_ANSWER':
      if (state.phase !== 'question') return state
      return processAnswer(state, action.index)
    case 'NEXT_QUESTION':
      if (state.phase !== 'explanation') return state
      return advanceQuestion(state)
    default:
      return state
  }
}

export function useBattle() {
  const [state, dispatch] = useReducer(reducer, null)

  const initBattle = useCallback((questions, enemy) => {
    dispatch({ type: 'INIT', questions, enemy })
  }, [])

  const selectAnswer = useCallback((index) => {
    dispatch({ type: 'SELECT_ANSWER', index })
  }, [])

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' })
  }, [])

  return { state, initBattle, selectAnswer, nextQuestion }
}
