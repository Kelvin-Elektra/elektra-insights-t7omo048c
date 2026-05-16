import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function RoleRouter() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role_company === 'admin' || user.role === 'User_owner') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/user" replace />
}
