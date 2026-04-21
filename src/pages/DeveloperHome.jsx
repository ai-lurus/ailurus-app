import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Layout from '../components/Layout.jsx'
import MorningCheckIn from '../components/MorningCheckIn.jsx'
import EodCheckIn from '../components/EodCheckIn.jsx'
import MyTasks from '../components/MyTasks.jsx'
import CodeReviews from '../components/CodeReviews.jsx'
import AgentChat from '../components/AgentChat.jsx'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function today() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function DeveloperHome() {
  const { user, loading, error } = useAuth()
  const navigate = useNavigate()
  const [dailyStatus, setDailyStatus] = useState(null)

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40">
          <p className="text-sm" style={{ color: 'hsl(0, 100%, 60%)' }}>{error}</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'hsl(224, 20%, 55%)' }}>{today()}</p>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>
            {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Here's what's on your plate today.</p>
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => navigate('/learning')}
              className="text-sm font-medium flex items-center gap-1 transition-colors cursor-pointer"
              style={{ color: 'hsl(244, 100%, 69%)' }}
            >
              Your career plan →
            </button>
            <button
              onClick={() => navigate('/learning/battles')}
              className="text-sm font-medium flex items-center gap-1 transition-colors cursor-pointer"
              style={{ color: 'hsl(51, 100%, 50%)' }}
            >
              ⚔️ Learning Battles →
            </button>
          </div>
        </div>

        {/* Top row: check-in (left) + tasks (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <MorningCheckIn onStatusReady={setDailyStatus} />
          <MyTasks userId={user?.id} />
        </div>

        {/* Code Reviews — tasks from other devs awaiting review */}
        <div className="mb-6">
          <CodeReviews userId={user?.id} />
        </div>

        {/* EOD check-in — appears once morning check-in is done */}
        {dailyStatus && (
          <div className="mb-6">
            <EodCheckIn morningStatus={dailyStatus} />
          </div>
        )}

        {/* AI Chat — full width */}
        <AgentChat user={user} dailyStatus={dailyStatus} />
      </div>
    </Layout>
  )
}
