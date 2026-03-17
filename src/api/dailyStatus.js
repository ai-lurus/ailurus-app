import client from './client.js'

export async function getTodayStatus() {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await client.get('/api/daily-status', { params: { date: today } })
  return data.statuses[0] ?? null
}

export async function submitDailyStatus(payload) {
  const { data } = await client.post('/api/daily-status', payload)
  return data.status
}

export async function submitEodStatus(payload) {
  const { data } = await client.patch('/api/daily-status/eod', payload)
  return data.status
}

export async function getTodayAllStatuses() {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await client.get('/api/daily-status', { params: { date: today } })
  return data.statuses
}
