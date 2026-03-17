import client from './client.js'

export async function getProjects(params = {}) {
  const { data } = await client.get('/api/projects', { params })
  return data.projects
}

export async function updateProject(id, updates) {
  const { data } = await client.put(`/api/projects/${id}`, updates)
  return data.project
}

export async function createProject(payload) {
  const { data } = await client.post('/api/projects', payload)
  return data.project
}

export async function getProject(id) {
  const { data } = await client.get(`/api/projects/${id}`)
  return data.project
}

export async function getProjectDashboard(id) {
  const { data } = await client.get(`/api/projects/${id}/dashboard`)
  return data.dashboard
}

export async function deleteProject(id) {
  await client.delete(`/api/projects/${id}`)
}
