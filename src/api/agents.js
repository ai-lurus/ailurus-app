const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Streams the morning check-in agent response.
 *
 * Calls POST /api/agents/morning-checkin and reads the SSE stream.
 * Invokes `onChunk(text)` for each text delta, then resolves when done.
 *
 * @param {{ messages: Array<{role: string, content: string}> }} payload
 * @param {(text: string) => void} onChunk  called for each streamed text chunk
 * @returns {Promise<void>}
 */
const MAX_CONTEXT_MESSAGES = 16 // ~8 exchanges

export async function streamMorningCheckin({ messages }, onChunk) {
  const d = new Date()
  const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const trimmed = messages.slice(-MAX_CONTEXT_MESSAGES)

  const res = await fetch(`${API_BASE}/api/agents/morning-checkin`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: trimmed, date: localDate }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Agent request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() // keep the last (possibly incomplete) line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]') return

      let parsed
      try {
        parsed = JSON.parse(payload)
      } catch {
        continue // skip malformed SSE lines
      }

      const { text, error } = parsed
      if (error) throw new Error(error) // propagate to caller
      if (text) onChunk(text)
    }
  }
}
