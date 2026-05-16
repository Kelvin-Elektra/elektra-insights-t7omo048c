import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Activity, FileText, Database } from 'lucide-react'

export default function MaintenanceDashboard() {
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [totalReports, setTotalReports] = useState(0)

  useEffect(() => {
    pb.collection('companies').getFullList({ sort: 'name' }).then(setCompanies).catch(console.error)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const filter = selectedCompany !== 'all' ? `company = "${selectedCompany}"` : ''
        const result = await pb.collection('uc_analyses').getList(1, 1, { filter })
        setTotalReports(result.totalItems)
      } catch (error) {
        console.error('Failed to fetch stats', error)
      }
    }
    fetchStats()
  }, [selectedCompany])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard de Manutenção</h1>
        <p className="text-muted-foreground">Visão global do sistema e estatísticas de uso.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-[300px]">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Relatórios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="text-xs text-muted-foreground">
              {selectedCompany === 'all' ? 'Em todo o sistema' : 'Na empresa selecionada'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">Registradas no banco</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Operacional</div>
            <p className="text-xs text-muted-foreground">Todos os serviços normais</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
