import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AccessDenied({ error }: { error?: string | null }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Acesso Restrito</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        {error ||
          'Você não tem permissão para acessar esta página. Por favor, acesse através do Hub principal da Elektra.'}
      </p>
      <Button
        onClick={() => (window.location.href = 'https://insights.elektrasolucoes.tech')}
        variant="default"
      >
        Ir para o Hub Principal
      </Button>
    </div>
  )
}
