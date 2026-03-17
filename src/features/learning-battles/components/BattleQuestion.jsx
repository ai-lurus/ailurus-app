export default function BattleQuestion({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  onSelect,
  showExplanation,
  onNext,
  lastEvent,
}) {
  if (!question) return null

  const isCorrect = selectedIndex === question.correctIndex

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-400">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-1.5 bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question text */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-800 leading-relaxed">{question.text}</p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options.map((option, i) => {
          let cls = 'w-full px-4 py-3 text-left text-sm rounded-xl border-2 transition-all duration-150 font-medium '

          if (selectedIndex === null) {
            cls += 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700 cursor-pointer'
          } else if (i === question.correctIndex) {
            cls += 'bg-green-50 border-green-500 text-green-800 cursor-default'
          } else if (i === selectedIndex) {
            cls += 'bg-red-50 border-red-500 text-red-800 cursor-default'
          } else {
            cls += 'bg-gray-50 border-gray-200 text-gray-400 cursor-default'
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => selectedIndex === null && onSelect(i)}
              disabled={selectedIndex !== null}
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </span>
            </button>
          )
        })}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className={`rounded-xl px-4 py-3 border ${
          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">
              {isCorrect ? (lastEvent?.isCritical ? '⚡' : '✅') : (lastEvent?.isDodged ? '🛡️' : '❌')}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`text-xs font-semibold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {isCorrect
                    ? lastEvent?.isCritical ? 'Critical Hit!' : 'Correct!'
                    : lastEvent?.isDodged ? 'Dodged! Half damage...' : 'Wrong!'}
                </p>
                {lastEvent && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    isCorrect
                      ? lastEvent.isCritical
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                        : 'bg-green-100 text-green-700'
                      : lastEvent.isDodged
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {isCorrect ? `−${Math.ceil(lastEvent.damage)} enemy HP` : `−${Math.ceil(lastEvent.damage)} your HP`}
                  </span>
                )}
              </div>
              {question.explanation && (
                <p className="text-xs text-gray-600 leading-relaxed">{question.explanation}</p>
              )}
            </div>
          </div>
          <button
            onClick={onNext}
            className="mt-3 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  )
}
