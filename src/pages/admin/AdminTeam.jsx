import Layout from '../../components/Layout.jsx'
import TeamTab from '../../components/admin/TeamTab.jsx'

export default function AdminTeam() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>Team</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Manage team members, roles, and teams.</p>
        </div>
        <TeamTab />
      </div>
    </Layout>
  )
}
