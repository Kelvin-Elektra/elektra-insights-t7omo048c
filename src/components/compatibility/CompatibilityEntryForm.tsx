import { useCompatibility, TARIFF_CLASSES } from '@/stores/compatibility-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Zap, FileText, Sun } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface CompatibilityEntryFormProps {
  onSuccess?: () => void
}

export function CompatibilityEntryForm({ onSuccess }: CompatibilityEntryFormProps) {
  const {
    consumerName,
    setConsumerName,
    avgConsumption,
    setAvgConsumption,
    tariffClass,
    setTariffClass,
    hasDaytimeMetering,
    setHasDaytimeMetering,
    daytimeConsumption,
    setDaytimeConsumption,
    notes,
    setNotes,
    calculate,
  } = useCompatibility()

  const handleCalculate = () => {
    const ok = calculate()
    if (!ok) {
      toast.error('Preencha todos os campos obrigatórios com valores válidos.')
      return
    }
    toast.success('Análise de Compatibilidade de Consumo gerada com sucesso!')
    if (onSuccess) onSuccess()
  }

  return (
    <div className="flex flex-col space-y-6 pb-2">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Nome do Consumidor</Label>
          <Input
            type="text"
            placeholder="Ex: João da Silva"
            value={consumerName}
            onChange={(e) => setConsumerName(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Consumo médio mensal dos últimos 12 meses (kWh)
          </Label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Ex: 706,5"
            value={avgConsumption}
            onChange={(e) => setAvgConsumption(e.target.value)}
            className="h-9 text-sm"
          />
          <p className="text-[11px] text-muted-foreground">
            Aceita vírgula ou ponto como decimal (ex.: 706,5 ou 706.5).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Classe tarifária</Label>
          <Select value={tariffClass} onValueChange={(val) => setTariffClass(val)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecione a classe" />
            </SelectTrigger>
            <SelectContent>
              {TARIFF_CLASSES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label} — FA {(c.fa * 100).toLocaleString('pt-BR')}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item 8.16 — medição de consumo diurno (opcional) */}
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <Sun className="h-4 w-4 text-primary" />
                Possui medição de consumo diurno (6h–18h)?
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Item 8.16: com medição diurna, o cálculo usa o consumo diurno e não aplica o fator
                de ajuste (FA).
              </p>
            </div>
            <Switch checked={hasDaytimeMetering} onCheckedChange={setHasDaytimeMetering} />
          </div>
          {hasDaytimeMetering && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Consumo médio diurno dos últimos 12 meses (kWh/mês)
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 400"
                value={daytimeConsumption}
                onChange={(e) => setDaytimeConsumption(e.target.value)}
                className="h-9 text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Aceita vírgula ou ponto como decimal (ex.: 400,5 ou 400.5).
              </p>
            </div>
          )}
        </div>

        {/* Campo Observação */}
        <div className="space-y-1.5 pt-2 border-t">
          <Label
            htmlFor="compatibility-notes"
            className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" /> Observação / Notas do Relatório
          </Label>
          <Textarea
            id="compatibility-notes"
            placeholder="Informações adicionais, parecer técnico, recomendações ou ressalvas sobre esta análise..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <p className="text-[11px] text-muted-foreground">
            Este texto será salvo junto com os dados e exibido ao final do relatório e no PDF
            gerado.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t mt-4">
        <Button
          className="w-full h-14 text-lg font-semibold hover:scale-[1.02] transition-transform shadow-md"
          size="lg"
          onClick={handleCalculate}
          disabled={!consumerName.trim() || !avgConsumption.trim() || !tariffClass}
        >
          <Zap className="h-6 w-6 mr-2" /> Gerar Análise de Compatibilidade
        </Button>
      </div>
    </div>
  )
}
