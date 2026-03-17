const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function HpBar({ hp, maxHp = 100, color = 'bg-red-500', label }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const barColor = pct > 50 ? color : pct > 25 ? 'bg-yellow-500' : 'bg-red-600'

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span className="font-medium">{label}</span>
          <span>{Math.ceil(hp)}/{maxHp}</span>
        </div>
      )}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function EnemyDisplay({ enemy, hp, isShaking = false }) {
  const enemyUrl = enemy?.filename
    ? `${API_BASE}/public/enemies/${enemy.filename}`
    : null

  return (
    <div className="flex flex-col items-center gap-3">
      <HpBar hp={hp} label="Enemy HP" color="bg-red-500" />
      <div
        className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-100 flex items-center justify-center overflow-hidden transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {enemyUrl ? (
          <img
            src={enemyUrl}
            alt="Enemy"
            className="w-full h-full object-contain p-2"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <span className="text-6xl">👾</span>
        )}
      </div>
      <p className="text-xs text-gray-400 font-medium">ENEMY</p>
    </div>
  )
}

export { HpBar }
