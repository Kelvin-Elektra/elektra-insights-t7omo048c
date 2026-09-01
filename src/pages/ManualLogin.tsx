import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, KeyRound, Zap } from 'lucide-react'

export default function ManualLogin() {
  const { user, loading, setUser } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await pb.collection('users').authWithPassword(email.trim(), password)
      setUser(res.record)
      navigate('/')
    } catch (err: any) {
      setError(
        err?.message ||
          'Email ou senha inválidos. Por favor, verifique suas credenciais e tente novamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="mb-8 flex items-center gap-2 text-primary">
        <Zap className="h-8 w-8" />
        <span className="text-2xl font-bold tracking-tight text-foreground">Elektra Insights</span>
      </div>

      <Card className="w-full max-w-md shadow-lg border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Login Manual
          </CardTitle>
          <CardDescription>
            Entre com seu e-mail e senha cadastrados para acessar o sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <AlertTitle>Erro na Autenticação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="manual-email">E-mail</Label>
              <Input
                id="manual-email"
                type="email"
                placeholder="seu.email@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-password">Senha</Label>
              <Input
                id="manual-password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full text-base py-5 shadow-sm" type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              asChild
              type="button"
            >
              <Link to="/login" className="flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para tela inicial
              </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
