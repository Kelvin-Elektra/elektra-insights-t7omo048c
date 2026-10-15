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
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
  Loader2,
  Search,
  FileText,
  Edit,
  Zap,
  SunMedium,
  BatteryCharging,
  Gauge,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEfficiency } from '@/stores/efficiency-context'
import { useHybrid } from '@/stores/hybrid-context'

type AnalysisType = 'all' | 'energy' | 'uc' | 'efficiency' | 'hybrid'

interface UnifiedAnalysis {
  id: string
  collection: 'energy_analyses' | 'uc_analyses' | 'efficiency_analyses' | 'hybrid_analyses'
  typeLabel: string
  created: string
  consumerName: string
  ucNumber?: string
  extraBadge?: string
  companyName?: string
  rawRecord: any
}

export default function History() {
  const { user } = useAuth()
  const { loadAnalysis: loadEnergyAnalysis } = useEnergy()
  const { loadAnalysis: loadSolarAnalysis } = useSolar()
  const { loadAnalysis: loadEfficiencyAnalysis } = useEfficiency()
  const { loadAnalysis: loadHybridAnalysis } = useHybrid()
  const navigate = useNavigate()

  const [allAnalyses, setAllAnalyses] = useState<UnifiedAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedType, setSelectedType] = useState<AnalysisType>('all')

  const fetchHistory = async () => {
    if (!user) return

    try {
      let filter = ''
      if (user.role !== 'User_elektra') {
        filter = `company = "${user.company}"`
      }

      const [energyRecords, ucRecords, effRecords, hybridRecords] = await Promise.all([
        pb
          .collection('energy_analyses')
          .getFullList({
            sort: '-created',
            filter,
            expand: 'company',
          })
          .catch(() => []),
        pb
          .collection('uc_analyses')
          .getFullList({
            sort: '-created',
            filter,
            expand: 'company',
          })
          .catch(() => []),
        pb
          .collection('efficiency_analyses')
          .getFullList({
            sort: '-created',
            filter,
            expand: 'company',
          })
          .catch(() => []),
        pb
          .collection('hybrid_analyses')
          .getFullList({
            sort: '-created',
            filter,
            expand: 'company',
          })
          .catch(() => []),
      ])

      const list: UnifiedAnalysis[] = []

      // 1. Balanço Energético & Geração
      energyRecords.forEach((r) => {
        const isEff = r.mode === 'efficiency'
        list.push({
          id: r.id,
          collection: 'energy_analyses',
          typeLabel: 'Balanço & Geração',
          created: r.created,
          consumerName: r.consumer_name || r.inputs?.consumerName || 'Não informado',
          ucNumber: r.uc_number || r.inputs?.ucNumber || 'N/A',
          extraBadge: isEff ? 'Com Eficiência' : 'Declarado',
          companyName: r.expand?.company?.name,
          rawRecord: r,
        })
      })

      // 2. UC (Consumo x Injetada)
      ucRecords.forEach((r) => {
        list.push({
          id: r.id,
          collection: 'uc_analyses',
          typeLabel: 'Consumo x Injetada',
          created: r.created,
          consumerName: r.consumer_name || 'Não informado',
          ucNumber: r.uc_number || 'N/A',
          companyName: r.expand?.company?.name,
          rawRecord: r,
        })
      })

      // 3. Eficiência Energética isolada
      effRecords.forEach((r) => {
        list.push({
          id: r.id,
          collection: 'efficiency_analyses',
          typeLabel: 'Eficiência Energética',
          created: r.created,
          consumerName: r.report_data?.consumerName || 'Não informado',
          extraBadge: r.city_name ? `${r.city_name}-${r.state}` : undefined,
          companyName: r.expand?.company?.name,
          rawRecord: r,
        })
      })

      // 4. Sistema Híbrido
      hybridRecords.forEach((r) => {
        list.push({
          id: r.id,
          collection: 'hybrid_analyses',
          typeLabel: 'Sistema Híbrido',
          created: r.created,
          consumerName: r.customer_name || 'Não informado',
          extraBadge: r.battery_type || undefined,
          companyName: r.expand?.company?.name,
          rawRecord: r,
        })
      })

      // Ordenar decrescente pela data de criação
      list.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      setAllAnalyses(list)
    } catch (error) {
      console.error('Error fetching unified history:', error)
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

  useRealtime('uc_analyses', () => {
    fetchHistory()
  })

  useRealtime('efficiency_analyses', () => {
    fetchHistory()
  })

  useRealtime('hybrid_analyses', () => {
    fetchHistory()
  })

  const filteredAnalyses = allAnalyses.filter((item) => {
    // Filtro por tipo
    if (selectedType === 'energy' && item.collection !== 'energy_analyses') return false
    if (selectedType === 'uc' && item.collection !== 'uc_analyses') return false
    if (selectedType === 'efficiency' && item.collection !== 'efficiency_analyses') return false
    if (selectedType === 'hybrid' && item.collection !== 'hybrid_analyses') return false

    // Busca por notas/observação também
    const notesText = item.rawRecord?.notes || item.rawRecord?.inputs?.notes || ''
    const q = search.toLowerCase()
    if (!q) return true
    return (
      item.consumerName.toLowerCase().includes(q) ||
      (item.ucNumber && item.ucNumber.toLowerCase().includes(q)) ||
      item.typeLabel.toLowerCase().includes(q) ||
      notesText.toLowerCase().includes(q)
    )
  })

  const handleOpen = (item: UnifiedAnalysis) => {
    switch (item.collection) {
      case 'energy_analyses':
        loadEnergyAnalysis(item.rawRecord)
        navigate('/energy-analysis')
        break
      case 'uc_analyses':
        loadSolarAnalysis(item.rawRecord)
        navigate('/uc-analysis')
        break
      case 'efficiency_analyses':
        loadEfficiencyAnalysis(item.rawRecord)
        navigate('/efficiency-analysis')
        break
      case 'hybrid_analyses':
        loadHybridAnalysis(item.rawRecord)
        navigate('/hybrid-analysis')
        break
    }
  }

  const getTypeIcon = (collection: UnifiedAnalysis['collection']) => {
    switch (collection) {
      case 'energy_analyses':
        return <Zap className="h-4 w-4 text-primary" />
      case 'uc_analyses':
        return <SunMedium className="h-4 w-4 text-amber-500" />
      case 'efficiency_analyses':
        return <Gauge className="h-4 w-4 text-blue-500" />
      case 'hybrid_analyses':
        return <BatteryCharging className="h-4 w-4 text-emerald-500" />
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Histórico de Análises</h1>
        <p className="text-muted-foreground">
          {user?.role === 'User_elektra'
            ? 'Visualize e gerencie todos os relatórios gerados no sistema Elektra Insights.'
            : 'Visualize o histórico de relatórios gerados pela sua empresa.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Relatórios Gerados</CardTitle>
              <CardDescription>{filteredAnalyses.length} relatório(s) exibido(s)</CardDescription>
            </div>

            {/* Controles: Filtro por Tipo (Select) e Busca por Nome/UC */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full sm:w-auto">
              <div className="w-full sm:w-56">
                <Select
                  value={selectedType}
                  onValueChange={(val) => setSelectedType(val as AnalysisType)}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos ({allAnalyses.length})</SelectItem>
                    <SelectItem value="energy">
                      Balanço & Geração (
                      {allAnalyses.filter((a) => a.collection === 'energy_analyses').length})
                    </SelectItem>
                    <SelectItem value="uc">
                      Consumo x Injetada (
                      {allAnalyses.filter((a) => a.collection === 'uc_analyses').length})
                    </SelectItem>
                    <SelectItem value="efficiency">
                      Eficiência Energética (
                      {allAnalyses.filter((a) => a.collection === 'efficiency_analyses').length})
                    </SelectItem>
                    <SelectItem value="hybrid">
                      Sistema Híbrido (
                      {allAnalyses.filter((a) => a.collection === 'hybrid_analyses').length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou UC..."
                  className="pl-8 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnalyses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              <FileText className="mx-auto h-12 w-12 opacity-20 mb-4" />
              <p className="font-medium">Nenhum relatório encontrado para o filtro atual.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente ajustar a busca ou alterar o filtro de tipo acima.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo de Relatório</TableHead>
                    <TableHead>Cliente / Consumidor</TableHead>
                    <TableHead>UC</TableHead>
                    <TableHead>Detalhes</TableHead>
                    {user?.role === 'User_elektra' && <TableHead>Empresa</TableHead>}
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((item) => (
                    <TableRow key={`${item.collection}-${item.id}`}>
                      <TableCell className="font-medium whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(item.created), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.collection)}
                          <span className="font-medium text-sm">{item.typeLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.consumerName}</TableCell>
                      <TableCell>{item.ucNumber || '-'}</TableCell>
                      <TableCell>
                        {item.extraBadge ? (
                          <Badge variant="outline" className="text-xs">
                            {item.extraBadge}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {user?.role === 'User_elektra' && (
                        <TableCell className="text-xs text-muted-foreground">
                          {item.companyName || 'N/A'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpen(item)}
                          className="hover:text-primary hover:bg-primary/10"
                        >
                          <Edit className="h-3.5 w-3.5 mr-1.5" />
                          Reabrir para Edição
                        </Button>
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
