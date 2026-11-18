import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

/** Fator de capacidade solar (art. 655-B REN 1.000/2021): 16% → denominador fixo 0,16 × 24 × 30 = 115,2 */
export const DENOMINATOR = 0.16 * 24 * 30 // 115,2

export interface TariffClass {
  value: string
  label: string
  fa: number
}

/** Fatores de ajuste (FA) do Anexo II (itens 8.12 a 8.19 do Manual do art. 73, §1º). Item 8.18: poder público usa o FA do comércio (0,63). */
export const TARIFF_CLASSES: TariffClass[] = [
  { value: 'residencial', label: 'Residencial', fa: 0.46 },
  { value: 'comercial', label: 'Comercial, serviços e outras atividades', fa: 0.63 },
  { value: 'industrial', label: 'Industrial', fa: 0.69 },
  { value: 'rural', label: 'Rural', fa: 0.53 },
  { value: 'servico_publico', label: 'Serviço público', fa: 0.57 },
  { value: 'poder_publico', label: 'Poder público (usa o FA do comércio — item 8.18)', fa: 0.63 },
]

/** Aceita vírgula OU ponto como decimal ("706,5" e "706.5"); com ambos, o ponto é milhar ("4.360,5"). */
export const normalizeNumber = (value: string): number => {
  if (!value || !value.trim()) return NaN
  const trimmed = value.replace(/\s/g, '')
  const hasComma = trimmed.includes(',')
  const hasDot = trimmed.includes('.')
  const normalized =
    hasComma && hasDot ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed.replace(',', '.')
  const parsed = Number(normalized)
  return isNaN(parsed) ? NaN : parsed
}

export interface CompatibilityCalculation {
  /** Fator de ajuste da classe (Anexo II) */
  fa: number
  /** Caminho normal: C / 115,2 × FA */
  exactFa: number
  roundedFa: number
  /** Caminho item 8.16: C_diurno / 115,2 (sem FA) — presente só quando houver medição diurna */
  exactDaytime: number | null
  roundedDaytime: number | null
}

export const calculateCompatibility = (
  avgConsumption: number,
  tariffClass: string,
  hasDaytimeMetering: boolean,
  daytimeConsumption: number,
): CompatibilityCalculation => {
  const klass = TARIFF_CLASSES.find((c) => c.value === tariffClass)
  const fa = klass?.fa ?? 0.46

  const exactFa = (avgConsumption / DENOMINATOR) * fa
  const exactDaytime = hasDaytimeMetering ? daytimeConsumption / DENOMINATOR : null

  return {
    fa,
    exactFa,
    roundedFa: Math.ceil(exactFa),
    exactDaytime,
    roundedDaytime: exactDaytime !== null ? Math.ceil(exactDaytime) : null,
  }
}

export interface CompatibilityContextType {
  consumerName: string
  setConsumerName: React.Dispatch<React.SetStateAction<string>>
  avgConsumption: string
  setAvgConsumption: React.Dispatch<React.SetStateAction<string>>
  tariffClass: string
  setTariffClass: React.Dispatch<React.SetStateAction<string>>
  hasDaytimeMetering: boolean
  setHasDaytimeMetering: React.Dispatch<React.SetStateAction<boolean>>
  daytimeConsumption: string
  setDaytimeConsumption: React.Dispatch<React.SetStateAction<string>>
  notes: string
  setNotes: React.Dispatch<React.SetStateAction<string>>
  results: CompatibilityCalculation | null
  currentAnalysisId: string | null
  calculate: () => boolean
  saveAnalysisToHistory: () => Promise<string>
  isSaving: boolean
  hasUnsavedChanges: boolean
  reset: () => void
  loadAnalysis: (record: any) => void
}

const CompatibilityContext = createContext<CompatibilityContextType | undefined>(undefined)

export const CompatibilityProvider = ({ children }: { children: ReactNode }) => {
  const [consumerName, setConsumerName] = useState('')
  const [avgConsumption, setAvgConsumption] = useState('')
  const [tariffClass, setTariffClass] = useState('')
  const [hasDaytimeMetering, setHasDaytimeMetering] = useState(false)
  const [daytimeConsumption, setDaytimeConsumption] = useState('')
  const [notes, setNotes] = useState('')
  const [results, setResults] = useState<CompatibilityCalculation | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  const calculate = useCallback((): boolean => {
    const avg = normalizeNumber(avgConsumption)
    if (!consumerName.trim() || isNaN(avg) || avg <= 0 || !tariffClass) return false

    let daytime: number | null = null
    if (hasDaytimeMetering) {
      daytime = normalizeNumber(daytimeConsumption)
      if (isNaN(daytime) || daytime <= 0) return false
    }

    setResults(calculateCompatibility(avg, tariffClass, hasDaytimeMetering, daytime ?? 0))
    setHasUnsavedChanges(true)
    return true
  }, [consumerName, avgConsumption, tariffClass, hasDaytimeMetering, daytimeConsumption])

  const saveAnalysisToHistory = useCallback(async (): Promise<string> => {
    setIsSaving(true)
    try {
      const avg = normalizeNumber(avgConsumption)
      const daytime = hasDaytimeMetering ? normalizeNumber(daytimeConsumption) : null
      const calc =
        results || calculateCompatibility(avg, tariffClass, hasDaytimeMetering, daytime ?? 0)
      const inputs = {
        consumerName,
        avgConsumption: avg,
        tariffClass,
        hasDaytimeMetering,
        daytimeConsumption: daytime ?? 0,
      }
      const payload = {
        company: pb.authStore.record?.company,
        user: pb.authStore.record?.id,
        consumer_name: consumerName,
        avg_consumption: avg,
        tariff_class: tariffClass,
        has_daytime_metering: hasDaytimeMetering,
        daytime_consumption: daytime ?? 0,
        inputs,
        results: calc,
        notes,
      }

      let savedId = currentAnalysisId
      if (currentAnalysisId) {
        await pb.collection('compatibility_analyses').update(currentAnalysisId, payload)
      } else {
        const record = await pb.collection('compatibility_analyses').create(payload)
        savedId = record.id
        setCurrentAnalysisId(record.id)
      }
      setHasUnsavedChanges(false)
      return savedId || ''
    } finally {
      setIsSaving(false)
    }
  }, [
    consumerName,
    avgConsumption,
    tariffClass,
    hasDaytimeMetering,
    daytimeConsumption,
    notes,
    results,
    currentAnalysisId,
  ])

  const reset = useCallback(() => {
    setCurrentAnalysisId(null)
    setConsumerName('')
    setAvgConsumption('')
    setTariffClass('')
    setHasDaytimeMetering(false)
    setDaytimeConsumption('')
    setNotes('')
    setResults(null)
    setHasUnsavedChanges(false)
  }, [])

  const loadAnalysis = useCallback((record: any) => {
    const inputs = record.inputs || {}
    setCurrentAnalysisId(record.id)
    setConsumerName(record.consumer_name || inputs.consumerName || '')
    setAvgConsumption(
      inputs.avgConsumption !== undefined
        ? String(inputs.avgConsumption)
        : String(record.avg_consumption ?? ''),
    )
    setTariffClass(record.tariff_class || inputs.tariffClass || '')
    const hasDay = record.has_daytime_metering ?? inputs.hasDaytimeMetering ?? false
    setHasDaytimeMetering(Boolean(hasDay))
    const dayValue = inputs.daytimeConsumption ?? record.daytime_consumption ?? 0
    setDaytimeConsumption(dayValue ? String(dayValue) : '')
    setNotes(record.notes || '')
    setResults(record.results || null)
    setHasUnsavedChanges(false)
  }, [])

  return (
    <CompatibilityContext.Provider
      value={{
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
        results,
        currentAnalysisId,
        calculate,
        saveAnalysisToHistory,
        isSaving,
        hasUnsavedChanges,
        reset,
        loadAnalysis,
      }}
    >
      {children}
    </CompatibilityContext.Provider>
  )
}

export const useCompatibility = () => {
  const context = useContext(CompatibilityContext)
  if (!context) throw new Error('useCompatibility must be used within CompatibilityProvider')
  return context
}
