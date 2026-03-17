import client from './client.js'

// ── Avatar ────────────────────────────────────────────────────────────────────

export async function getAvatar() {
  const { data } = await client.get('/api/battles/avatar')
  return data.avatar
}

export async function saveAvatar(config) {
  const { data } = await client.put('/api/battles/avatar', config)
  return data.avatar
}

// ── Enemies ───────────────────────────────────────────────────────────────────

export async function getEnemies() {
  const { data } = await client.get('/api/battles/enemies')
  return data.enemies
}

export async function uploadEnemy(file) {
  const form = new FormData()
  form.append('enemy', file)
  const { data } = await client.post('/api/battles/enemies', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.enemy
}

export async function deleteEnemy(id) {
  await client.delete(`/api/battles/enemies/${id}`)
}

// ── Topics ────────────────────────────────────────────────────────────────────

export async function getTopics() {
  const { data } = await client.get('/api/battles/topics')
  return data.topics
}

export async function createTopic(payload) {
  const { data } = await client.post('/api/battles/topics', payload)
  return data.topic
}

export async function updateTopic(id, payload) {
  const { data } = await client.put(`/api/battles/topics/${id}`, payload)
  return data.topic
}

export async function deleteTopic(id) {
  await client.delete(`/api/battles/topics/${id}`)
}

export async function uploadTopicBattles(topicId, battles) {
  const { data } = await client.post(`/api/battles/topics/${topicId}/battles`, { battles })
  return data.battles
}

export async function getTopicDetail(topicId) {
  const { data } = await client.get(`/api/battles/topics/${topicId}/detail`)
  return data.topic
}

// ── Paths ─────────────────────────────────────────────────────────────────────

export async function getBattlePaths() {
  const { data } = await client.get('/api/battles/paths')
  return data.paths
}

export async function createBattlePath(payload) {
  const { data } = await client.post('/api/battles/paths', payload)
  return data.path
}

export async function updateBattlePath(id, payload) {
  const { data } = await client.put(`/api/battles/paths/${id}`, payload)
  return data.path
}

export async function deleteBattlePath(id) {
  await client.delete(`/api/battles/paths/${id}`)
}

export async function addTopicToPath(pathId, topicId) {
  const { data } = await client.post(`/api/battles/paths/${pathId}/topics`, { topicId })
  return data.path
}

export async function removeTopicFromPath(pathId, topicId) {
  const { data } = await client.delete(`/api/battles/paths/${pathId}/topics/${topicId}`)
  return data.path
}

export async function assignBattlePath(pathId, userId) {
  const { data } = await client.post(`/api/battles/paths/${pathId}/assign`, { userId })
  return data.assignment
}

export async function unassignBattlePath(pathId, userId) {
  await client.delete(`/api/battles/paths/${pathId}/assign/${userId}`)
}

// ── User progress ─────────────────────────────────────────────────────────────

export async function getMyPaths() {
  const { data } = await client.get('/api/battles/my-paths')
  return data.paths
}

export async function getUserBattleProgress(userId) {
  const { data } = await client.get(`/api/battles/users/${userId}/progress`)
  return data.paths
}

export async function saveBattleProgress(payload) {
  const { data } = await client.post('/api/battles/progress', payload)
  return data.progress
}
