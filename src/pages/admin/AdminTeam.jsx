import Layout from '../../components/Layout.jsx'
import TeamTab from '../../components/admin/TeamTab.jsx'

export default function AdminTeam() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage team members, roles, and teams.</p>
        </div>
        <TeamTab />
      </div>
    </Layout>
  )
}
