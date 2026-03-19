import type { ChecklistZoneGroup, FilteredChecklistZoneGroup } from './checklistModel'

export type ChecklistFeatureKey =
  | 'bosses'
  | 'pictos'
  | 'feet'
  | 'journals'
  | 'lostGestrals'
  | 'friendlyNevrons'
  | 'weapons'

export interface ChecklistFeatureVisibility {
  bosses: boolean
  pictos: boolean
  feet: boolean
  journals: boolean
  lostGestrals: boolean
  friendlyNevrons: boolean
  weapons: boolean
}

export const DEFAULT_CHECKLIST_FEATURE_VISIBILITY: ChecklistFeatureVisibility = {
  bosses: true,
  pictos: true,
  feet: true,
  journals: true,
  lostGestrals: true,
  friendlyNevrons: true,
  weapons: true,
}

export function toggleChecklistFeatureVisibility(
  visibility: ChecklistFeatureVisibility,
  key: ChecklistFeatureKey,
): ChecklistFeatureVisibility {
  return {
    ...visibility,
    [key]: !visibility[key],
  }
}

export function applyChecklistFeatureVisibility(
  zoneGroups: FilteredChecklistZoneGroup[],
  visibility: ChecklistFeatureVisibility,
): FilteredChecklistZoneGroup[] {
  return zoneGroups.map((zone) => ({
    ...zone,
    visibleBosses: visibility.bosses ? zone.visibleBosses : [],
    visiblePictos: visibility.pictos ? zone.visiblePictos : [],
    visibleMonocoFeet: visibility.feet ? zone.visibleMonocoFeet : [],
    visibleJournals: visibility.journals ? zone.visibleJournals : [],
    visibleLostGestrals: visibility.lostGestrals ? zone.visibleLostGestrals : [],
    visibleFriendlyNevrons: visibility.friendlyNevrons
      ? zone.visibleFriendlyNevrons
      : [],
    visibleWeapons: visibility.weapons ? zone.visibleWeapons : [],
  }))
}

export function zoneHasVisibleContent(zone: FilteredChecklistZoneGroup): boolean {
  return (
    zone.visibleBosses.length > 0 ||
    zone.visiblePictos.length > 0 ||
    zone.visibleMonocoFeet.length > 0 ||
    zone.visibleJournals.length > 0 ||
    zone.visibleLostGestrals.length > 0 ||
    zone.visibleFriendlyNevrons.length > 0 ||
    zone.visibleWeapons.length > 0
  )
}

export function buildZoneStatsParts(
  zone: ChecklistZoneGroup,
  visibility: ChecklistFeatureVisibility,
): string[] {
  const parts: string[] = []

  if (visibility.bosses) {
    parts.push(`B ${zone.killed}/${zone.totalBosses}`)
  }
  if (visibility.pictos) {
    parts.push(`P ${zone.foundPictos}/${zone.totalPictos}`)
  }
  if (visibility.feet) {
    parts.push(`F ${zone.foundFeet}/${zone.totalFeet}`)
  }
  if (visibility.journals) {
    parts.push(`J ${zone.foundJournals}/${zone.totalJournals}`)
  }
  if (visibility.lostGestrals) {
    parts.push(`G ${zone.foundLostGestrals}/${zone.totalLostGestrals}`)
  }

  return parts
}
