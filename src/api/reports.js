import client from './client.js'

export async function getReports(params = {}) {
  const { data } = await client.get('/api/reports', { params })
  return data.reports
}

export async function triggerHealthReport(projectId) {
  const { data } = await client.post('/api/agents/project-health', { projectId })
  return data.report
}
