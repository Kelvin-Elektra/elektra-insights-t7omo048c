import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Loader2, Search, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function History() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return

      try {
        let filter = ''
        if (user.role !== 'User_elektra') {
          filter = `company = "${user.company}"`
        }

        const records = await pb.collection('uc_analyses').getFullList({
          sort: '-created',
          filter: filter,
          expand: 'company',
        })
        setAnalyses(records)
      } catch (error) {
        console.error('Error fetching history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user])

  const filteredAnalyses = analyses.filter((a) => {
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
                {filteredAnalyses.length} relatório(s) encontrado(s)
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
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p>Nenhuma análise encontrada.</p>
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
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {format(new Date(analysis.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{analysis.consumer_name || 'Não informado'}</TableCell>
                      <TableCell>{analysis.uc_number || 'N/A'}</TableCell>
                      {user?.role === 'User_elektra' && (
                        <TableCell>{analysis.expand?.company?.name || 'N/A'}</TableCell>
                      )}
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          Concluído
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
