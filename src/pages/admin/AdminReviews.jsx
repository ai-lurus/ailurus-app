import Layout from '../../components/Layout.jsx'
import ReviewsTab from '../../components/admin/ReviewsTab.jsx'

export default function AdminReviews() {
  return (
    <Layout>
      <div className="px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'hsl(224, 40%, 95%)' }}>Code Reviews</h1>
          <p className="text-sm mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Tasks in review — approve or request changes.</p>
        </div>
        <ReviewsTab />
      </div>
    </Layout>
  )
}
