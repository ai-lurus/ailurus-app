import client from './client.js'

export async function getSprints(projectId, status) {
  const params = { projectId }
  if (status) params.status = status
  const { data } = await client.get('/api/sprints', { params })
  return data.sprints
}

export async function getSprint(id) {
  const { data } = await client.get(`/api/sprints/${id}`)
  return data.sprint
}

export async function createSprint(payload) {
  const { data } = await client.post('/api/sprints', payload)
  return data.sprint
}

export async function updateSprint(id, updates) {
  const { data } = await client.put(`/api/sprints/${id}`, updates)
  return data.sprint
}

export async function deleteSprint(id) {
  await client.delete(`/api/sprints/${id}`)
}
