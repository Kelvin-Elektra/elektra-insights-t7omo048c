import { useEfficiency, EfficiencyEntry } from '@/stores/efficiency-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Zap, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { getStates, getCitiesByState, normalizeHsp, type HspData } from '@/services/hsp-data'
import { Combobox } from '@/components/ui/combobox'

export interface EfficiencyEntryFormProps {
  onSuccess?: () => void
}

export function EfficiencyEntryForm({ onSuccess }: EfficiencyEntryFormProps) {
  const {
    consumerName,
    setConsumerName,
    cityName,
    setCityName,
    state,
    setState,
    kitPower,
    setKitPower,
    expectedAvgGeneration,
    setExpectedAvgGeneration,
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

  const handleCitySelect = (city: string) => {
    if (!city) {
      clearLocation()
      return
    }
    const record = cityRecords.find((r) => r.city === city)
    if (record) {
      selectLocation(record)
    } else {
      // Fallback if not found in list for any reason
      setCityName(city)
    }
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
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Nome do Cliente</Label>
          <Input
            type="text"
            placeholder="Ex: João da Silva"
            value={consumerName}
            onChange={(e) => setConsumerName(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Estado</Label>
            <Select
              value={state}
              onValueChange={(val) => {
                setState(val)
                clearLocation()
              }}
              disabled={loadingStates || states.length === 0}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue
                  placeholder={loadingStates ? 'Carregando estados...' : 'Selecione o estado (UF)'}
                />
              </SelectTrigger>
              <SelectContent>
                {states.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Cidade</Label>
            <Select
              value={cityName}
              onValueChange={handleCitySelect}
              disabled={!state || loadingCities || cityRecords.length === 0}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue
                  placeholder={
                    !state
                      ? 'Selecione o estado primeiro'
                      : loadingCities
                        ? 'Carregando cidades...'
                        : cityRecords.length === 0
                          ? 'Nenhuma cidade encontrada'
                          : 'Selecione a cidade'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cityRecords.map((c) => (
                  <SelectItem key={c.id || `${c.state}-${c.city}`} value={c.city}>
                    {c.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label className="text-xs font-semibold text-muted-foreground">
              Geração Média Esperada (kWh/mês)
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex: 450"
              value={expectedAvgGeneration === 0 ? '' : expectedAvgGeneration}
              onChange={(e) => setExpectedAvgGeneration(Number(e.target.value))}
              className="h-9 text-sm"
            />
            {hspRecord && (
              <p className="text-xs text-muted-foreground">
                HSP anual: {normalizeHsp(hspRecord.annual).toFixed(2)} kWh/m²/dia
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
          disabled={
            !consumerName ||
            !cityName ||
            !state ||
            kitPower <= 0 ||
            expectedAvgGeneration <= 0 ||
            draftEntries.length === 0
          }
        >
          <Zap className="h-6 w-6 mr-2" /> Gerar Análise de Eficiência
        </Button>
      </div>
    </div>
  )
}
