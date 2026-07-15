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
  const records = await pb.collection('hsp_data').getFullList({ fields: 'state' })
  return [...new Set(records.map((r: any) => r.state))].sort()
}

export const getCitiesByState = async (state: string): Promise<HspData[]> => {
  return pb.collection('hsp_data').getFullList({
    filter: `state = "${state}"`,
    sort: 'city_name',
  })
}

export const getHspByCity = async (cityName: string, state: string): Promise<HspData> => {
  return pb
    .collection('hsp_data')
    .getFirstListItem(`city_name = "${cityName}" && state = "${state}"`)
}
