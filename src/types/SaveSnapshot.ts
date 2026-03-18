import type { Boss } from './Boss'
import type { CurrentLocation } from './CurrentLocation'
import type { Picto } from './Picto'

export interface SaveSnapshot {
  bosses: Boss[]
  pictos: Picto[]
  location: CurrentLocation | null
}
