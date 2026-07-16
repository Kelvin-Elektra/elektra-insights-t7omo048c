import pb from '@/lib/pocketbase/client'

export interface HspData {
  id: string
  state: string
  city: string
  hsp_value: number
}

export const getStates = async (): Promise<string[]> => {
  try {
    const records = await pb.collection('hsp_data').getFullList()
    return [...new Set(records.map((r: any) => r.state))].sort()
  } catch (error) {
    console.error('Failed to fetch states from hsp_data:', error)
    throw error
  }
}

export const getCitiesByState = async (state: string): Promise<HspData[]> => {
  try {
    return await pb.collection('hsp_data').getFullList({
      filter: `state = "${state}"`,
      sort: 'city',
    })
  } catch (error) {
    console.error(`Failed to fetch cities for state "${state}":`, error)
    throw error
  }
}

export const getHspByCity = async (city: string, state: string): Promise<HspData> => {
  try {
    return await pb
      .collection('hsp_data')
      .getFirstListItem(`city = "${city}" && state = "${state}"`)
  } catch (error) {
    console.error(`Failed to fetch HSP data for ${city}/${state}:`, error)
    throw error
  }
}
