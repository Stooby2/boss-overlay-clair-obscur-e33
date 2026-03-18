import type { Boss } from './Boss'
import type { Picto } from './Picto'

export interface SaveSnapshot {
  bosses: Boss[]
  pictos: Picto[]
}
