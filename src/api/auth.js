import client from './client.js'

export async function login(email, password) {
  const { data } = await client.post('/api/auth/login', { email, password })
  return data.user
}

export async function logout() {
  await client.post('/api/auth/logout')
}

export async function getMe() {
  const { data } = await client.get('/api/auth/me')
  return data.user
}

export async function updateMe(payload) {
  const { data } = await client.patch('/api/auth/me', payload)
  return data.user
}
