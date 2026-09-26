export type SchoolType = 'Elementary' | 'Middle' | 'High School' | 'College / University'

export interface School {
  id: string
  name: string
  type: SchoolType
  lat: number
  lng: number
  address: string
  city: string
  state: string
  zip: string
  email?: string
  website: string
}

export const SCHOOL_TYPES: SchoolType[] = ['Elementary', 'Middle', 'High School', 'College / University']
