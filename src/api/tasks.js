import client from './client.js'

export async function getAllTasks(params = {}) {
  const { data } = await client.get('/api/tasks', { params })
  return data.tasks
}

export async function getMyTasks(userId) {
  const { data } = await client.get('/api/tasks', { params: { assignedTo: userId } })
  return data.tasks
}

export async function getBacklogTasks(params = {}) {
  const { data } = await client.get('/api/tasks', { params: { status: 'backlog', ...params } })
  return data.tasks
}

export async function createTask(payload) {
  const { data } = await client.post('/api/tasks', payload)
  return data.task
}

export async function updateTaskStatus(taskId, status) {
  const { data } = await client.put(`/api/tasks/${taskId}`, { status })
  return data.task
}

export async function updateTask(taskId, updates) {
  const { data } = await client.put(`/api/tasks/${taskId}`, updates)
  return data.task
}

function getLocalDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getTodayTaskActivity(date) {
  const params = date ? { date } : { date: getLocalDate() }
  const { data } = await client.get('/api/tasks/today-activity', { params })
  return data.activity // [{ user: { id, name }, tasks: [...] }]
}

export async function getTaskHistory(userId, from, to) {
  const params = { userId }
  if (from) params.from = from
  if (to)   params.to   = to
  const { data } = await client.get('/api/tasks/history', { params })
  return data // { weeks: [...], tasks: [...] }
}
