import Layout from '../../components/Layout.jsx'
import ReviewsTab from '../../components/admin/ReviewsTab.jsx'

export default function AdminReviews() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Code Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">Tasks in review — approve or request changes.</p>
        </div>
        <ReviewsTab />
      </div>
    </Layout>
  )
}
