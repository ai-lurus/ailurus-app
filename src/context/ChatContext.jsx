import { createContext, useContext, useState } from 'react'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [greetingSeeded, setGreetingSeeded] = useState(false)

  return (
    <ChatContext.Provider value={{ messages, setMessages, greetingSeeded, setGreetingSeeded }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  return useContext(ChatContext)
}
