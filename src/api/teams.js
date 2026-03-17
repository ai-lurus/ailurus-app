import client from './client.js'

export async function getTeams(projectId) {
  const { data } = await client.get('/api/teams', { params: { projectId } })
  return data.teams
}

export async function createTeam(projectId, name) {
  const { data } = await client.post('/api/teams', { projectId, name })
  return data.team
}

export async function addTeamMember(teamId, userId) {
  const { data } = await client.post(`/api/teams/${teamId}/members`, { userId })
  return data.member
}

export async function removeTeamMember(teamId, userId) {
  await client.delete(`/api/teams/${teamId}/members/${userId}`)
}

export async function renameTeam(teamId, name) {
  const { data } = await client.patch(`/api/teams/${teamId}`, { name })
  return data.team
}

export async function deleteTeam(teamId) {
  await client.delete(`/api/teams/${teamId}`)
}
