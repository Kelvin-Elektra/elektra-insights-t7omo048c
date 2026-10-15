import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useEnergy } from '@/stores/energy-context'
import { useSolar } from '@/stores/solar-context'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Loader2, Search, FileText, Edit, Zap, SunMedium } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function History() {
  const { user } = useAuth()
  const { loadAnalysis: loadEnergyAnalysis } = useEnergy()
  const { loadAnalysis: loadSolarAnalysis } = useSolar()
  const navigate = useNavigate()

  const [ucAnalyses, setUcAnalyses] = useState<any[]>([])
  const [energyAnalyses, setEnergyAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'energy' | 'uc'>('energy')

  const fetchHistory = async () => {
    if (!user) return

    try {
      let filter = ''
      if (user.role !== 'User_elektra') {
        filter = `company = "${user.company}"`
      }

      const [ucRecords, energyRecords] = await Promise.all([
        pb.collection('uc_analyses').getFullList({
          sort: '-created',
          filter,
          expand: 'company',
        }),
        pb
          .collection('energy_analyses')
          .getFullList({
            sort: '-created',
            filter,
            expand: 'company',
          })
          .catch(() => []),
      ])

      setUcAnalyses(ucRecords)
      setEnergyAnalyses(energyRecords)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [user])

  useRealtime('uc_analyses', () => {
    fetchHistory()
  })

  useRealtime('energy_analyses', () => {
    fetchHistory()
  })

  const filteredEnergy = energyAnalyses.filter((a) => {
    const q = search.toLowerCase()
    return (
      (a.consumer_name || a.inputs?.consumerName || '').toLowerCase().includes(q) ||
      (a.uc_number || a.inputs?.ucNumber || '').toLowerCase().includes(q)
    )
  })

  const filteredUc = ucAnalyses.filter((a) => {
    const q = search.toLowerCase()
    return (
      (a.consumer_name || '').toLowerCase().includes(q) ||
      (a.uc_number || '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Análises</h1>
        <p className="text-muted-foreground">
          {user?.role === 'User_elektra'
            ? 'Visualize todas as análises geradas no sistema.'
            : 'Visualize o histórico de relatórios gerados pela sua empresa.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Relatórios Gerados</CardTitle>
              <CardDescription>
                {tab === 'energy' ? filteredEnergy.length : filteredUc.length} relatório(s)
                encontrado(s)
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou UC..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'energy' | 'uc')} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="energy" className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                Balanço & Geração ({energyAnalyses.length})
              </TabsTrigger>
              <TabsTrigger value="uc" className="flex items-center gap-1.5">
                <SunMedium className="h-4 w-4 text-amber-500" />
                Consumo x Injetada ({ucAnalyses.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="energy">
              {filteredEnergy.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>Nenhuma análise de balanço e geração encontrada.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Consumidor</TableHead>
                        <TableHead>UC</TableHead>
                        <TableHead>Modo</TableHead>
                        {user?.role === 'User_elektra' && <TableHead>Empresa</TableHead>}
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnergy.map((analysis) => {
                        const isEff = analysis.mode === 'efficiency'
                        return (
                          <TableRow key={analysis.id}>
                            <TableCell className="font-medium whitespace-nowrap">
                              {format(new Date(analysis.created), 'dd/MM/yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="font-medium">
                              {analysis.consumer_name ||
                                analysis.inputs?.consumerName ||
                                'Não informado'}
                            </TableCell>
                            <TableCell>
                              {analysis.uc_number || analysis.inputs?.ucNumber || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {isEff ? (
                                <Badge
                                  variant="outline"
                                  className="border-primary/50 text-primary bg-primary/5"
                                >
                                  Eficiência
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Declarado</Badge>
                              )}
                            </TableCell>
                            {user?.role === 'User_elektra' && (
                              <TableCell>{analysis.expand?.company?.name || 'N/A'}</TableCell>
                            )}
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  loadEnergyAnalysis(analysis)
                                  navigate('/energy-analysis')
                                }}
                                className="hover:text-primary"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Reabrir Relatório
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="uc">
              {filteredUc.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
                  <p>Nenhum relatório de UC encontrado.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Consumidor</TableHead>
                        <TableHead>Unidade Consumidora (UC)</TableHead>
                        {user?.role === 'User_elektra' && <TableHead>Empresa</TableHead>}
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUc.map((analysis) => (
                        <TableRow key={analysis.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(analysis.created), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {analysis.consumer_name || 'Não informado'}
                          </TableCell>
                          <TableCell>{analysis.uc_number || 'N/A'}</TableCell>
                          {user?.role === 'User_elektra' && (
                            <TableCell>{analysis.expand?.company?.name || 'N/A'}</TableCell>
                          )}
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                loadSolarAnalysis(analysis)
                                navigate('/uc-analysis')
                              }}
                              className="hover:text-primary"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1.5" />
                              Reabrir Relatório
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
