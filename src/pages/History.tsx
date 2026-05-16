import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export default function History() {
  const { user } = useAuth()
  const isElektra = user?.role === 'User_elektra'

  const [analyses, setAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('all')

  useEffect(() => {
    if (isElektra) {
      pb.collection('companies')
        .getFullList({ sort: 'name' })
        .then(setCompanies)
        .catch(console.error)
    }
  }, [isElektra])

  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoading(true)
      try {
        let filter = ''
        if (isElektra && selectedCompany !== 'all') {
          filter = `company = "${selectedCompany}"`
        }

        const records = await pb.collection('uc_analyses').getFullList({
          filter,
          sort: '-created',
          expand: 'company',
        })
        setAnalyses(records)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyses()
  }, [isElektra, selectedCompany])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Histórico de Relatórios</h1>
          <p className="text-muted-foreground">Visualize análises geradas anteriormente.</p>
        </div>

        {isElektra && (
          <div className="w-[250px]">
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análises Salvas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum relatório encontrado.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consumidor</TableHead>
                    <TableHead>Nº UC</TableHead>
                    {isElektra && <TableHead>Empresa</TableHead>}
                    <TableHead>Data de Geração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell className="font-medium">
                        {analysis.consumer_name || 'N/A'}
                      </TableCell>
                      <TableCell>{analysis.uc_number || 'N/A'}</TableCell>
                      {isElektra && (
                        <TableCell>{analysis.expand?.company?.name || 'N/A'}</TableCell>
                      )}
                      <TableCell>
                        {format(new Date(analysis.created), "dd 'de' MMMM 'de' yyyy, HH:mm", {
                          locale: ptBR,
                        })}
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
