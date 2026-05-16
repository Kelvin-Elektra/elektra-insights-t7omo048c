import { useSolar, SolarEntry } from '@/stores/solar-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface DataEntryFormProps {
  onSuccess?: () => void
}

export function DataEntryForm({ onSuccess }: DataEntryFormProps) {
  const {
    consumerName,
    setConsumerName,
    ucNumber,
    setUcNumber,
    draftEntries,
    setDraftEntries,
    generateReport,
  } = useSolar()

  const handleGenerateReport = async () => {
    await generateReport()
    toast.success('Relatório gerado e salvo com sucesso!')
    if (onSuccess) onSuccess()
  }

  const addRow = () => {
    const last = draftEntries[draftEntries.length - 1]
    let nextMonthStr = ''
    if (last && last.month.match(/^\d{2}\/\d{4}$/)) {
      const [m, y] = last.month.split('/')
      const d = new Date(parseInt(y), parseInt(m) - 2, 1)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      nextMonthStr = `${mm}/${yyyy}`
    } else {
      const d = new Date()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      nextMonthStr = `${mm}/${yyyy}`
    }
    setDraftEntries([
      ...draftEntries,
      { id: crypto.randomUUID(), month: nextMonthStr, consumption: 0, received: 0 },
    ])
  }

  const removeRow = (id: string) => {
    setDraftEntries(draftEntries.filter((e) => e.id !== id))
  }

  const updateRow = (id: string, field: keyof SolarEntry, value: string | number) => {
    setDraftEntries(draftEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div className="flex flex-col space-y-6 pb-2">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="consumerName" className="text-xs font-semibold text-muted-foreground">
              Nome do Consumidor
            </Label>
            <Input
              id="consumerName"
              placeholder="Ex: João da Silva"
              value={consumerName}
              onChange={(e) => setConsumerName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ucNumber" className="text-xs font-semibold text-muted-foreground">
              UC Analisada
            </Label>
            <Input
              id="ucNumber"
              placeholder="Ex: 12345678"
              value={ucNumber}
              onChange={(e) => setUcNumber(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold border-b pb-2">Histórico de Consumo</h3>

          {draftEntries.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12 px-4 border-2 border-dashed rounded-xl bg-muted/30">
              Nenhum dado inserido. Adicione um mês para começar a análise.
            </div>
          ) : (
            <div className="space-y-4">
              {draftEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 sm:grid-cols-[1.5fr_2fr_2fr_auto] gap-4 items-end animate-slide-down bg-background p-4 rounded-xl border shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Competência
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={entry.month.split('/')[0] || ''}
                        onValueChange={(val) => {
                          const [_, y] = entry.month.split('/')
                          updateRow(entry.id, 'month', `${val}/${y || new Date().getFullYear()}`)
                        }}
                      >
                        <SelectTrigger className="h-12 w-full text-base">
                          <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const val = String(i + 1).padStart(2, '0')
                            return (
                              <SelectItem key={val} value={val}>
                                {val}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>

                      <Select
                        value={entry.month.split('/')[1] || ''}
                        onValueChange={(val) => {
                          const [m, _] = entry.month.split('/')
                          updateRow(entry.id, 'month', `${m || '01'}/${val}`)
                        }}
                      >
                        <SelectTrigger className="h-12 w-full text-base">
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }).map((_, i) => {
                            const year = String(new Date().getFullYear() - i)
                            return (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Consumo (kWh)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 450"
                      value={entry.consumption === 0 ? '' : entry.consumption}
                      onChange={(e) => updateRow(entry.id, 'consumption', Number(e.target.value))}
                      className="h-12 text-lg font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-muted-foreground">
                      Energia Injetada (kWh)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 300"
                      value={entry.received === 0 ? '' : entry.received}
                      onChange={(e) => updateRow(entry.id, 'received', Number(e.target.value))}
                      className="h-12 text-lg font-medium"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:mt-0 mt-2"
                    onClick={() => removeRow(entry.id)}
                    title="Remover mês"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            className="w-full mt-4 h-12 border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors"
            onClick={addRow}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Mês Anterior
          </Button>
        </div>
      </div>
      <div className="pt-6 border-t mt-4">
        <Button
          className="w-full h-14 text-lg font-semibold hover:scale-[1.02] transition-transform shadow-md"
          size="lg"
          onClick={handleGenerateReport}
          disabled={draftEntries.length === 0}
        >
          <Zap className="h-6 w-6 mr-2" /> Gerar Relatório de Balanço
        </Button>
      </div>
    </div>
  )
}
