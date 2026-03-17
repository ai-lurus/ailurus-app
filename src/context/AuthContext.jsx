import { createContext, useContext, useEffect, useState } from 'react'
import client from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    client.get('/api/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function setUserAndClearError(u) {
    setError(null)
    setUser(u)
  }

  return (
    <AuthContext.Provider value={{ user, setUser: setUserAndClearError, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
