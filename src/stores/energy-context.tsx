import React, { createContext, useContext, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { getHspByCity, normalizeHsp, type HspData } from '@/services/hsp-data'

export interface EnergyEntry {
  id: string
  month: string // "01" .. "12"
  year: string // "2024" etc.
  consumption: number // Consumo da fatura
  received: number // Energia Injetada
  generation: number // Geração (real ou declarada)
}

export interface EnergyMonthlyReportItem {
  id: string
  month: string
  year: string
  month_label: string
  invoice_consumption: number // Consumo informado na fatura
  self_consumption: number // Autoconsumo: max(0, generation - received)
  real_consumption: number // Consumo Real: invoice_consumption + max(0, generation - received)
  consumption: number // Mantido como sinônimo de real_consumption para compatibilidade direta
  received: number
  generation: number // Real ou declarada
  deficit: number // max(0, invoice_consumption - received) -> o que ainda faltou compensar da fatura
  balance: number // generation - real_consumption (ou generation - invoice_consumption)
  // Campos preenchidos quando modo = 'efficiency'
  hsp_value?: number
  estimated_generation?: number // Geração projetada
  idm?: number // (generation / estimated_generation) * 100
  delta?: number // generation - estimated_generation
}

export interface IdealBreakdownItem {
  month: string
  days: number
  hsp: number
  ideal_generation: number
}

export interface AdjustedBreakdownItem {
  month: string
  days: number
  hsp: number
  adjusted_generation: number
}

export interface EnergyReport {
  mode: 'efficiency' | 'declared'
  consumerName: string
  ucNumber: string
  cityName?: string
  state?: string
  kitPower?: number
  expectedAvgGeneration?: number
  notes?: string
  items: EnergyMonthlyReportItem[]
  total_invoice_consumption: number // Total de consumo da fatura
  total_self_consumption: number // Total de autoconsumo: (geração - injetada)
  total_real_consumption: number // Total consumo real (fatura + autoconsumo)
  total_consumption: number // Total consumo real (compatibilidade)
  total_received: number
  total_generation: number
  total_deficit: number // soma dos déficits da fatura (consumo fatura - injetada)
  avg_invoice_consumption: number
  avg_self_consumption: number
  avg_real_consumption: number
  avg_consumption: number
  avg_received: number
  avg_generation: number
  avg_deficit: number
  coverage_percent: number // (total_received / total_invoice_consumption) * 100
  real_coverage_percent: number // (total_generation / total_real_consumption) * 100
  // Lógica de eficiência (quando modo = 'efficiency')
  total_projected?: number
  avg_idm?: number // (total_generation / total_projected) * 100
  total_delta?: number // total_generation - total_projected
  delta_percentage?: number
  ideal_breakdown?: IdealBreakdownItem[]
  adjusted_breakdown?: AdjustedBreakdownItem[]
  ideal_average?: number
  efficiency_factor?: number
  summary?: string
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]

const generateEfficiencySummary = (report: EnergyReport): string => {
  const {
    avg_idm = 0,
    total_generation,
    total_projected = 0,
    total_delta = 0,
    delta_percentage = 0,
    consumerName,
    items,
  } = report

  const periodLabel =
    items.length === 1
      ? items[0].month_label
      : `${items[items.length - 1].month_label} a ${items[0].month_label}`

  const performanceLevel =
    avg_idm >= 90
      ? 'excelente'
      : avg_idm >= 75
        ? 'satisfatório'
        : avg_idm >= 60
          ? 'abaixo do esperado'
          : 'crítico'

  const deltaDirection = total_delta >= 0 ? 'superior' : 'inferior'
  const absDelta = Math.abs(total_delta)

  let summary = `O sistema fotovoltaico instalado para o cliente ${consumerName || 'não informado'}`
  summary += ` foi analisado no período de ${periodLabel}.`
  summary += ` O Índice de Desempenho Médio (IDM) atingido foi de ${avg_idm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%,`
  summary += ` classificado como desempenho ${performanceLevel}.`
  summary += ` A geração real total foi de ${total_generation.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kWh,`
  summary += ` enquanto a geração esperada ajustada totalizou ${total_projected.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kWh,`
  summary += ` resultando em um delta ${deltaDirection} de ${absDelta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kWh`
  summary += ` (${delta_percentage >= 0 ? '+' : ''}${delta_percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%).`

  if (avg_idm >= 90) {
    summary +=
      ' O sistema está operando dentro dos parâmetros ideais, indicando boa eficiência dos painéis e condições favoráveis de irradiação.'
  } else if (avg_idm >= 75) {
    summary +=
      ' O sistema apresenta desempenho adequado, porém pode haver margem para otimização através de limpeza dos módulos ou revisão de conexões.'
  } else if (avg_idm >= 60) {
    summary +=
      ' Recomenda-se investigar possíveis causas de subdesempenho, como sombreamento, sujidade nos painéis, ou falhas no inversor.'
  } else {
    summary +=
      ' O desempenho crítico indica a necessidade de manutenção corretiva imediata. Sugere-se vistoria técnica detalhada dos módulos, inversores e cabeamento.'
  }

  return summary
}

const getCurrentMonths = (): EnergyEntry[] => {
  const dates: { month: string; year: string }[] = []
  const now = new Date()
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = String(d.getFullYear())
    dates.push({ month: mm, year: yyyy })
  }
  return dates.map((m) => ({
    id: crypto.randomUUID(),
    month: m.month,
    year: m.year,
    consumption: 0,
    received: 0,
    generation: 0,
  }))
}

interface EnergyContextType {
  // Configurações e modo
  isEfficiencyMode: boolean
  setIsEfficiencyMode: React.Dispatch<React.SetStateAction<boolean>>
  // Campos básicos
  consumerName: string
  setConsumerName: React.Dispatch<React.SetStateAction<string>>
  ucNumber: string
  setUcNumber: React.Dispatch<React.SetStateAction<string>>
  notes: string
  setNotes: React.Dispatch<React.SetStateAction<string>>
  // Campos de eficiência
  cityName: string
  setCityName: React.Dispatch<React.SetStateAction<string>>
  state: string
  setState: React.Dispatch<React.SetStateAction<string>>
  kitPower: number
  setKitPower: React.Dispatch<React.SetStateAction<number>>
  expectedAvgGeneration: number
  setExpectedAvgGeneration: React.Dispatch<React.SetStateAction<number>>
  hspRecord: HspData | null
  selectLocation: (record: HspData) => void
  clearLocation: () => void
  // Entradas de dados
  draftEntries: EnergyEntry[]
  setDraftEntries: React.Dispatch<React.SetStateAction<EnergyEntry[]>>
  // Relatório gerado
  report: EnergyReport | null
  generateReport: () => Promise<void>
  saveAnalysisToHistory: () => Promise<string>
  isSaving: boolean
  hasUnsavedChanges: boolean
  reset: () => void
  loadAnalysis: (record: any) => void
  currentAnalysisId: string | null
}

export const EnergyContext = createContext<EnergyContextType | undefined>(undefined)

export const EnergyProvider = ({ children }: { children: ReactNode }) => {
  const [isEfficiencyMode, setIsEfficiencyMode] = useState<boolean>(true)
  const [consumerName, setConsumerName] = useState<string>('')
  const [ucNumber, setUcNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // Campos de eficiência
  const [cityName, setCityName] = useState<string>('')
  const [state, setState] = useState<string>('')
  const [kitPower, setKitPower] = useState<number>(0)
  const [expectedAvgGeneration, setExpectedAvgGeneration] = useState<number>(0)
  const [hspRecord, setHspRecord] = useState<HspData | null>(null)

  const [draftEntries, setDraftEntries] = useState<EnergyEntry[]>(getCurrentMonths())
  const [report, setReport] = useState<EnergyReport | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  const selectLocation = (record: HspData) => {
    setHspRecord(record)
    setCityName(record.city)
    setState(record.state)
  }

  const clearLocation = () => {
    setHspRecord(null)
    setCityName('')
  }

  const generateReport = async () => {
    if (!draftEntries.length) return

    // Ordenar entradas cronologicamente (ano, mês)
    const sorted = [...draftEntries].sort((a, b) => {
      const yearDiff = (parseInt(a.year) || 0) - (parseInt(b.year) || 0)
      if (yearDiff !== 0) return yearDiff
      return (parseInt(a.month) || 0) - (parseInt(b.month) || 0)
    })

    const totalInvoiceConsumption = sorted.reduce((acc, e) => acc + (e.consumption || 0), 0)
    const totalReceived = sorted.reduce((acc, e) => acc + (e.received || 0), 0)
    const totalGeneration = sorted.reduce((acc, e) => acc + (e.generation || 0), 0)

    // Autoconsumo mensal: max(0, geração - injetada)
    const totalSelfConsumption = sorted.reduce(
      (acc, e) => acc + Math.max(0, (e.generation || 0) - (e.received || 0)),
      0,
    )
    // Consumo Real Total = fatura + autoconsumo
    const totalRealConsumption = totalInvoiceConsumption + totalSelfConsumption

    // Déficit da fatura: o que o cliente ainda precisou pagar à concessionária após compensar a injetada
    const totalDeficit = sorted.reduce(
      (acc, e) => acc + Math.max(0, (e.consumption || 0) - (e.received || 0)),
      0,
    )
    const count = sorted.length
    const avgInvoiceConsumption = count ? totalInvoiceConsumption / count : 0
    const avgSelfConsumption = count ? totalSelfConsumption / count : 0
    const avgRealConsumption = count ? totalRealConsumption / count : 0
    const avgConsumption = avgRealConsumption
    const avgReceived = count ? totalReceived / count : 0
    const avgGeneration = count ? totalGeneration / count : 0
    const avgDeficit = count ? totalDeficit / count : 0

    // Cobertura da fatura pela injetada
    const coveragePercent = totalInvoiceConsumption
      ? (totalReceived / totalInvoiceConsumption) * 100
      : 0
    // Cobertura do consumo real pela geração total
    const realCoveragePercent = totalRealConsumption
      ? (totalGeneration / totalRealConsumption) * 100
      : 0

    const mode: 'efficiency' | 'declared' = isEfficiencyMode ? 'efficiency' : 'declared'

    let ideal_breakdown: IdealBreakdownItem[] | undefined
    let adjusted_breakdown: AdjustedBreakdownItem[] | undefined
    let idealAverage: number | undefined
    let efficiencyFactor: number | undefined
    let totalProjected: number | undefined
    let avgIdm: number | undefined
    let totalDelta: number | undefined
    let deltaPct: number | undefined

    if (isEfficiencyMode && kitPower > 0 && expectedAvgGeneration > 0 && cityName && state) {
      let hspData: HspData | null = hspRecord
      if (!hspData) {
        hspData = await getHspByCity(cityName, state)
        setHspRecord(hspData)
      }

      const monthlyHspValues = MONTH_KEYS.map((key) =>
        normalizeHsp(Number((hspData as any)?.[key]) || 0),
      )

      ideal_breakdown = monthlyHspValues.map((hsp, idx) => {
        const days = DAYS_IN_MONTH[idx]
        const ideal_gen = days * hsp * kitPower
        return {
          month: MONTH_LABELS[idx],
          days,
          hsp,
          ideal_generation: ideal_gen,
        }
      })

      idealAverage = ideal_breakdown.reduce((sum, item) => sum + item.ideal_generation, 0) / 12
      efficiencyFactor = idealAverage > 0 ? expectedAvgGeneration / idealAverage : 0

      adjusted_breakdown = ideal_breakdown.map((item) => ({
        month: item.month,
        days: item.days,
        hsp: item.hsp,
        adjusted_generation: item.ideal_generation * efficiencyFactor!,
      }))
    }

    const items: EnergyMonthlyReportItem[] = sorted.map((entry) => {
      const mIdx = Math.max(0, Math.min(11, parseInt(entry.month) - 1))
      const monthLabel = `${MONTH_LABELS[mIdx] || ''}/${entry.year.slice(-2)}`
      const invoiceCons = entry.consumption || 0
      const rec = entry.received || 0
      const gen = entry.generation || 0
      // Autoconsumo: diferença entre o gerado e o injetado (no mínimo 0)
      const selfConsumption = Math.max(0, gen - rec)
      // Consumo real = consumo da fatura + (gerado - injetado)
      const realCons = invoiceCons + selfConsumption
      // Déficit da fatura
      const deficit = Math.max(0, invoiceCons - rec)
      // Saldo global da unidade: geração total - consumo real
      const balance = gen - realCons

      let estimated_generation: number | undefined
      let idm: number | undefined
      let delta: number | undefined
      let hsp_value: number | undefined

      if (adjusted_breakdown && adjusted_breakdown[mIdx]) {
        estimated_generation = adjusted_breakdown[mIdx].adjusted_generation
        hsp_value = adjusted_breakdown[mIdx].hsp
        idm = estimated_generation > 0 ? (gen / estimated_generation) * 100 : 0
        delta = gen - estimated_generation
      }

      return {
        id: entry.id,
        month: entry.month,
        year: entry.year,
        month_label: monthLabel,
        invoice_consumption: invoiceCons,
        self_consumption: selfConsumption,
        real_consumption: realCons,
        consumption: realCons, // Para compatibilidade
        received: rec,
        generation: gen,
        deficit,
        balance,
        hsp_value,
        estimated_generation,
        idm,
        delta,
      }
    })

    if (isEfficiencyMode && adjusted_breakdown) {
      totalProjected = items.reduce((acc, i) => acc + (i.estimated_generation || 0), 0)
      avgIdm = totalProjected > 0 ? (totalGeneration / totalProjected) * 100 : 0
      totalDelta = totalGeneration - totalProjected
      deltaPct = totalProjected > 0 ? (totalDelta / totalProjected) * 100 : 0
    }

    const reportData: EnergyReport = {
      mode,
      consumerName,
      ucNumber,
      cityName: isEfficiencyMode ? cityName : undefined,
      state: isEfficiencyMode ? state : undefined,
      kitPower: isEfficiencyMode ? kitPower : undefined,
      expectedAvgGeneration: isEfficiencyMode ? expectedAvgGeneration : undefined,
      notes,
      items,
      total_invoice_consumption: totalInvoiceConsumption,
      total_self_consumption: totalSelfConsumption,
      total_real_consumption: totalRealConsumption,
      total_consumption: totalRealConsumption,
      total_received: totalReceived,
      total_generation: totalGeneration,
      total_deficit: totalDeficit,
      avg_invoice_consumption: avgInvoiceConsumption,
      avg_self_consumption: avgSelfConsumption,
      avg_real_consumption: avgRealConsumption,
      avg_consumption: avgConsumption,
      avg_received: avgReceived,
      avg_generation: avgGeneration,
      avg_deficit: avgDeficit,
      coverage_percent: coveragePercent,
      real_coverage_percent: realCoveragePercent,
      total_projected: totalProjected,
      avg_idm: avgIdm,
      total_delta: totalDelta,
      delta_percentage: deltaPct,
      ideal_breakdown,
      adjusted_breakdown,
      ideal_average: idealAverage,
      efficiency_factor: efficiencyFactor,
    }

    if (isEfficiencyMode && totalProjected) {
      reportData.summary = generateEfficiencySummary(reportData)
    }

    setReport(reportData)
    setHasUnsavedChanges(true)
  }

  const saveAnalysisToHistory = async (): Promise<string> => {
    setIsSaving(true)
    try {
      const sorted = [...draftEntries].sort((a, b) => {
        const yearDiff = (parseInt(a.year) || 0) - (parseInt(b.year) || 0)
        if (yearDiff !== 0) return yearDiff
        return (parseInt(a.month) || 0) - (parseInt(b.month) || 0)
      })

      const mode: 'efficiency' | 'declared' = isEfficiencyMode ? 'efficiency' : 'declared'
      const inputsPayload = {
        mode,
        consumerName,
        ucNumber,
        cityName: isEfficiencyMode ? cityName : '',
        state: isEfficiencyMode ? state : '',
        kitPower: isEfficiencyMode ? kitPower : 0,
        expectedAvgGeneration: isEfficiencyMode ? expectedAvgGeneration : 0,
        draftEntries: sorted,
        notes,
      }

      const payload = {
        company: pb.authStore.record?.company,
        user: pb.authStore.record?.id,
        consumer_name: consumerName,
        uc_number: ucNumber,
        city_name: isEfficiencyMode ? cityName : '',
        state: isEfficiencyMode ? state : '',
        kit_power: isEfficiencyMode ? kitPower : 0,
        expected_avg_generation: isEfficiencyMode ? expectedAvgGeneration : 0,
        mode,
        notes,
        inputs: inputsPayload,
      }

      let savedId = currentAnalysisId
      if (currentAnalysisId) {
        await pb.collection('energy_analyses').update(currentAnalysisId, payload)
      } else {
        const record = await pb.collection('energy_analyses').create(payload)
        savedId = record.id
        setCurrentAnalysisId(record.id)
      }
      setHasUnsavedChanges(false)
      return savedId || ''
    } finally {
      setIsSaving(false)
    }
  }

  const loadAnalysis = (record: any) => {
    setCurrentAnalysisId(record.id)
    const inputs = record.inputs || {}
    const mode = inputs.mode || record.mode || 'efficiency'
    const isEff = mode === 'efficiency'
    setIsEfficiencyMode(isEff)
    setConsumerName(inputs.consumerName || record.consumer_name || '')
    setUcNumber(inputs.ucNumber || record.uc_number || '')
    setCityName(inputs.cityName || record.city_name || '')
    setState(inputs.state || record.state || '')
    setNotes(inputs.notes || record.notes || '')
    setKitPower(inputs.kitPower || record.kit_power || 0)
    setExpectedAvgGeneration(inputs.expectedAvgGeneration || record.expected_avg_generation || 0)
    setHspRecord(null)

    if (inputs.draftEntries && Array.isArray(inputs.draftEntries)) {
      setDraftEntries(
        inputs.draftEntries.map((e: any) => ({
          id: e.id || crypto.randomUUID(),
          month: e.month || '01',
          year: e.year || String(new Date().getFullYear()),
          consumption: Number(e.consumption) || 0,
          received: Number(e.received) || 0,
          generation: Number(e.generation) || 0,
        })),
      )
    }
    // Não precisa de report pré-salvo: o usuário pode imediatamente recalcular ou ver os dados
    setReport(null)
  }

  const reset = () => {
    setCurrentAnalysisId(null)
    setConsumerName('')
    setUcNumber('')
    setCityName('')
    setState('')
    setNotes('')
    setKitPower(0)
    setExpectedAvgGeneration(0)
    setHspRecord(null)
    setDraftEntries(getCurrentMonths())
    setReport(null)
    setHasUnsavedChanges(false)
  }

  return (
    <EnergyContext.Provider
      value={{
        isEfficiencyMode,
        setIsEfficiencyMode,
        consumerName,
        setConsumerName,
        ucNumber,
        setUcNumber,
        notes,
        setNotes,
        cityName,
        setCityName,
        state,
        setState,
        kitPower,
        setKitPower,
        expectedAvgGeneration,
        setExpectedAvgGeneration,
        hspRecord,
        selectLocation,
        clearLocation,
        draftEntries,
        setDraftEntries,
        report,
        generateReport,
        saveAnalysisToHistory,
        isSaving,
        hasUnsavedChanges,
        reset,
        loadAnalysis,
        currentAnalysisId,
      }}
    >
      {children}
    </EnergyContext.Provider>
  )
}

export const useEnergy = () => {
  const context = useContext(EnergyContext)
  if (!context) throw new Error('useEnergy must be used within EnergyProvider')
  return context
}
