import TopicNode from './TopicNode.jsx'

export default function ProgressMap({ topics, onTopicClick }) {
  if (!topics || topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-gray-200 rounded-2xl">
        <p className="text-sm text-gray-400">No topics assigned yet.</p>
      </div>
    )
  }

  // Determine status of each topic based on completion of previous
  function getTopicStatus(topic, index) {
    if (index === 0) {
      const allDone = (topic.battles ?? []).every((b) => b.progress?.completed)
      return allDone ? 'completed' : 'available'
    }

    const prev = topics[index - 1]
    const prevCompleted = (prev.battles ?? []).length === 5
      && (prev.battles ?? []).every((b) => b.progress?.completed)

    if (!prevCompleted) return 'locked'

    const allDone = (topic.battles ?? []).every((b) => b.progress?.completed)
    return allDone ? 'completed' : 'available'
  }

  const currentIndex = topics.findIndex((t, i) => getTopicStatus(t, i) === 'available')

  return (
    <div className="overflow-x-auto pb-4">
      <div className="relative flex items-center gap-0 min-w-max px-6 py-8">
        {topics.map((topic, index) => {
          const status = getTopicStatus(topic, index)
          const isActive = index === currentIndex
          const isLast = index === topics.length - 1

          return (
            <div key={topic.id} className="flex items-center">
              {/* Connector line before node (except first) */}
              {index > 0 && (
                <Connector
                  completed={getTopicStatus(topics[index - 1], index - 1) === 'completed'}
                />
              )}

              {/* Node with vertical offset for wave effect */}
              <div
                className="relative"
                style={{
                  transform: `translateY(${index % 2 === 0 ? '0px' : '20px'})`,
                  transition: 'transform 0.2s',
                }}
              >
                <TopicNode
                  topic={topic}
                  status={status}
                  isActive={isActive}
                  onClick={onTopicClick}
                />
              </div>

              {/* Connector line after last node — none */}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Connector({ completed }) {
  return (
    <div className="relative w-16 flex items-center shrink-0">
      <div
        className={`h-1 w-full rounded-full transition-colors ${
          completed ? 'bg-green-400' : 'bg-gray-200'
        }`}
      />
      {completed && (
        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
      )}
    </div>
  )
}
