import Layout from '../../components/Layout.jsx'
import ProjectsTab from '../../components/admin/ProjectsTab.jsx'

export default function AdminProjects() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage projects, budgets, and timelines.</p>
        </div>
        <ProjectsTab />
      </div>
    </Layout>
  )
}
