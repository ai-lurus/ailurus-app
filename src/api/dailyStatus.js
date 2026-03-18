import client from './client.js'

function getLocalDate() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function getTodayStatus() {
  const today = getLocalDate()
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
  const today = getLocalDate()
  const { data } = await client.get('/api/daily-status', { params: { date: today } })
  return data.statuses
}
