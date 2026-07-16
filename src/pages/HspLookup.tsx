import { useState, useEffect, useMemo } from 'react'
import { Search, Sun, MapPin, Loader2, CalendarDays, Gauge } from 'lucide-react'
import {
  getStates,
  getCitiesByState,
  getHspByCity,
  normalizeHsp,
  type HspData,
} from '@/services/hsp-data'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const MONTHS = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Fev' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Abr' },
  { key: 'may', label: 'Mai' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Ago' },
  { key: 'sep', label: 'Set' },
  { key: 'oct', label: 'Out' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Dez' },
] as const

export default function HspLookup() {
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<HspData[]>([])
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [hspRecord, setHspRecord] = useState<HspData | null>(null)
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingHsp, setLoadingHsp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getStates()
      .then((data) => {
        setStates(data)
        if (data.length === 0) setError('Nenhum dado de HSP encontrado no sistema.')
      })
      .catch(() => setError('Erro ao carregar os estados.'))
      .finally(() => setLoadingStates(false))
  }, [])

  useEffect(() => {
    if (!selectedState) {
      setCities([])
      setSelectedCity('')
      setHspRecord(null)
      return
    }
    setLoadingCities(true)
    setSelectedCity('')
    setHspRecord(null)
    getCitiesByState(selectedState)
      .then(setCities)
      .catch(() => setError('Erro ao carregar as cidades.'))
      .finally(() => setLoadingCities(false))
  }, [selectedState])

  useEffect(() => {
    if (!selectedCity || !selectedState) {
      setHspRecord(null)
      return
    }
    setLoadingHsp(true)
    setError(null)
    getHspByCity(selectedCity, selectedState)
      .then(setHspRecord)
      .catch(() => setError('Não foi possível encontrar dados de HSP para esta cidade.'))
      .finally(() => setLoadingHsp(false))
  }, [selectedCity, selectedState])

  const annualNormalized = useMemo(() => {
    if (!hspRecord) return null
    return normalizeHsp(hspRecord.annual).toFixed(3)
  }, [hspRecord])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sun className="h-7 w-7 text-amber-500" />
          Consulta de HSP
        </h1>
        <p className="text-muted-foreground mt-1">
          Verifique os dados de irradiação solar (HSP) por estado e cidade.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Selecionar Localização
          </CardTitle>
          <CardDescription>Escolha um estado e uma cidade para consultar os dados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Estado (UF)</label>
              {loadingStates ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Cidade</label>
              {loadingCities ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                  disabled={!selectedState || cities.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        !selectedState
                          ? 'Selecione um estado primeiro'
                          : cities.length === 0
                            ? 'Nenhuma cidade encontrada'
                            : 'Selecione uma cidade'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.city}>
                        {c.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {loadingHsp && (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando dados de HSP...</p>
          </CardContent>
        </Card>
      )}

      {hspRecord && !loadingHsp && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-sm border-primary/20">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <Gauge className="h-4 w-4" />
                  HSP Anual
                </CardDescription>
                <CardTitle className="text-3xl font-bold text-primary">
                  {annualNormalized}
                  <span className="text-base font-normal text-muted-foreground ml-1">
                    kWh/m²/dia
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <CalendarDays className="h-4 w-4" />
                  Localização
                </CardDescription>
                <CardTitle className="text-xl font-bold">
                  {hspRecord.city}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {hspRecord.state}
                  </span>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Dados Mensais de HSP</CardTitle>
              <CardDescription>
                Valores de irradiação solar por mês (normalizados para kWh/m²/dia).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {MONTHS.map((month) => {
                  const rawValue = hspRecord[month.key as keyof HspData] as number
                  const normalized = normalizeHsp(rawValue)
                  return (
                    <div
                      key={month.key}
                      className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 px-3 py-4 transition-colors hover:bg-primary/5 hover:border-primary/30"
                    >
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {month.label}
                      </span>
                      <span className="text-lg font-bold text-foreground mt-1">
                        {normalized > 0 ? normalized.toFixed(3) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!hspRecord && !loadingHsp && !error && !loadingStates && (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
            <Search className="h-12 w-12 text-muted-foreground/40" />
            <div>
              <p className="text-lg font-medium text-muted-foreground">Nenhum dado selecionado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Selecione um estado e uma cidade para visualizar os dados de HSP.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
