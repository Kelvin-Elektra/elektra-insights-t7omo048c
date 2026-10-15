import { useEnergy, EnergyEntry } from '@/stores/energy-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Trash2, Zap, AlertCircle, SunMedium, Gauge } from 'lucide-react'
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

export interface EnergyEntryFormProps {
  onSuccess?: () => void
}

export function EnergyEntryForm({ onSuccess }: EnergyEntryFormProps) {
  const {
    isEfficiencyMode,
    setIsEfficiencyMode,
    consumerName,
    setConsumerName,
    ucNumber,
    setUcNumber,
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
  } = useEnergy()

  const [states, setStates] = useState<string[]>([])
  const [cityRecords, setCityRecords] = useState<HspData[]>([])
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  const handleCitySelect = (city: string) => {
    if (!city) {
      clearLocation()
      return
    }
    const record = cityRecords.find((r) => r.city === city)
    if (record) {
      selectLocation(record)
    } else {
      setCityName(city)
    }
  }

  const handleGenerateReport = async () => {
    try {
      setSubmitting(true)
      await generateReport()
      toast.success('Relatório de balanço e geração gerado com sucesso!')
      if (onSuccess) onSuccess()
    } catch (e) {
      console.error(e)
      toast.error('Erro ao gerar relatório.')
    } finally {
      setSubmitting(false)
    }
  }

  const addRow = () => {
    const last = draftEntries[draftEntries.length - 1]
    let nextMonth = '01'
    let nextYear = String(new Date().getFullYear())
    if (last) {
      const m = parseInt(last.month) || 1
      const y = parseInt(last.year) || new Date().getFullYear()
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
      {
        id: crypto.randomUUID(),
        month: nextMonth,
        year: nextYear,
        consumption: 0,
        received: 0,
        generation: 0,
      },
    ])
  }

  const removeRow = (id: string) => {
    setDraftEntries(draftEntries.filter((e) => e.id !== id))
  }

  const updateRow = (id: string, field: keyof EnergyEntry, value: string | number) => {
    setDraftEntries(draftEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  const isFormValid = () => {
    if (draftEntries.length === 0) return false
    if (!consumerName.trim()) return false
    if (isEfficiencyMode) {
      if (!cityName || !state || kitPower <= 0 || expectedAvgGeneration <= 0) {
        return false
      }
    }
    return true
  }

  return (
    <div className="flex flex-col space-y-6 pb-2">
      {/* Toggle de Modo: Eficiência x Declaração direta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 bg-muted/20 border-primary/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {isEfficiencyMode ? (
              <Gauge className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <SunMedium className="h-5 w-5 text-amber-500 shrink-0" />
            )}
            <Label htmlFor="mode-switch" className="text-base font-semibold cursor-pointer">
              {isEfficiencyMode ? 'Análise de Eficiência Ativada' : 'Modo: Declarar Geração Direta'}
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            {isEfficiencyMode
              ? 'Calcula HSP por município, geração projetada e IDM real/projetado.'
              : 'Modo simplificado: cruza consumo x injetada x geração informada, sem motor de HSP.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            {isEfficiencyMode ? 'Eficiência' : 'Declarar'}
          </span>
          <Switch
            id="mode-switch"
            checked={isEfficiencyMode}
            onCheckedChange={setIsEfficiencyMode}
          />
        </div>
      </div>

      {loadError && isEfficiencyMode && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Erro ao carregar dados de HSP. Verifique sua conexão.
        </div>
      )}

      {/* Dados do Cliente e UC */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="consumerName" className="text-xs font-semibold text-muted-foreground">
              Nome do Consumidor / Cliente <span className="text-destructive">*</span>
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
              Unidade Consumidora (UC)
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

        {/* Campos de Eficiência — Exibidos apenas quando o modo de eficiência está ativo */}
        {isEfficiencyMode && (
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Gauge className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Parâmetros do Kit e Localização Solar (HSP)</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Estado (UF) <span className="text-destructive">*</span>
                </Label>
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
                      placeholder={loadingStates ? 'Carregando estados...' : 'Selecione o estado'}
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
                <Label className="text-xs font-semibold text-muted-foreground">
                  Cidade <span className="text-destructive">*</span>
                </Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Potência do Kit (kWp) <span className="text-destructive">*</span>
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
                  Geração Média Esperada (kWh/mês) <span className="text-destructive">*</span>
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
                    HSP anual de {hspRecord.city}: {normalizeHsp(hspRecord.annual).toFixed(2)}{' '}
                    kWh/m²/dia
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Lançamento dos Meses (Consumo, Injetada e Geração) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-base font-semibold">Dados Mensais do Período</h3>
            <span className="text-xs text-muted-foreground">
              {draftEntries.length} {draftEntries.length === 1 ? 'mês' : 'meses'}
            </span>
          </div>

          {draftEntries.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10 px-4 border-2 border-dashed rounded-xl bg-muted/30">
              Nenhum dado mensal informado. Adicione meses para iniciar a análise.
            </div>
          ) : (
            <div className="space-y-3">
              {draftEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 sm:grid-cols-[1.4fr_1.2fr_1.2fr_1.2fr_auto] gap-3 items-end bg-background p-3.5 rounded-xl border shadow-sm transition-all hover:border-primary/40"
                >
                  {/* Competência (Mês / Ano) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Competência
                    </Label>
                    <div className="flex gap-1.5">
                      <Select
                        value={entry.month}
                        onValueChange={(val) => updateRow(entry.id, 'month', val)}
                      >
                        <SelectTrigger className="h-10 text-sm">
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
                        value={entry.year}
                        onValueChange={(val) => updateRow(entry.id, 'year', val)}
                      >
                        <SelectTrigger className="h-10 text-sm">
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

                  {/* Consumo */}
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
                      className="h-10 text-sm font-medium"
                    />
                  </div>

                  {/* Energia Injetada */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Injetada (kWh)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 300"
                      value={entry.received === 0 ? '' : entry.received}
                      onChange={(e) => updateRow(entry.id, 'received', Number(e.target.value))}
                      className="h-10 text-sm font-medium"
                    />
                  </div>

                  {/* Geração Real ou Declarada */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      {isEfficiencyMode ? 'Geração Real (kWh)' : 'Geração Declarada (kWh)'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Ex: 500"
                      value={entry.generation === 0 ? '' : entry.generation}
                      onChange={(e) => updateRow(entry.id, 'generation', Number(e.target.value))}
                      className="h-10 text-sm font-medium"
                    />
                  </div>

                  {/* Botão de Remover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
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
            className="w-full h-11 border-dashed hover:bg-muted/50 hover:border-primary/50 transition-colors"
            onClick={addRow}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Mês
          </Button>
        </div>
      </div>

      {/* Botão Principal de Gerar Análise */}
      <div className="pt-4 border-t mt-4">
        <Button
          className="w-full h-13 text-base font-semibold hover:scale-[1.01] transition-transform shadow-md"
          size="lg"
          onClick={handleGenerateReport}
          disabled={!isFormValid() || submitting}
        >
          <Zap className="h-5 w-5 mr-2" />
          {submitting ? 'Gerando Análise...' : 'Gerar Relatório Completo'}
        </Button>
      </div>
    </div>
  )
}
