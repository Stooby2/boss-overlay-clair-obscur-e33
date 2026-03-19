import type { Boss } from './Boss'
import type { CurrentLocation } from './CurrentLocation'
import type { FriendlyNevronEntry } from './FriendlyNevronEntry'
import type { JournalEntry } from './JournalEntry'
import type { LostGestralEntry } from './LostGestralEntry'
import type { MonocoFoot } from './MonocoFoot'
import type { Picto } from './Picto'

export interface SaveSnapshot {
  bosses: Boss[]
  pictos: Picto[]
  monocoFeet: MonocoFoot[]
  journals: JournalEntry[]
  lostGestrals: LostGestralEntry[]
  friendlyNevrons: FriendlyNevronEntry[]
  location: CurrentLocation | null
}

