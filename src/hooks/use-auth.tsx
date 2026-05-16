import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface AuthContextType {
  user: any
  loading: boolean
  error: string | null
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSSO = async () => {
      const params = new URLSearchParams(window.location.search)
      const ssoToken = params.get('sso_token')

      if (ssoToken) {
        // Clean the URL without reloading to prevent loops on error
        window.history.replaceState({}, document.title, window.location.pathname)

        try {
          const res = await pb.send(`/backend/v1/sso?sso_token=${ssoToken}`, {
            method: 'GET',
          })

          pb.authStore.save(res.token, res.record)
          setUser(res.record)

          window.location.href = '/'
        } catch (err: unknown) {
          const message = getErrorMessage(err)
          if (message.includes('Token de acesso inválido ou expirado')) {
            setError(message)
          } else {
            setError('Falha na autenticação SSO: ' + message)
          }
        }
      }

      setLoading(false)
    }

    checkSSO()

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>{children}</AuthContext.Provider>
  )
}
