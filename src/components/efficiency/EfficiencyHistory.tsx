import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { useEfficiency } from '@/stores/efficiency-context'
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

export function EfficiencyHistory() {
  const { user } = useAuth()
  const { loadAnalysis, currentAnalysisId } = useEfficiency()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    if (!user) return
    try {
      let filter = ''
      if (user.role !== 'User_elektra') {
        filter = `company = "${user.company}"`
      }
      const records = await pb.collection('efficiency_analyses').getFullList({
        sort: '-created',
        filter,
        expand: 'company,user',
      })
      setAnalyses(records)
    } catch (error) {
      console.error('Error fetching efficiency history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [user])

  useRealtime('efficiency_analyses', () => {
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
            <CardTitle>Historico de Analises de Eficiencia</CardTitle>
            <CardDescription>{analyses.length} analise(s) encontrada(s)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {analyses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>Nenhuma analise de eficiencia encontrada.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cidade/Estado</TableHead>
                  <TableHead>Kit (kWp)</TableHead>
                  <TableHead className="text-right">IDM</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((a) => {
                  const rd = a.report_data
                  const idm = rd?.avg_idm ?? 0
                  return (
                    <TableRow
                      key={a.id}
                      className={a.id === currentAnalysisId ? 'bg-primary/5' : ''}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(a.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {a.city_name || 'N/A'} - {a.state || ''}
                      </TableCell>
                      <TableCell>{a.kit_power || 'N/A'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {idm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
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
