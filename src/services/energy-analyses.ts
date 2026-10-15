import pb from '@/lib/pocketbase/client'

export interface EnergyAnalysisRecord {
  id: string
  company: string
  user?: string
  consumer_name: string
  uc_number?: string
  city_name?: string
  state?: string
  kit_power?: number
  expected_avg_generation?: number
  mode: 'efficiency' | 'declared'
  inputs: Record<string, any>
  created: string
  updated: string
  expand?: {
    company?: { name: string; logo?: string }
    user?: { name: string; email?: string }
  }
}

export const getEnergyAnalyses = (filter: string) =>
  pb.collection('energy_analyses').getFullList<EnergyAnalysisRecord>({
    sort: '-created',
    filter,
    expand: 'company,user',
  })

export const getEnergyAnalysis = (id: string) =>
  pb.collection('energy_analyses').getOne<EnergyAnalysisRecord>(id, { expand: 'company,user' })

export const createEnergyAnalysis = (data: Record<string, unknown>) =>
  pb.collection('energy_analyses').create(data)

export const updateEnergyAnalysis = (id: string, data: Record<string, unknown>) =>
  pb.collection('energy_analyses').update(id, data)

export const deleteEnergyAnalysis = (id: string) => pb.collection('energy_analyses').delete(id)
