import type { Boss } from './Boss'
import type { CurrentLocation } from './CurrentLocation'
import type { MonocoFoot } from './MonocoFoot'
import type { Picto } from './Picto'

export interface SaveSnapshot {
  bosses: Boss[]
  pictos: Picto[]
  monocoFeet: MonocoFoot[]
  location: CurrentLocation | null
}
