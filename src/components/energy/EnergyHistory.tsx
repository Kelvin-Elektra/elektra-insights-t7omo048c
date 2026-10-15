import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useEnergy } from '@/stores/energy-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Loader2, FileText, History, Edit, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface EnergyHistoryProps {
  onReopenReport?: () => void
}

export function EnergyHistory({ onReopenReport }: EnergyHistoryProps) {
  const { user } = useAuth()
  const { loadAnalysis, currentAnalysisId } = useEnergy()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    if (!user) return
    try {
      let filter = ''
      if (user.role !== 'User_elektra') {
        filter = `company = "${user.company}"`
      }
      const records = await pb.collection('energy_analyses').getFullList({
        sort: '-created',
        filter,
        expand: 'company,user',
      })
      setAnalyses(records)
    } catch (error) {
      console.error('Error fetching energy analyses history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [user])

  useRealtime('energy_analyses', () => {
    fetchHistory()
  })

  const handleReopen = (record: any) => {
    loadAnalysis(record)
    if (onReopenReport) {
      onReopenReport()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Histórico de Relatórios de Balanço & Geração</CardTitle>
            <CardDescription>
              {analyses.length} análise(s) salva(s) — clique para reabrir os dados para edição
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
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
                  <TableHead>Cliente / Consumidor</TableHead>
                  <TableHead>UC</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((a) => {
                  const isEff = a.mode === 'efficiency'
                  const inputs = a.inputs || {}
                  const monthsCount = Array.isArray(inputs.draftEntries)
                    ? inputs.draftEntries.length
                    : 0

                  return (
                    <TableRow
                      key={a.id}
                      className={a.id === currentAnalysisId ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(a.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {a.consumer_name || inputs.consumerName || '-'}
                      </TableCell>
                      <TableCell>{a.uc_number || inputs.ucNumber || 'N/A'}</TableCell>
                      <TableCell>
                        {isEff ? (
                          <Badge
                            variant="outline"
                            className="border-primary/50 text-primary bg-primary/5"
                          >
                            <Sparkles className="h-3 w-3 mr-1" /> Eficiência
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Declarado</Badge>
                        )}
                      </TableCell>
                      <TableCell>{a.city_name ? `${a.city_name} - ${a.state}` : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReopen(a)}
                          className="hover:text-primary"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Reabrir para Edição
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
