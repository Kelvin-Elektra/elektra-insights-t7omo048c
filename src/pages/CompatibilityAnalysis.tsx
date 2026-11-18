import { useState } from 'react'
import { useCompatibility } from '@/stores/compatibility-context'
import { CompatibilityEntryForm } from '@/components/compatibility/CompatibilityEntryForm'
import { CompatibilityDashboard } from '@/components/compatibility/CompatibilityDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Scale, FileText } from 'lucide-react'

export default function CompatibilityAnalysis() {
  const { results, currentAnalysisId } = useCompatibility()
  const [tab, setTab] = useState<string>('form')

  const handleSuccess = () => setTab('report')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <Scale className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Análise de Compatibilidade de Consumo
          </h1>
          <p className="text-sm text-muted-foreground">
            Limite de potência de microgeração — REN ANEEL 1.000/2021, art. 73-A, III
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="form" className="gap-1.5">
            <FileText className="h-4 w-4" /> Dados de Entrada
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1.5">
            Relatório
          </TabsTrigger>
        </TabsList>
        <TabsContent value="form">
          <CompatibilityEntryForm onSuccess={handleSuccess} />
        </TabsContent>
        <TabsContent value="report">
          <CompatibilityDashboard onOpenEdit={() => setTab('form')} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
