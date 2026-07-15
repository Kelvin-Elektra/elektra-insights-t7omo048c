import pb from '@/lib/pocketbase/client'

export const getEfficiencyAnalyses = (filter: string) =>
  pb.collection('efficiency_analyses').getFullList({
    sort: '-created',
    filter,
    expand: 'company,user',
  })

export const getEfficiencyAnalysis = (id: string) =>
  pb.collection('efficiency_analyses').getOne(id, { expand: 'company,user' })

export const createEfficiencyAnalysis = (data: Record<string, unknown>) =>
  pb.collection('efficiency_analyses').create(data)

export const updateEfficiencyAnalysis = (id: string, data: Record<string, unknown>) =>
  pb.collection('efficiency_analyses').update(id, data)

export const deleteEfficiencyAnalysis = (id: string) =>
  pb.collection('efficiency_analyses').delete(id)
