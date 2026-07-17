import { useEfficiency, EfficiencyEntry } from '@/stores/efficiency-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Zap, Calculator, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { getStates, getCitiesByState, type HspData } from '@/services/hsp-data'
import { Combobox } from '@/components/ui/combobox'

export interface EfficiencyEntryFormProps {
  onSuccess?: () => void
}

export function EfficiencyEntryForm({ onSuccess }: EfficiencyEntryFormProps) {
  const {
    cityName,
    state,
    setState,
    kitPower,
    setKitPower,
    expectedAvgGeneration,
    draftEntries,
    setDraftEntries,
    generateReport,
    selectLocation,
    clearLocation,
    hspRecord,
  } = useEfficiency()

  const [states, setStates] = useState<string[]>([])
  const [cityRecords, setCityRecords] = useState<HspData[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    getStates()
      .then(setStates)
      .catch(() => setLoadError(true))
      .finally(() => setLoadingStates(false))
  }, [])

  useEffect(() => {
    if (state) {
      setLoadingCities(true)
      getCitiesByState(state)
        .then(setCityRecords)
        .catch(() => setLoadError(true))
        .finally(() => setLoadingCities(false))
    } else {
      setCityRecords([])
    }
  }, [state])

  const handleGenerateReport = async () => {
    await generateReport()
    toast.success('Análise de eficiência gerada com sucesso!')
    if (onSuccess) onSuccess()
  }

  const addRow = () => {
    const last = draftEntries[draftEntries.length - 1]
    let nextMonth = '01'
    let nextYear = String(new Date().getFullYear())
    if (last) {
      const m = parseInt(last.month)
      const y = parseInt(last.year)
      if (m === 1) {
        nextMonth = '12'
        nextYear = String(y - 1)
      } else {
        nextMonth = String(m - 1).padStart(2, '0')
        nextYear = String(y)
      }
    }
    setDraftEntries([
      ...draftEntries,
      { id: crypto.randomUUID(), month: nextMonth, year: nextYear, real_generation: 0 },
    ])
  }

  const removeRow = (id: string) => setDraftEntries(draftEntries.filter((e) => e.id !== id))
  const updateRow = (id: string, field: keyof EfficiencyEntry, value: string | number) =>
    setDraftEntries(draftEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))

  const stateOptions = states.map((s) => ({ value: s, label: s }))
  const cityOptions = cityRecords.map((c) => ({ value: c.city, label: c.city }))

  const handleCitySelect = (city: string) => {
    if (!city) {
      clearLocation()
      return
    }
    const record = cityRecords.find((r) => r.city === city)
    if (record) selectLocation(record)
  }

  return (
    <div className="flex flex-col space-y-6 pb-2">
      <div className="space-y-6">
        {loadError && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Erro ao carregar os dados. Verifique sua conexão e tente novamente.
          </div>
        )}
        {!loadError && states.length === 0 && !loadingStates && (
          <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
            Nenhum dado de HSP encontrado. Importe os dados de irradiação solar na coleção
            &quot;hsp_data&quot;.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Estado</Label>
            <Combobox
              options={stateOptions}
              value={state}
              onChange={(v) => {
                setState(v)
                clearLocation()
              }}
              placeholder="Buscar estado..."
              searchPlaceholder="Digite a UF (ex: SP)..."
              emptyMessage="Estado não encontrado na base de dados HSP"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Cidade</Label>
            <Combobox
              options={cityOptions}
              value={cityName}
              onChange={handleCitySelect}
              placeholder="Buscar cidade..."
              searchPlaceholder="Digite o nome da cidade..."
              emptyMessage="Localidade não encontrada na base de dados HSP"
              disabled={!state || loadingCities}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Potência do Kit (kWp)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 5.5"
              value={kitPower === 0 ? '' : kitPower}
              onChange={(e) => setKitPower(Number(e.target.value))}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calculator className="h-3 w-3" /> Geração Média Esperada (kWh/mês)
            </Label>
            <Input
              type="number"
              readOnly
              value={expectedAvgGeneration || ''}
              placeholder="Auto-calculado via HSP"
              className="h-9 text-sm bg-muted/50 cursor-not-allowed"
            />
            {hspRecord && (
              <p className="text-xs text-muted-foreground">
                HSP anual: {(hspRecord.annual / 1000).toFixed(3)} kWh/m²/dia · Fator:{' '}
                {EFFICIENCY_FACTOR_DISPLAY}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-base font-semibold border-b pb-2">Geração Real por Mês</h3>
          {draftEntries.map((entry) => (
            <div
              key={entry.id}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr_auto] gap-4 items-end bg-background p-4 rounded-xl border shadow-sm transition-all hover:border-primary/40"
            >
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Mês</Label>
                <Select
                  value={entry.month}
                  onValueChange={(val) => updateRow(entry.id, 'month', val)}
                >
                  <SelectTrigger className="h-12 w-full text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const v = String(i + 1).padStart(2, '0')
                      return (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">Ano</Label>
                <Select
                  value={entry.year}
                  onValueChange={(val) => updateRow(entry.id, 'year', val)}
                >
                  <SelectTrigger className="h-12 w-full text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }).map((_, i) => {
                      const y = String(new Date().getFullYear() - i)
                      return (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-muted-foreground">
                  Geração Real (kWh)
                </Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Ex: 550"
                  value={entry.real_generation === 0 ? '' : entry.real_generation}
                  onChange={(e) => updateRow(entry.id, 'real_generation', Number(e.target.value))}
                  className="h-12 text-lg font-medium"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => removeRow(entry.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
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
          disabled={!cityName || !state || kitPower <= 0}
        >
          <Zap className="h-6 w-6 mr-2" /> Gerar Análise de Eficiência
        </Button>
      </div>
    </div>
  )
}

const EFFICIENCY_FACTOR_DISPLAY = '78%'
