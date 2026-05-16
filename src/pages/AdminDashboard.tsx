import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua empresa e análises de unidades consumidoras.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresa</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestão Global</div>
            <p className="text-xs text-muted-foreground">Configurações globais ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipe</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Acessos e Regras</div>
            <p className="text-xs text-muted-foreground">Controle de permissões da empresa</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
