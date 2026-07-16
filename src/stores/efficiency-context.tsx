import React, { createContext, useContext, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { getHspByCity, normalizeHsp } from '@/services/hsp-data'

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
  theoretical: number
  estimated: number
  idm: number
  month_label: string
}

export interface EfficiencyReport {
  items: EfficiencyReportItem[]
  loss_factor: number
  avg_idm: number
  total_real: number
  total_estimated: number
}

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
const AVG_DAYS = 30

interface EfficiencyContextType {
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
}

export const EfficiencyContext = createContext<EfficiencyContextType | undefined>(undefined)

const getCurrentMonth = () => {
  const d = new Date()
  return { month: String(d.getMonth() + 1).padStart(2, '0'), year: String(d.getFullYear()) }
}

export const EfficiencyProvider = ({ children }: { children: ReactNode }) => {
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

  const generateReport = async () => {
    if (!cityName || !state || kitPower <= 0) return
    const hspData = await getHspByCity(cityName, state)
    const hspValue = normalizeHsp(hspData.annual || 0)
    const annualAvgTheoretical = kitPower * hspValue * AVG_DAYS
    const lossFactor = annualAvgTheoretical > 0 ? expectedAvgGeneration / annualAvgTheoretical : 1

    const items: EfficiencyReportItem[] = draftEntries.map((entry) => {
      const monthIdx = parseInt(entry.month) - 1
      const theoretical = kitPower * hspValue * AVG_DAYS
      const estimated = theoretical * lossFactor
      const idm = estimated > 0 ? (entry.real_generation / estimated) * 100 : 0
      return {
        ...entry,
        hsp_value: hspValue,
        theoretical,
        estimated,
        idm,
        month_label: `${MONTH_LABELS[monthIdx] || ''}/${entry.year.slice(-2)}`,
      }
    })

    const avgIdm = items.length > 0 ? items.reduce((acc, i) => acc + i.idm, 0) / items.length : 0
    const totalReal = items.reduce((acc, i) => acc + i.real_generation, 0)
    const totalEstimated = items.reduce((acc, i) => acc + i.estimated, 0)
    const reportData: EfficiencyReport = {
      items,
      loss_factor: lossFactor,
      avg_idm: avgIdm,
      total_real: totalReal,
      total_estimated: totalEstimated,
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
    setCityName(record.city_name || '')
    setState(record.state || '')
    setKitPower(record.kit_power || 0)
    setExpectedAvgGeneration(record.expected_avg_generation || 0)
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
    setCityName('')
    setState('')
    setKitPower(0)
    setExpectedAvgGeneration(0)
    const { month, year } = getCurrentMonth()
    setDraftEntries([{ id: crypto.randomUUID(), month, year, real_generation: 0 }])
    setReport(null)
  }

  return (
    <EfficiencyContext.Provider
      value={{
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
