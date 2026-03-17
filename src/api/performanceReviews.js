import client from './client.js'

export async function getPerformanceReviews(subjectId) {
  const { data } = await client.get('/api/performance-reviews', { params: { subjectId } })
  return data.reviews
}

export async function createPerformanceReview(payload) {
  const { data } = await client.post('/api/performance-reviews', payload)
  return data.review
}

export async function updatePerformanceReview(id, payload) {
  const { data } = await client.put(`/api/performance-reviews/${id}`, payload)
  return data.review
}
