import { useHybrid, type BatteryType } from '@/stores/hybrid-context'
import type { HybridLoad } from '@/services/hybrid-analyses'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, BatteryCharging, Zap } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface HybridEntryFormProps {
  onSuccess?: () => void
}

export function HybridEntryForm({ onSuccess }: HybridEntryFormProps) {
  const { customerName, setCustomerName, batteryType, setBatteryType, loads, setLoads, calculate } =
    useHybrid()

  const addLoad = () => {
    setLoads([...loads, { id: crypto.randomUUID(), description: '', power: 0, hours: 0 }])
  }

  const removeLoad = (id: string) => {
    setLoads(loads.filter((l) => l.id !== id))
  }

  const updateLoad = (id: string, field: keyof HybridLoad, value: string | number) => {
    setLoads(loads.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  const handleCalculate = async () => {
    await calculate()
    toast.success('Análise de sistema híbrido gerada com sucesso!')
    if (onSuccess) onSuccess()
  }

  const validLoads = loads.filter((l) => l.description.trim() && l.power > 0 && l.hours > 0)

  return (
    <div className="flex flex-col space-y-6 pb-2">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Nome do Cliente</Label>
          <Input
            type="text"
            placeholder="Ex: João da Silva"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">
            Tipo de Bateria (Lítio 48V)
          </Label>
          <Select value={batteryType} onValueChange={(val) => setBatteryType(val as BatteryType)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100Ah">100Ah — 4.320 Wh útil</SelectItem>
              <SelectItem value="200Ah">200Ah — 8.640 Wh útil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold border-b pb-2">Cargas Críticas</h3>
          {loads.map((load) => (
            <div
              key={load.id}
              className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end bg-background p-4 rounded-xl border shadow-sm transition-all hover:border-primary/40"
            >
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Descrição</Label>
                <Input
                  type="text"
                  placeholder="Ex: Geladeira"
                  value={load.description}
                  onChange={(e) => updateLoad(load.id, 'description', e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Potência (W)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex: 150"
                  value={load.power === 0 ? '' : load.power}
                  onChange={(e) => updateLoad(load.id, 'power', Number(e.target.value))}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Horas (h)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ex: 24"
                  value={load.hours === 0 ? '' : load.hours}
                  onChange={(e) => updateLoad(load.id, 'hours', Number(e.target.value))}
                  className="h-12 text-base"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeLoad(load.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full mt-4 h-12 border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors"
            onClick={addLoad}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Carga
          </Button>
        </div>
      </div>

      <div className="pt-6 border-t mt-4">
        <Button
          className="w-full h-14 text-lg font-semibold hover:scale-[1.02] transition-transform shadow-md"
          size="lg"
          onClick={handleCalculate}
          disabled={!customerName || validLoads.length === 0}
        >
          <Zap className="h-6 w-6 mr-2" /> Gerar Análise Híbrida
        </Button>
      </div>
    </div>
  )
}
