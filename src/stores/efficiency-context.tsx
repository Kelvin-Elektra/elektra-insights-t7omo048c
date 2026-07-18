import React, { createContext, useContext, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { getHspByCity, type HspData } from '@/services/hsp-data'

export interface EfficiencyEntry {
  id: string
  month: string
  year: string
  real_generation: number
}

export interface EfficiencyReportItem {
  month: string
  year: string
  real_generation: number
  hsp_value: number
  monthly_weight: number
  estimated: number
  idm: number
  month_label: string
}

export interface EfficiencyReport {
  consumerName?: string
  items: EfficiencyReportItem[]
  avg_idm: number
  total_real: number
  total_estimated: number
  total_delta: number
  delta_percentage: number
  ideal_breakdown: { month: string; days: number; hsp: number; ideal_generation: number }[]
  adjusted_breakdown: { month: string; days: number; hsp: number; adjusted_generation: number }[]
  ideal_average: number
  efficiency_factor: number
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

interface EfficiencyContextType {
  consumerName: string
  setConsumerName: React.Dispatch<React.SetStateAction<string>>
  cityName: string
  setCityName: React.Dispatch<React.SetStateAction<string>>
  state: string
  setState: React.Dispatch<React.SetStateAction<string>>
  kitPower: number
  setKitPower: React.Dispatch<React.SetStateAction<number>>
  expectedAvgGeneration: number
  setExpectedAvgGeneration: React.Dispatch<React.SetStateAction<number>>
  draftEntries: EfficiencyEntry[]
  setDraftEntries: React.Dispatch<React.SetStateAction<EfficiencyEntry[]>>
  report: EfficiencyReport | null
  generateReport: () => Promise<void>
  reset: () => void
  loadAnalysis: (record: any) => void
  currentAnalysisId: string | null
  hspRecord: HspData | null
  selectLocation: (record: HspData) => void
  clearLocation: () => void
}

export const EfficiencyContext = createContext<EfficiencyContextType | undefined>(undefined)

const getCurrentMonth = () => {
  const d = new Date()
  return { month: String(d.getMonth() + 1).padStart(2, '0'), year: String(d.getFullYear()) }
}

export const EfficiencyProvider = ({ children }: { children: ReactNode }) => {
  const [consumerName, setConsumerName] = useState('')
  const [cityName, setCityName] = useState('')
  const [state, setState] = useState('')
  const [kitPower, setKitPower] = useState(0)
  const [expectedAvgGeneration, setExpectedAvgGeneration] = useState(0)
  const [draftEntries, setDraftEntries] = useState<EfficiencyEntry[]>(() => {
    const { month, year } = getCurrentMonth()
    return [{ id: crypto.randomUUID(), month, year, real_generation: 0 }]
  })
  const [report, setReport] = useState<EfficiencyReport | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [hspRecord, setHspRecord] = useState<HspData | null>(null)

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
    if (!consumerName || !cityName || !state || kitPower <= 0 || expectedAvgGeneration <= 0) return

    let hspData: HspData | null = hspRecord
    if (!hspData) {
      hspData = await getHspByCity(cityName, state)
      setHspRecord(hspData)
    }

    const monthlyHspValues = MONTH_KEYS.map((key) => Number((hspData as any)[key]) || 0)

    const ideal_breakdown = monthlyHspValues.map((hsp, idx) => {
      const days = DAYS_IN_MONTH[idx]
      const ideal_generation = days * hsp * kitPower
      return {
        month: MONTH_LABELS[idx],
        days,
        hsp,
        ideal_generation,
      }
    })

    const idealAverage = ideal_breakdown.reduce((sum, item) => sum + item.ideal_generation, 0) / 12
    const efficiencyFactor = idealAverage > 0 ? expectedAvgGeneration / idealAverage : 0

    const adjusted_breakdown = ideal_breakdown.map((item) => ({
      month: item.month,
      days: item.days,
      hsp: item.hsp,
      adjusted_generation: item.ideal_generation * efficiencyFactor,
    }))

    const items: EfficiencyReportItem[] = draftEntries.map((entry) => {
      const monthIdx = parseInt(entry.month) - 1
      const monthHsp = monthlyHspValues[monthIdx]
      const estimated = adjusted_breakdown[monthIdx].adjusted_generation
      const idm = estimated > 0 ? (entry.real_generation / estimated) * 100 : 0
      return {
        ...entry,
        hsp_value: monthHsp,
        monthly_weight: 0,
        estimated,
        idm,
        month_label: `${MONTH_LABELS[monthIdx] || ''}/${entry.year.slice(-2)}`,
      }
    })

    const avgIdm = items.length > 0 ? items.reduce((acc, i) => acc + i.idm, 0) / items.length : 0
    const totalReal = items.reduce((acc, i) => acc + i.real_generation, 0)
    const totalEstimated = items.reduce((acc, i) => acc + i.estimated, 0)
    const totalDelta = totalReal - totalEstimated
    const deltaPct = totalEstimated > 0 ? (totalDelta / totalEstimated) * 100 : 0

    const reportData: EfficiencyReport = {
      consumerName,
      items,
      avg_idm: avgIdm,
      total_real: totalReal,
      total_estimated: totalEstimated,
      total_delta: totalDelta,
      delta_percentage: deltaPct,
      ideal_breakdown,
      adjusted_breakdown,
      ideal_average: idealAverage,
      efficiency_factor: efficiencyFactor,
    }
    setReport(reportData)

    const firstEntry = draftEntries[0]
    const payload = {
      company: pb.authStore.record?.company,
      user: pb.authStore.record?.id,
      city_name: cityName,
      state,
      kit_power: kitPower,
      expected_avg_generation: expectedAvgGeneration,
      month: firstEntry?.month || '',
      year: firstEntry?.year || '',
      real_generation: totalReal,
      report_data: reportData,
    }

    try {
      if (currentAnalysisId) {
        await pb.collection('efficiency_analyses').update(currentAnalysisId, payload)
      } else {
        const record = await pb.collection('efficiency_analyses').create(payload)
        setCurrentAnalysisId(record.id)
      }
    } catch (e) {
      console.error('Failed to save efficiency analysis', e)
    }
  }

  const loadAnalysis = (record: any) => {
    setCurrentAnalysisId(record.id)
    setConsumerName(record.report_data?.consumerName || '')
    setCityName(record.city_name || '')
    setState(record.state || '')
    setKitPower(record.kit_power || 0)
    setExpectedAvgGeneration(record.expected_avg_generation || 0)
    setHspRecord(null)
    const rd = record.report_data
    if (rd && rd.items) {
      setDraftEntries(
        rd.items.map((i: any) => ({
          id: i.id || crypto.randomUUID(),
          month: i.month,
          year: i.year,
          real_generation: i.real_generation,
        })),
      )
      setReport(rd)
    }
  }

  const reset = () => {
    setCurrentAnalysisId(null)
    setConsumerName('')
    setCityName('')
    setState('')
    setKitPower(0)
    setExpectedAvgGeneration(0)
    setHspRecord(null)
    const { month, year } = getCurrentMonth()
    setDraftEntries([{ id: crypto.randomUUID(), month, year, real_generation: 0 }])
    setReport(null)
  }

  return (
    <EfficiencyContext.Provider
      value={{
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
        report,
        generateReport,
        reset,
        loadAnalysis,
        currentAnalysisId,
        hspRecord,
        selectLocation,
        clearLocation,
      }}
    >
      {children}
    </EfficiencyContext.Provider>
  )
}

export const useEfficiency = () => {
  const context = useContext(EfficiencyContext)
  if (!context) throw new Error('useEfficiency must be used within EfficiencyProvider')
  return context
}
