import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const Index = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-lg text-primary">Autenticando...</div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Acesso Restrito</CardTitle>
          <CardDescription>
            Por favor, faça login através do Hub para acessar a plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <p className="text-sm text-muted-foreground text-center">
            Você deve ser redirecionado automaticamente após a autenticação SSO.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Index
