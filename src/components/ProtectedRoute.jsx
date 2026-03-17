import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

const ROLE_REDIRECT = {
  ceo: '/dashboard',
  admin: '/admin',
  developer: '/home',
  client: '/dashboard',
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
        Loading...
      </div>
    )
  }

  if (!user || error) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirect = ROLE_REDIRECT[user.role] || '/home'
    return <Navigate to={redirect} replace />
  }

  return children
}
