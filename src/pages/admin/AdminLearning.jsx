import Layout from '../../components/Layout.jsx'
import LearningTab from '../../components/admin/LearningTab.jsx'

export default function AdminLearning() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Learning</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage learning paths and resources for the team.</p>
        </div>
        <LearningTab />
      </div>
    </Layout>
  )
}
