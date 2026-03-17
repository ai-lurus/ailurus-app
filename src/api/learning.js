import client from './client.js'

export async function getLearningPaths(userId) {
  const params = userId ? { userId } : {}
  const res = await client.get('/api/learning', { params })
  return res.data.paths
}

export async function createLearningPath(data) {
  const res = await client.post('/api/learning', data)
  return res.data.path
}

export async function updateLearningPath(id, data) {
  const res = await client.put(`/api/learning/${id}`, data)
  return res.data.path
}

export async function deleteLearningPath(id) {
  await client.delete(`/api/learning/${id}`)
}

export async function addLearningTopic(pathId, data) {
  const res = await client.post(`/api/learning/${pathId}/topics`, data)
  return res.data.topic
}

export async function updateLearningTopic(id, data) {
  const res = await client.put(`/api/learning/topics/${id}`, data)
  return res.data.topic
}

export async function deleteLearningTopic(id) {
  await client.delete(`/api/learning/topics/${id}`)
}

export async function generateLearningPlan(userId, goalsDescription) {
  const res = await client.post('/api/agents/generate-learning-plan', { userId, goalsDescription })
  return res.data.path
}

// Persists an already-structured AI plan (no extra Claude call needed).
export async function persistAiPlan(plan) {
  const res = await client.post('/api/learning/persist-ai-plan', plan)
  return res.data.path
}
