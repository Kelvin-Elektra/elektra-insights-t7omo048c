import { useAuth } from '@/hooks/use-auth'
import { Navigate, Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, KeyRound, Zap } from 'lucide-react'

const Index = () => {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="animate-pulse text-lg font-medium text-muted-foreground">
          Autenticando...
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex items-center gap-2 text-primary">
        <Zap className="h-8 w-8" />
        <span className="text-2xl font-bold tracking-tight text-foreground">Elektra Insights</span>
      </div>

      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
          <CardDescription>
            Faça login através do Elektra Hub ou utilize suas credenciais manuais.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertTitle>Erro de Autenticação</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Usuários vinculados ao Elektra Hub são autenticados automaticamente via token na URL.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-0 pb-6">
          <Button className="w-full text-base py-5 shadow-sm" asChild>
            <Link to="/manual-login" className="flex items-center justify-center gap-2">
              <KeyRound className="h-4 w-4" />
              Fazer login manual
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default Index
