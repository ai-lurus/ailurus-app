import client from './client.js'

export async function getUsers() {
  const { data } = await client.get('/api/users')
  return data.users
}

export async function getMentionableUsers() {
  const { data } = await client.get('/api/users/mentionable')
  return data.users
}

export async function createUser(payload) {
  const { data } = await client.post('/api/users', payload)
  return data.user
}

export async function updateUserRole(userId, role) {
  const { data } = await client.patch(`/api/users/${userId}`, { role })
  return data.user
}

export async function toggleUserActive(userId, active) {
  const { data } = await client.patch(`/api/users/${userId}`, { active })
  return data.user
}
