import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface SolarEntry {
  id: string
  month: string
  consumption: number
  received: number
}

import pb from '@/lib/pocketbase/client'

interface SolarContextType {
  consumerName: string
  setConsumerName: React.Dispatch<React.SetStateAction<string>>
  ucNumber: string
  setUcNumber: React.Dispatch<React.SetStateAction<string>>
  draftEntries: SolarEntry[]
  setDraftEntries: React.Dispatch<React.SetStateAction<SolarEntry[]>>
  reportEntries: SolarEntry[] | null
  generateReport: () => Promise<void>
  reset: () => void
  loadAnalysis: (record: any) => void
  currentAnalysisId: string | null
}

export const SolarContext = createContext<SolarContextType | undefined>(undefined)

const getCurrentMonths = (): SolarEntry[] => {
  const dates = []
  const now = new Date()
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    dates.push(`${mm}/${yyyy}`)
  }
  return dates.map((m) => ({ id: crypto.randomUUID(), month: m, consumption: 0, received: 0 }))
}

export const SolarProvider = ({ children }: { children: ReactNode }) => {
  const [consumerName, setConsumerName] = useState<string>('')
  const [ucNumber, setUcNumber] = useState<string>('')
  const [draftEntries, setDraftEntries] = useState<SolarEntry[]>(getCurrentMonths())
  const [reportEntries, setReportEntries] = useState<SolarEntry[] | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)

  const generateReport = async () => {
    // Sort entries by month (MM/YYYY) ascending
    const sorted = [...draftEntries].sort((a, b) => {
      const [mA, yA] = a.month.split('/')
      const [mB, yB] = b.month.split('/')
      if (yA !== yB) return (yA || '').localeCompare(yB || '')
      return (mA || '').localeCompare(mB || '')
    })
    setReportEntries(sorted)

    try {
      const payload = {
        company: pb.authStore.record?.company,
        consumer_name: consumerName,
        uc_number: ucNumber,
        report_data: sorted,
      }

      if (currentAnalysisId) {
        await pb.collection('uc_analyses').update(currentAnalysisId, payload)
      } else {
        const record = await pb.collection('uc_analyses').create(payload)
        setCurrentAnalysisId(record.id)
      }
    } catch (e) {
      console.error('Failed to save analysis', e)
    }
  }

  const loadAnalysis = (record: any) => {
    setCurrentAnalysisId(record.id)
    setConsumerName(record.consumer_name || '')
    setUcNumber(record.uc_number || '')
    setDraftEntries(record.report_data || [])
    setReportEntries(record.report_data || [])
  }

  const reset = () => {
    setCurrentAnalysisId(null)
    setConsumerName('')
    setUcNumber('')
    setDraftEntries(getCurrentMonths())
    setReportEntries(null)
  }

  return (
    <SolarContext.Provider
      value={{
        consumerName,
        setConsumerName,
        ucNumber,
        setUcNumber,
        draftEntries,
        setDraftEntries,
        reportEntries,
        generateReport,
        reset,
        loadAnalysis,
        currentAnalysisId,
      }}
    >
      {children}
    </SolarContext.Provider>
  )
}

export const useSolar = () => {
  const context = useContext(SolarContext)
  if (!context) throw new Error('useSolar must be used within SolarProvider')
  return context
}
