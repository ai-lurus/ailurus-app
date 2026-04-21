import Layout from '../../components/Layout.jsx'
import ProjectsTab from '../../components/admin/ProjectsTab.jsx'

export default function AdminProjects() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Manage projects, budgets, and timelines.</p>
        </div>
        <ProjectsTab />
      </div>
    </Layout>
  )
}
