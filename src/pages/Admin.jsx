import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Layout from '../components/Layout.jsx'
import ProjectsTab from '../components/admin/ProjectsTab.jsx'
import TeamTab from '../components/admin/TeamTab.jsx'
import BacklogTab from '../components/admin/BacklogTab.jsx'
import ReportsTab from '../components/admin/ReportsTab.jsx'
import LearningTab from '../components/admin/LearningTab.jsx'
import ReviewsTab from '../components/admin/ReviewsTab.jsx'

const TABS = [
  { id: 'projects', label: 'Projects' },
  { id: 'team',     label: 'Team Management' },
  { id: 'backlog',  label: 'Backlog' },
  { id: 'reports',  label: 'Reports' },
  { id: 'reviews',  label: 'Code Reviews' },
  { id: 'learning', label: 'Learning' },
]

const ALLOWED_ROLES = ['admin', 'ceo']

export default function Admin() {
  const { user, loading } = useAuth()
  const navigate          = useNavigate()
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => {
    if (!loading && (!user || !ALLOWED_ROLES.includes(user.role))) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-40 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Loading…</div>
      </Layout>
    )
  }

  if (!user || !ALLOWED_ROLES.includes(user.role)) return null

  return (
    <Layout>
      <div className="px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>Admin Panel</h1>
          <p className="mt-1 text-sm" style={{ color: 'hsl(224, 20%, 55%)' }}>Manage projects, teams, backlog, and reports</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-0" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px cursor-pointer ${
                activeTab === tab.id ? '' : ''
              }`}
              style={
                activeTab === tab.id
                  ? {
                      backgroundColor: 'hsl(224, 25%, 16%)',
                      border: '1px solid hsl(224, 30%, 18%)',
                      borderBottom: '1px solid hsl(224, 25%, 16%)',
                      color: 'hsl(244, 100%, 69%)',
                    }
                  : {
                      color: 'hsl(224, 20%, 55%)',
                      backgroundColor: 'transparent',
                    }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-b-xl rounded-tr-xl p-6" style={{ backgroundColor: 'hsl(224, 30%, 14%)', border: '1px solid hsl(224, 30%, 18%)' }}>
          {activeTab === 'projects' && <ProjectsTab />}
          {activeTab === 'team'     && <TeamTab />}
          {activeTab === 'backlog'  && <BacklogTab />}
          {activeTab === 'reports'  && <ReportsTab />}
          {activeTab === 'reviews'  && <ReviewsTab />}
          {activeTab === 'learning' && <LearningTab />}
        </div>
      </div>
    </Layout>
  )
}
