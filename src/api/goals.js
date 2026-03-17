import client from './client.js'

export async function getGoals(projectId) {
  const { data } = await client.get('/api/goals', { params: { projectId } })
  return data.goals
}
