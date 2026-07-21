import pb from '@/lib/pocketbase/client'

export interface HybridLoad {
  id: string
  description: string
  power: number
  hours: number
}

export interface HybridResults {
  total_power: number
  total_energy: number
  inverter_power: number
  battery_qty: number
  useful_capacity: number
}

export interface HybridAnalysisRecord {
  id: string
  company: string
  user: string
  customer_name: string
  battery_type: '100Ah' | '200Ah'
  loads: HybridLoad[]
  results: HybridResults
  created: string
  updated: string
}

export const getHybridAnalyses = (filter: string) =>
  pb.collection('hybrid_analyses').getFullList({
    sort: '-created',
    filter,
    expand: 'company,user',
  })

export const getHybridAnalysis = (id: string) =>
  pb.collection('hybrid_analyses').getOne(id, { expand: 'company,user' })

export const createHybridAnalysis = (data: Record<string, unknown>) =>
  pb.collection('hybrid_analyses').create(data)

export const updateHybridAnalysis = (id: string, data: Record<string, unknown>) =>
  pb.collection('hybrid_analyses').update(id, data)

export const deleteHybridAnalysis = (id: string) => pb.collection('hybrid_analyses').delete(id)
