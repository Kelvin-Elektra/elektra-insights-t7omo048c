import { useSolar, SolarEntry } from '@/stores/solar-context'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Zap } from 'lucide-react'

export function DataEntryForm() {
  const { draftEntries, setDraftEntries, generateReport } = useSolar()

  const addRow = () => {
    setDraftEntries([
      ...draftEntries,
      { id: crypto.randomUUID(), month: '', consumption: 0, received: 0 },
    ])
  }

  const removeRow = (id: string) => {
    setDraftEntries(draftEntries.filter((e) => e.id !== id))
  }

  const updateRow = (id: string, field: keyof SolarEntry, value: string | number) => {
    setDraftEntries(draftEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <Card className="flex flex-col shadow-sm border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Dados de Consumo</CardTitle>
        <CardDescription>Insira o histórico de consumo e energia recebida por mês.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {draftEntries.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12 px-4 border-2 border-dashed rounded-xl bg-muted/30">
            Nenhum dado inserido. Adicione um mês para começar a análise.
          </div>
        ) : (
          <div className="space-y-3">
            {draftEntries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end animate-slide-down bg-background p-4 sm:p-3 rounded-lg border shadow-sm transition-all hover:border-primary/30"
              >
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Mês/Ano</Label>
                  <Input
                    type="month"
                    value={entry.month}
                    onChange={(e) => updateRow(entry.id, 'month', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Consumo (kWh)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 450"
                    value={entry.consumption === 0 ? '' : entry.consumption}
                    onChange={(e) => updateRow(entry.id, 'consumption', Number(e.target.value))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Recebida (kWh)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 300"
                    value={entry.received === 0 ? '' : entry.received}
                    onChange={(e) => updateRow(entry.id, 'received', Number(e.target.value))}
                    className="h-9 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:mt-0 mt-2"
                  onClick={() => removeRow(entry.id)}
                  title="Remover mês"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          className="w-full mt-4 border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors"
          onClick={addRow}
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Mês
        </Button>
      </CardContent>
      <CardFooter className="pt-4 border-t bg-muted/10 rounded-b-xl">
        <Button
          className="w-full hover:scale-[1.02] transition-transform shadow-md"
          size="lg"
          onClick={generateReport}
          disabled={draftEntries.length === 0}
        >
          <Zap className="h-5 w-5 mr-2" /> Gerar Relatório
        </Button>
      </CardFooter>
    </Card>
  )
}
