import client from './client.js'

export async function getProjectDocuments(projectId) {
  const { data } = await client.get('/api/documents', { params: { projectId } })
  return data.documents
}

export async function getDocument(documentId) {
  const { data } = await client.get(`/api/documents/${documentId}`)
  return data.document
}

export async function createDocument(projectId, { title, type = 'wiki' }) {
  const { data } = await client.post('/api/documents', { projectId, title, type })
  return data.document
}

export async function updateDocument(documentId, updates) {
  const { data } = await client.put(`/api/documents/${documentId}`, updates)
  return data.document
}

export async function deleteDocument(documentId) {
  await client.delete(`/api/documents/${documentId}`)
}
