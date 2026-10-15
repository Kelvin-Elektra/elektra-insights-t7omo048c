import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import type { HybridLoad, HybridResults } from '@/services/hybrid-analyses'

export type BatteryType = '100Ah' | '200Ah'

export interface HybridContextType {
  customerName: string
  setCustomerName: React.Dispatch<React.SetStateAction<string>>
  batteryType: BatteryType
  setBatteryType: React.Dispatch<React.SetStateAction<BatteryType>>
  notes: string
  setNotes: React.Dispatch<React.SetStateAction<string>>
  loads: HybridLoad[]
  setLoads: React.Dispatch<React.SetStateAction<HybridLoad[]>>
  results: HybridResults | null
  currentAnalysisId: string | null
  calculate: () => Promise<void>
  saveAnalysisToHistory: () => Promise<string>
  isSaving: boolean
  hasUnsavedChanges: boolean
  reset: () => void
  loadAnalysis: (record: any) => void
}

const HybridContext = createContext<HybridContextType | undefined>(undefined)

const SYSTEM_VOLTAGE = 48
const DOD = 0.9

export const getUsefulCapacity = (batteryType: BatteryType): number => {
  const ah = batteryType === '100Ah' ? 100 : 200
  return ah * SYSTEM_VOLTAGE * DOD
}

export const calculateResults = (loads: HybridLoad[], batteryType: BatteryType): HybridResults => {
  const total_power = loads.reduce((sum, l) => sum + l.power, 0)
  const total_energy = loads.reduce((sum, l) => sum + l.power * l.hours, 0)
  const inverter_power = Math.ceil(total_power / 1000)
  const useful_capacity = getUsefulCapacity(batteryType)
  const battery_qty = Math.ceil(total_energy / useful_capacity)
  return { total_power, total_energy, inverter_power, battery_qty, useful_capacity }
}

export const HybridProvider = ({ children }: { children: ReactNode }) => {
  const [customerName, setCustomerName] = useState('')
  const [batteryType, setBatteryType] = useState<BatteryType>('100Ah')
  const [notes, setNotes] = useState('')
  const [loads, setLoads] = useState<HybridLoad[]>([
    { id: crypto.randomUUID(), description: '', power: 0, hours: 0 },
  ])
  const [results, setResults] = useState<HybridResults | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)

  const calculate = useCallback(async () => {
    if (!customerName || loads.length === 0) return
    const calc = calculateResults(loads, batteryType)
    setResults(calc)
    setHasUnsavedChanges(true)
  }, [customerName, batteryType, loads])

  const saveAnalysisToHistory = useCallback(async (): Promise<string> => {
    setIsSaving(true)
    try {
      const calc = results || calculateResults(loads, batteryType)
      const payload = {
        company: pb.authStore.record?.company,
        user: pb.authStore.record?.id,
        customer_name: customerName,
        battery_type: batteryType,
        notes,
        loads,
        results: calc,
      }

      let savedId = currentAnalysisId
      if (currentAnalysisId) {
        await pb.collection('hybrid_analyses').update(currentAnalysisId, payload)
      } else {
        const record = await pb.collection('hybrid_analyses').create(payload)
        savedId = record.id
        setCurrentAnalysisId(record.id)
      }
      setHasUnsavedChanges(false)
      return savedId || ''
    } finally {
      setIsSaving(false)
    }
  }, [customerName, batteryType, notes, loads, results, currentAnalysisId])

  const reset = useCallback(() => {
    setCurrentAnalysisId(null)
    setCustomerName('')
    setBatteryType('100Ah')
    setNotes('')
    setLoads([{ id: crypto.randomUUID(), description: '', power: 0, hours: 0 }])
    setResults(null)
    setHasUnsavedChanges(false)
  }, [])

  const loadAnalysis = useCallback((record: any) => {
    setCurrentAnalysisId(record.id)
    setCustomerName(record.customer_name || '')
    setBatteryType(record.battery_type || '100Ah')
    setNotes(record.notes || '')
    setLoads(
      (record.loads || []).map((l: any) => ({
        id: l.id || crypto.randomUUID(),
        description: l.description || '',
        power: Number(l.power) || 0,
        hours: Number(l.hours) || 0,
      })),
    )
    setResults(null)
    setHasUnsavedChanges(false)
  }, [])

  return (
    <HybridContext.Provider
      value={{
        customerName,
        setCustomerName,
        batteryType,
        setBatteryType,
        notes,
        setNotes,
        loads,
        setLoads,
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
    </HybridContext.Provider>
  )
}

export const useHybrid = () => {
  const context = useContext(HybridContext)
  if (!context) throw new Error('useHybrid must be used within HybridProvider')
  return context
}
