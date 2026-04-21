import { createContext, useContext, useCallback, useState } from 'react'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [messages, setMessages]             = useState([])
  const [greetingSeeded, setGreetingSeeded] = useState(false)
  const [pendingQuery, setPendingQuery]     = useState(null)
  const [chatOwner, setChatOwner]           = useState(null)
  const [ulaiOpen, setUlaiOpen]             = useState(false)

  const resetForUser = useCallback((userId) => {
    setMessages([])
    setGreetingSeeded(false)
    setPendingQuery(null)
    setChatOwner(userId)
  }, [])

  function openUlai(query) {
    if (query) setPendingQuery(query)
    setUlaiOpen(true)
  }

  return (
    <ChatContext.Provider value={{ messages, setMessages, greetingSeeded, setGreetingSeeded, pendingQuery, setPendingQuery, chatOwner, resetForUser, ulaiOpen, setUlaiOpen, openUlai }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  return useContext(ChatContext)
}
