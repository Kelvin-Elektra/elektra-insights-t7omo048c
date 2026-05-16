import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Activity,
  FileText,
  Database,
  TerminalSquare,
  AlertCircle,
  PlayCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'

interface LogEntry {
  id: string
  created: string
  message: string
  type: 'info' | 'warn' | 'error'
}

export default function MaintenanceDashboard() {
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [totalReports, setTotalReports] = useState(0)
  const [recentReports, setRecentReports] = useState<any[]>([])

  // Fake system logs for demonstration (as actual _logs are superuser only)
  const [systemLogs] = useState<LogEntry[]>([
    {
      id: '1',
      created: new Date().toISOString(),
      message: 'System boot OK. Memory usage: 45%',
      type: 'info',
    },
    {
      id: '2',
      created: new Date(Date.now() - 3600000).toISOString(),
      message: 'API rate limit warning on /api/collections/uc_analyses',
      type: 'warn',
    },
    {
      id: '3',
      created: new Date(Date.now() - 7200000).toISOString(),
      message: 'Hub user sync completed. 0 new users.',
      type: 'info',
    },
    {
      id: '4',
      created: new Date(Date.now() - 86400000).toISOString(),
      message: 'Elektra admin logged in.',
      type: 'info',
    },
  ])

  useEffect(() => {
    pb.collection('companies').getFullList({ sort: 'name' }).then(setCompanies).catch(console.error)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filter = selectedCompany !== 'all' ? `company = "${selectedCompany}"` : ''

        const result = await pb.collection('uc_analyses').getList(1, 10, {
          filter,
          sort: '-created',
          expand: 'company',
        })

        setTotalReports(result.totalItems)
        setRecentReports(result.items)
      } catch (error) {
        console.error('Failed to fetch stats', error)
      }
    }
    fetchData()
  }, [selectedCompany])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Manutenção</h1>
          <p className="text-muted-foreground">Visão global do sistema e estatísticas de uso.</p>
        </div>
        <div className="w-full md:w-[300px]">
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
        <Card className="border-l-4 border-l-blue-500">
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

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
            <p className="text-xs text-muted-foreground">Registradas no banco</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Operacional</div>
            <p className="text-xs text-muted-foreground">Todos os serviços normais</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalSquare className="h-5 w-5" />
              Logs de Sistema
            </CardTitle>
            <CardDescription>
              Eventos recentes de diagnóstico e monitoramento (Mock).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-muted/30">
              <div className="space-y-4">
                {systemLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.created), 'dd/MM/yyyy HH:mm:ss')}
                      {log.type === 'warn' && (
                        <span className="text-yellow-600 font-bold">[WARN]</span>
                      )}
                      {log.type === 'error' && (
                        <span className="text-red-600 font-bold">[ERROR]</span>
                      )}
                      {log.type === 'info' && (
                        <span className="text-blue-600 font-bold">[INFO]</span>
                      )}
                    </div>
                    <p className="text-sm font-mono">{log.message}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Módulo de Diagnósticos
            </CardTitle>
            <CardDescription>
              Acesso a ferramentas de teste e depuração de módulos isolados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Utilize esta seção para verificar o comportamento individual dos componentes do
              sistema, validar layouts em diferentes resoluções e testar integrações sem afetar
              dados de produção.
            </p>
            <div className="p-4 border rounded-lg bg-primary/5 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-primary">Ambiente de Testes</h4>
                <p className="text-xs text-muted-foreground">Acesso ao playground de UI/UX</p>
              </div>
              <Button asChild variant="default" size="sm">
                <Link to="/modules-test">
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Abrir Módulos
                </Link>
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm mb-3 text-muted-foreground">
                Relatórios Recentes
              </h4>
              <div className="space-y-2">
                {recentReports.length > 0 ? (
                  recentReports.slice(0, 3).map((report) => (
                    <div
                      key={report.id}
                      className="text-xs flex justify-between items-center p-2 bg-muted/40 rounded"
                    >
                      <span className="truncate max-w-[200px]">
                        {report.consumer_name || 'Sem nome'} (UC: {report.uc_number})
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(report.created), 'dd/MM HH:mm')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum relatório recente.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
