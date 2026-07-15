import pb from '@/lib/pocketbase/client'

export interface HspData {
  id: string
  hsp_id: string
  city_name: string
  state: string
  annual: number
  jan: number
  feb: number
  mar: number
  apr: number
  may: number
  jun: number
  jul: number
  aug: number
  sep: number
  oct: number
  nov: number
  dec: number
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
      sort: 'city_name',
    })
  } catch (error) {
    console.error(`Failed to fetch cities for state "${state}":`, error)
    throw error
  }
}

export const getHspByCity = async (cityName: string, state: string): Promise<HspData> => {
  try {
    return await pb
      .collection('hsp_data')
      .getFirstListItem(`city_name = "${cityName}" && state = "${state}"`)
  } catch (error) {
    console.error(`Failed to fetch HSP data for ${cityName}/${state}:`, error)
    throw error
  }
}
