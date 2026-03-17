export default function TopicNode({ topic, status, battleProgress, isActive, onClick }) {
  // status: 'locked' | 'available' | 'completed'
  const battles = topic.battles ?? []
  const completedBattles = battles.filter((b) => b.progress?.completed).length
  const totalBattles = battles.length

  const bgColor = {
    locked:    'bg-gray-100 border-gray-200',
    available: 'bg-white border-indigo-300 shadow-md shadow-indigo-100',
    completed: 'bg-green-50 border-green-400 shadow-md shadow-green-100',
  }[status]

  const iconBg = {
    locked:    'bg-gray-200',
    available: isActive ? 'bg-indigo-100 animate-pulse' : 'bg-indigo-50',
    completed: 'bg-green-100',
  }[status]

  const textColor = {
    locked:    'text-gray-400',
    available: 'text-gray-800',
    completed: 'text-gray-800',
  }[status]

  return (
    <button
      onClick={() => status !== 'locked' && onClick(topic)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-200 w-28 ${bgColor} ${
        status === 'locked' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:scale-105'
      }`}
    >
      {/* Badge */}
      {status === 'completed' && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
          ✓
        </span>
      )}
      {status === 'locked' && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-gray-400 text-white text-xs rounded-full flex items-center justify-center">
          🔒
        </span>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-xl`}>
        {status === 'locked' ? '🔒' : topic.icon || '📚'}
      </div>

      {/* Title */}
      <p className={`text-xs font-semibold text-center leading-tight ${textColor}`}>
        {topic.title}
      </p>

      {/* Battle progress dots */}
      {status !== 'locked' && totalBattles > 0 && (
        <div className="flex gap-1">
          {battles.map((b, i) => (
            <div
              key={b.id ?? i}
              className={`w-2 h-2 rounded-full ${
                b.progress?.completed ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}

      {status !== 'locked' && totalBattles > 0 && (
        <p className="text-xs text-gray-400">{completedBattles}/{totalBattles}</p>
      )}
    </button>
  )
}
