import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { streamMorningCheckin } from '../api/agents.js'
import { persistAiPlan } from '../api/learning.js'
import { SparklesIcon, SendIcon, XIcon } from './Icons.jsx'
import { useChatContext } from '../context/ChatContext.jsx'
import { useAuth } from '../hooks/useAuth.js'

const SUGGESTIONS_BY_ROLE = {
  developer: [
    'Help me plan my tasks for today',
    "I'm stuck on a bug, can you help?",
    'Suggest a learning resource for React performance',
    'What should I focus on this sprint?',
  ],
  designer: [
    'Help me prioritize my design tasks',
    'Give me tips for better UI consistency',
    'What should I tackle first today?',
    'How do I communicate design decisions to devs?',
  ],
  admin: [
    'Summarize what the team should focus on',
    'Help me write a sprint goal',
    'What metrics matter most this week?',
    'Draft a team update message',
  ],
  ceo: [
    'What KPIs should I review today?',
    'Help me frame a strategic decision',
    'Draft a client update',
    'Summarize our delivery risks',
  ],
}

function RichText({ text }) {
  return (
    <>
      {text.split('\n').map((line, i, arr) => (
        <span key={i}>
          {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**'))
              return <strong key={j}>{part.slice(2, -2)}</strong>
            if (part.startsWith('*') && part.endsWith('*'))
              return <em key={j}>{part.slice(1, -1)}</em>
            return part
          })}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

function ChatBubble({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(259, 100%, 15%)' }}>
          <SparklesIcon className="w-3.5 h-3.5" style={{ color: 'hsl(259, 100%, 69%)' }} />
        </div>
      )}
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? { backgroundColor: 'hsl(244, 100%, 69%)', color: 'white', borderBottomRightRadius: '4px' }
            : { backgroundColor: 'hsl(224, 25%, 18%)', color: 'hsl(224, 40%, 95%)', borderBottomLeftRadius: '4px' }
        }
      >
        <RichText text={message.content} />
        {message.streaming && (
          <span className="inline-block w-1.5 h-3 ml-0.5 rounded-sm animate-pulse align-middle" style={{ backgroundColor: 'hsl(224, 20%, 55%)' }} />
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5 justify-start">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(259, 100%, 15%)' }}>
        <SparklesIcon className="w-3.5 h-3.5" style={{ color: 'hsl(259, 100%, 69%)' }} />
      </div>
      <div className="rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex gap-1.5 items-center" style={{ backgroundColor: 'hsl(224, 25%, 18%)' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-bounce"
            style={{ backgroundColor: 'hsl(224, 20%, 55%)', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function extractLearningPlan(text) {
  const match = text.match(/\[LEARNING_PLAN\]([\s\S]*?)\[\/LEARNING_PLAN\]/)
  if (!match) return { cleanText: text, planJson: null }
  let planJson = null
  try { planJson = JSON.parse(match[1].trim()) } catch { /* ignore */ }
  return { cleanText: text.replace(match[0], '').trim(), planJson }
}

export default function UlaiPanel({ open, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { messages, setMessages, greetingSeeded, setGreetingSeeded, pendingQuery, setPendingQuery, chatOwner, resetForUser } = useChatContext()
  const [input, setInput]             = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [planToast, setPlanToast]     = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const bottomRef = useRef(null)

  const suggestions = SUGGESTIONS_BY_ROLE[user?.role] ?? SUGGESTIONS_BY_ROLE.developer

  useEffect(() => {
    if (!user) return
    if (chatOwner !== user.id) resetForUser(user.id)
  }, [user, chatOwner, resetForUser])

  useEffect(() => {
    if (!user || greetingSeeded || chatOwner !== user.id) return
    const name = user.name?.split(' ')[0] ?? 'there'
    setMessages([{
      role: 'assistant',
      content: `Hey ${name}! I'm Ulai, your AI work assistant. I can help you plan your day, work through blockers, brainstorm ideas, or just think out loud. What's on your mind?`,
    }])
    setGreetingSeeded(true)
  }, [user, greetingSeeded, setMessages, setGreetingSeeded, chatOwner])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  useEffect(() => {
    if (!pendingQuery || !greetingSeeded) return
    setPendingQuery(null)
    sendMessage(pendingQuery)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuery, greetingSeeded])

  useEffect(() => {
    if (!user) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg?.planJson || lastMsg.streaming || lastMsg.planPersisted) return

    setMessages((prev) =>
      prev.map((m, i) => i === prev.length - 1 ? { ...m, planPersisted: true } : m)
    )

    persistAiPlan(lastMsg.planJson)
      .then(() => {
        setPlanToast({ message: 'Your learning plan has been saved!' })
        setTimeout(() => setPlanToast(null), 5000)
      })
      .catch(() => {
        setPlanToast({ message: 'Could not save the plan — try again later.' })
        setTimeout(() => setPlanToast(null), 5000)
      })
  }, [messages, user, setMessages])

  async function sendMessage(text) {
    if (!text.trim() || streaming) return

    const userMsg     = { role: 'user', content: text.trim() }
    const placeholder = { role: 'assistant', content: '', streaming: true }
    const next        = [...messages, userMsg]

    setMessages([...next, placeholder])
    setInput('')
    setStreaming(true)

    try {
      await streamMorningCheckin({ messages: next }, (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
        })
      })

      setMessages((prev) => {
        const last = prev[prev.length - 1]
        const { cleanText, planJson } = extractLearningPlan(last.content)
        return [...prev.slice(0, -1), { ...last, content: cleanText, streaming: false, planJson }]
      })
    } catch (err) {
      setUnavailable(true)
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: err?.message || "I'm not available right now. Please try again later.", streaming: false },
      ])
    } finally {
      setStreaming(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const showSuggestions = messages.length <= 1 && !streaming

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        />
      )}

      <div
        className="fixed top-0 right-0 h-full z-40 flex flex-col"
        style={{
          width: '400px',
          backgroundColor: 'hsl(224, 45%, 9%)',
          borderLeft: '1px solid hsl(224, 30%, 18%)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(259, 100%, 15%)' }}>
              <SparklesIcon className="w-4 h-4" style={{ color: 'hsl(259, 100%, 69%)' }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold leading-none" style={{ color: 'hsl(224, 40%, 95%)' }}>Ulai</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'hsl(224, 20%, 50%)' }}>Siempre disponible</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streaming && (
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium animate-pulse" style={{ backgroundColor: 'hsl(244, 100%, 15%)', color: 'hsl(244, 100%, 69%)' }}>
                Pensando…
              </span>
            )}
            {unavailable && !streaming && (
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'hsl(51, 100%, 15%)', color: 'hsl(51, 100%, 60%)' }}>
                Offline
              </span>
            )}
            {planToast && (
              <button
                onClick={() => { navigate('/learning'); onClose() }}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium underline cursor-pointer"
                style={{ backgroundColor: 'hsl(120, 100%, 15%)', color: 'hsl(120, 100%, 50%)' }}
              >
                Plan guardado →
              </button>
            )}
            {confirmReset ? (
              <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5" style={{ backgroundColor: 'hsl(224, 30%, 16%)', border: '1px solid hsl(224, 30%, 22%)' }}>
                <span className="text-[11px] font-medium mr-1" style={{ color: 'hsl(224, 20%, 65%)' }}>¿Nuevo chat?</span>
                <button
                  onClick={() => { setConfirmReset(false); resetForUser(user?.id) }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                  style={{ backgroundColor: 'hsl(244, 100%, 69%)', color: 'white' }}
                >
                  Sí
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                  style={{ backgroundColor: 'hsl(224, 25%, 22%)', color: 'hsl(224, 20%, 65%)' }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                title="Nuevo chat"
                className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/[0.05]"
                style={{ color: 'hsl(224, 20%, 55%)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/[0.05]"
              style={{ color: 'hsl(224, 20%, 55%)' }}
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.map((m, i) => {
            if (m.streaming && !m.content) return null
            return <ChatBubble key={i} message={m} />
          })}
          {streaming && messages[messages.length - 1]?.content === '' && (
            <TypingIndicator />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {showSuggestions && (
          <div className="px-5 pb-3 shrink-0 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'hsl(224, 30%, 14%)',
                  border: '1px solid hsl(224, 30%, 22%)',
                  color: 'hsl(224, 20%, 65%)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-3 shrink-0" style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              disabled={streaming}
              className="flex-1 px-3.5 py-2.5 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-colors disabled:opacity-50"
              style={{
                minHeight: '42px',
                maxHeight: '120px',
                backgroundColor: 'hsl(224, 25%, 14%)',
                border: '1px solid hsl(224, 30%, 22%)',
                color: 'hsl(224, 40%, 95%)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="px-3.5 text-white rounded-xl transition-colors disabled:opacity-40 shrink-0 flex items-center cursor-pointer"
              style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
