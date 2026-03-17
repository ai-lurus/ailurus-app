import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { streamMorningCheckin } from '../api/agents.js'
import { persistAiPlan } from '../api/learning.js'
import { SparklesIcon, SendIcon } from './Icons.jsx'
import { useChatContext } from '../context/ChatContext.jsx'

// Generates the first greeting message locally (no API needed before the user speaks).
function buildLocalGreeting(user, dailyStatus) {
  const name = user?.name?.split(' ')[0] ?? 'there'
  if (!dailyStatus) {
    return `Hey ${name}! Complete your morning check-in above and I'll help you plan your day.`
  }
  const hrs = dailyStatus.availableHrs ? `${dailyStatus.availableHrs}h` : 'a few hours'
  const lines = [`Hey ${name}! I can see you're feeling **${dailyStatus.mood}** today with **${hrs}** available.`]
  if (dailyStatus.appointments) lines.push(`You have some things on the calendar: *${dailyStatus.appointments}*`)
  if (dailyStatus.blockers)     lines.push(`You mentioned a blocker: *${dailyStatus.blockers}*`)
  lines.push("What would you like to tackle first, or should I walk you through a plan?")
  return lines.join(' ')
}

// Renders text with basic **bold** and *italic* markdown + line breaks.
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
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
          <SparklesIcon className="w-3.5 h-3.5 text-violet-600" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
        }`}
      >
        <RichText text={message.content} />
        {message.streaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-slate-400 rounded-sm animate-pulse align-middle" />
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
        <SparklesIcon className="w-3.5 h-3.5 text-violet-600" />
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// Strips [LEARNING_PLAN]...[/LEARNING_PLAN] block from message text.
// Returns { cleanText, planJson } where planJson is null if no block found.
function extractLearningPlan(text) {
  const match = text.match(/\[LEARNING_PLAN\]([\s\S]*?)\[\/LEARNING_PLAN\]/)
  if (!match) return { cleanText: text, planJson: null }

  let planJson = null
  try { planJson = JSON.parse(match[1].trim()) } catch { /* ignore */ }

  const cleanText = text.replace(match[0], '').trim()
  return { cleanText, planJson }
}

export default function AgentChat({ user, dailyStatus }) {
  const navigate = useNavigate()
  const { messages, setMessages, greetingSeeded, setGreetingSeeded } = useChatContext()
  const [input, setInput]             = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [planToast, setPlanToast]     = useState(null) // { message }
  const bottomRef = useRef(null)

  // Seed greeting only once per session (survives navigation)
  useEffect(() => {
    if (!user || greetingSeeded) return
    setMessages([{ role: 'assistant', content: buildLocalGreeting(user, dailyStatus) }])
    setGreetingSeeded(true)
  }, [user, dailyStatus, greetingSeeded, setMessages, setGreetingSeeded])

  // Auto-scroll to latest content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Persist learning plan when the agent embeds a [LEARNING_PLAN] block
  useEffect(() => {
    if (!user) return
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg?.planJson || lastMsg.streaming || lastMsg.planPersisted) return

    // Mark as persisted to avoid double-saving
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

  async function handleSend(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || streaming) return

    const userMsg      = { role: 'user', content: text }
    const placeholder  = { role: 'assistant', content: '', streaming: true }
    const next         = [...messages, userMsg]

    setMessages([...next, placeholder])
    setInput('')
    setStreaming(true)

    try {
      await streamMorningCheckin({ messages: next }, (chunk) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1]
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + chunk },
          ]
        })
      })

      // Mark streaming finished; parse any embedded learning plan block
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        const { cleanText, planJson } = extractLearningPlan(last.content)
        return [...prev.slice(0, -1), { ...last, content: cleanText, streaming: false, planJson }]
      })
    } catch (err) {
      setUnavailable(true)
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          content: err?.message || "The AI assistant isn't available right now. Please try again later.",
          streaming: false,
        },
      ])
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden" style={{ height: '420px' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
          <SparklesIcon className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-none">AI Assistant</h2>
          <p className="text-xs text-slate-400 mt-0.5">Powered by Claude</p>
        </div>
        {streaming && (
          <span className="ml-auto text-xs text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full font-medium animate-pulse">
            Thinking…
          </span>
        )}
        {unavailable && !streaming && (
          <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium">
            Offline
          </span>
        )}

        {planToast && (
          <div className="ml-auto flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full font-medium">
            {planToast.message}
            <button
              onClick={() => navigate('/learning')}
              className="underline hover:no-underline cursor-pointer"
            >
              View plan →
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <ChatBubble key={i} message={m} />
        ))}
        {streaming && messages[messages.length - 1]?.content === '' && (
          <TypingIndicator />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-slate-100 shrink-0">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about your day… (Enter to send)"
          disabled={streaming}
          className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50 bg-white text-slate-900 placeholder:text-slate-400"
          style={{ minHeight: '38px', maxHeight: '96px' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <SendIcon className="w-4 h-4" />
          Send
        </button>
      </form>
    </section>
  )
}
