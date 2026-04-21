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
        {/* Top-level tab bar */}
        <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors`}
              style={
                tab === t.key
                  ? {
                      backgroundColor: 'hsl(244, 100%, 15%)',
                      color: 'hsl(244, 100%, 69%)',
                      borderBottom: '2px solid hsl(244, 100%, 69%)',
                    }
                  : {
                      color: 'hsl(224, 20%, 55%)',
                      backgroundColor: 'transparent',
                    }
              }
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
