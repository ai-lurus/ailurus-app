import client from './client.js'

export async function login(email, password) {
  const { data } = await client.post('/api/auth/login', { email, password })
  if (data.token) localStorage.setItem('authToken', data.token)
  return data.user
}

export async function logout() {
  localStorage.removeItem('authToken')
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
