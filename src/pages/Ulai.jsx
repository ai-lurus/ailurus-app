import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { streamMorningCheckin } from '../api/agents.js'
import { persistAiPlan } from '../api/learning.js'
import { SparklesIcon, SendIcon } from '../components/Icons.jsx'
import { useChatContext } from '../context/ChatContext.jsx'
import { useAuth } from '../hooks/useAuth.js'
import Layout from '../components/Layout.jsx'

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
    <div className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(259, 100%, 15%)' }}>
          <SparklesIcon className="w-4 h-4" style={{ color: 'hsl(259, 100%, 69%)' }} />
        </div>
      )}
      <div
        className="max-w-[72%] px-5 py-3 rounded-2xl text-sm leading-relaxed"
        style={
          isUser
            ? { backgroundColor: 'hsl(244, 100%, 69%)', color: 'white', borderBottomRightRadius: '4px' }
            : { backgroundColor: 'hsl(224, 25%, 20%)', color: 'hsl(224, 40%, 95%)', borderBottomLeftRadius: '4px' }
        }
      >
        <RichText text={message.content} />
        {message.streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm animate-pulse align-middle" style={{ backgroundColor: 'hsl(224, 20%, 55%)' }} />
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 justify-start">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(259, 100%, 15%)' }}>
        <SparklesIcon className="w-4 h-4" style={{ color: 'hsl(259, 100%, 69%)' }} />
      </div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center" style={{ backgroundColor: 'hsl(224, 25%, 20%)' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
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

export default function Ulai() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { messages, setMessages, greetingSeeded, setGreetingSeeded, pendingQuery, setPendingQuery, chatOwner, resetForUser } = useChatContext()
  const [input, setInput]             = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [planToast, setPlanToast]     = useState(null)
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
  }, [user, greetingSeeded, setMessages, setGreetingSeeded])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
  }, [messages, user])

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
    <Layout>
      <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)', backgroundColor: 'hsl(224, 56%, 8%)' }}>
        {/* Page header */}
        <div className="px-8 py-5 shrink-0 flex items-center gap-3" style={{ borderBottom: '1px solid hsl(224, 30%, 18%)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'hsl(259, 100%, 15%)' }}>
            <SparklesIcon className="w-5 h-5" style={{ color: 'hsl(259, 100%, 69%)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none" style={{ color: 'hsl(224, 40%, 95%)' }}>Ulai</h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(224, 20%, 55%)' }}>Your AI work assistant · Powered by Claude</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {streaming && (
              <span className="text-xs px-3 py-1 rounded-full font-medium animate-pulse" style={{ backgroundColor: 'hsl(244, 100%, 15%)', color: 'hsl(244, 100%, 69%)' }}>
                Thinking…
              </span>
            )}
            {unavailable && !streaming && (
              <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'hsl(51, 100%, 15%)', color: 'hsl(51, 100%, 60%)' }}>
                Offline
              </span>
            )}
            {planToast && (
              <div className="flex items-center gap-2 text-xs px-3 py-1 rounded-full font-medium" style={{ backgroundColor: 'hsl(120, 100%, 15%)', border: '1px solid hsl(120, 100%, 30%)', color: 'hsl(120, 100%, 50%)' }}>
                {planToast.message}
                <button onClick={() => navigate('/learning')} className="underline hover:no-underline cursor-pointer">
                  View →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((m, i) => {
              if (m.streaming && !m.content) return null
              return <ChatBubble key={i} message={m} />
            })}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <TypingIndicator />
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Suggestion chips — shown only at start */}
        {showSuggestions && (
          <div className="px-8 pb-4 shrink-0">
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3.5 py-2 rounded-full font-medium transition-colors cursor-pointer hover-elevate"
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
          </div>
        )}

        {/* Input */}
        <div className="px-8 pb-6 shrink-0" style={{ borderTop: '1px solid hsl(224, 30%, 18%)' }}>
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3 pt-4">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything… (Enter to send, Shift+Enter for newline)"
              disabled={streaming}
              className="flex-1 px-4 py-3 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 transition-colors disabled:opacity-50"
              style={{
                minHeight: '46px',
                maxHeight: '140px',
                backgroundColor: 'hsl(224, 25%, 16%)',
                border: '1px solid hsl(224, 30%, 22%)',
                color: 'hsl(224, 40%, 95%)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || streaming}
              className="px-5 py-3 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 shrink-0 flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: 'hsl(244, 100%, 69%)' }}
            >
              <SendIcon className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
