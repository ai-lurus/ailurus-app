import Layout from '../../components/Layout.jsx'
import ReportsTab from '../../components/admin/ReportsTab.jsx'

export default function AdminReports() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daily check-ins, team activity, and project health reports.</p>
        </div>
        <ReportsTab />
      </div>
    </Layout>
  )
}
