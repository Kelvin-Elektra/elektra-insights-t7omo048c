import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useHybrid } from '@/stores/hybrid-context'
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
import { Loader2, FileText, History } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HybridHistory() {
  const { user } = useAuth()
  const { loadAnalysis, currentAnalysisId } = useHybrid()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    if (!user) return
    try {
      const filter = `company = "${user.company}"`
      const records = await pb.collection('hybrid_analyses').getFullList({
        sort: '-created',
        filter,
        expand: 'company,user',
      })
      setAnalyses(records)
    } catch (error) {
      console.error('Error fetching hybrid history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [user])

  useRealtime('hybrid_analyses', () => {
    fetchHistory()
  })

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
            <CardTitle>Histórico de Análises Híbridas</CardTitle>
            <CardDescription>{analyses.length} análise(s) encontrada(s)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>Nenhuma análise híbrida encontrada.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Bateria</TableHead>
                  <TableHead className="text-right">Inversor (W)</TableHead>
                  <TableHead className="text-right">Baterias</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((a) => {
                  const rd = a.results
                  return (
                    <TableRow
                      key={a.id}
                      className={a.id === currentAnalysisId ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(a.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-medium">{a.customer_name || '-'}</TableCell>
                      <TableCell>{a.battery_type || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {rd?.inverter_power?.toLocaleString('pt-BR') || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {rd?.battery_qty?.toLocaleString('pt-BR') || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => loadAnalysis(a)}>
                          Abrir
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
