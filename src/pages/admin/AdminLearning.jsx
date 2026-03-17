import { useState } from 'react'
import Layout from '../../components/Layout.jsx'
import LearningTab from '../../components/admin/LearningTab.jsx'
import BattlesAdminPanel from '../../components/admin/BattlesAdminPanel.jsx'

const TABS = [
  { key: 'paths',   label: 'Training Paths' },
  { key: 'battles', label: 'Learning Battles' },
]

export default function AdminLearning() {
  const [tab, setTab] = useState('paths')

  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Learning</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage learning paths and resources for the team.</p>
        </div>

        {/* Top-level tab bar */}
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'paths'   && <LearningTab />}
        {tab === 'battles' && <BattlesAdminPanel />}
      </div>
    </Layout>
  )
}
