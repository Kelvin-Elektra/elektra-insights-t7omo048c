import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface SolarEntry {
  id: string
  month: string
  consumption: number
  received: number
}

interface SolarContextType {
  draftEntries: SolarEntry[]
  setDraftEntries: React.Dispatch<React.SetStateAction<SolarEntry[]>>
  reportEntries: SolarEntry[] | null
  generateReport: () => void
  reset: () => void
}

export const SolarContext = createContext<SolarContextType | undefined>(undefined)

const initialMockData: SolarEntry[] = [
  { id: '1', month: '08/2023', consumption: 450, received: 300 },
  { id: '2', month: '09/2023', consumption: 420, received: 350 },
  { id: '3', month: '10/2023', consumption: 500, received: 280 },
  { id: '4', month: '11/2023', consumption: 480, received: 310 },
  { id: '5', month: '12/2023', consumption: 600, received: 400 },
  { id: '6', month: '01/2024', consumption: 550, received: 380 },
]

export const SolarProvider = ({ children }: { children: ReactNode }) => {
  const [draftEntries, setDraftEntries] = useState<SolarEntry[]>(initialMockData)
  const [reportEntries, setReportEntries] = useState<SolarEntry[] | null>(initialMockData)

  const generateReport = () => {
    // Sort entries by month (MM/YYYY) ascending
    const sorted = [...draftEntries].sort((a, b) => {
      const [mA, yA] = a.month.split('/')
      const [mB, yB] = b.month.split('/')
      if (yA !== yB) return (yA || '').localeCompare(yB || '')
      return (mA || '').localeCompare(mB || '')
    })
    setReportEntries(sorted)
  }

  const reset = () => {
    setDraftEntries([])
    setReportEntries(null)
  }

  return (
    <SolarContext.Provider
      value={{ draftEntries, setDraftEntries, reportEntries, generateReport, reset }}
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
