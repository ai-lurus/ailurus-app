import client from './client.js'

export async function getOneOnOnes(subjectId) {
  const { data } = await client.get('/api/one-on-ones', { params: { subjectId } })
  return data.notes
}

export async function createOneOnOneNote(payload) {
  const { data } = await client.post('/api/one-on-ones', payload)
  return data.note
}

export async function updateOneOnOneNote(id, payload) {
  const { data } = await client.put(`/api/one-on-ones/${id}`, payload)
  return data.note
}

export async function deleteOneOnOneNote(id) {
  await client.delete(`/api/one-on-ones/${id}`)
}
