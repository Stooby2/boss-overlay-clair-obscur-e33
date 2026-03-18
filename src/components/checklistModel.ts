import type { Boss } from '../types/Boss'
import type { Picto } from '../types/Picto'

export type ZoneSource = 'boss' | 'picto'
export type ChecklistFilterMode = 'all' | 'found' | 'remaining'

export interface NormalizedZoneMatch {
  zoneName: string
  matched: boolean
}

export interface UnmatchedZoneName {
  source: ZoneSource
  rawName: string
  fallbackZoneName: string
}

export interface ChecklistZoneGroup {
  zoneName: string
  bosses: Boss[]
  pictos: Picto[]
  killed: number
  encountered: number
  totalBosses: number
  foundPictos: number
  totalPictos: number
  unmatchedEntries: UnmatchedZoneName[]
}

export interface FilteredChecklistZoneGroup extends ChecklistZoneGroup {
  visibleBosses: Boss[]
  visiblePictos: Picto[]
}

export interface ChecklistModel {
  zoneGroups: ChecklistZoneGroup[]
  unmatchedZoneNames: UnmatchedZoneName[]
}

export interface ChecklistSummary {
  killedBosses: number
  totalBosses: number
  remainingBosses: number
  foundPictos: number
  totalPictos: number
  remainingPictos: number
}

export interface ChecklistFilterOptions {
  filterMode: ChecklistFilterMode
  searchTerm: string
  translateBossName?: (bossName: string) => string
}

const DEFAULT_ZONE_NAME = 'uncategorized'

const ZONE_ALIASES: Record<string, string[]> = {
  abbest_cave: ['abbest_cave', 'Abbest Cave'],
  crimson_forest: ['crimson_forest', 'Crimson Forest'],
  crushing_cavern: ['crushing_cavern', 'Crushing Cavern'],
  dark_shores_bloodied_beach: [
    'dark_shores_bloodied_beach',
    'Dark Shores - Bloodied Beach',
  ],
  ancient_sanctuary: ['ancient_sanctuary', 'Ancient Sanctuary'],
  camp: ['camp', 'Camp'],
  dark_gestral_arena: ['dark_gestral_arena', 'Dark Gestral Arena'],
  endless_night_sanctuary: [
    'endless_night_sanctuary',
    'Endless Night Sanctuary',
  ],
  endless_tower: ['endless_tower', 'Endless Tower'],
  esoteric_ruins_continent: [
    'esoteric_ruins_continent',
    'Esoteric Ruins/Continent',
  ],
  esquie_nest: ['esquie_nest', "Esquie's Nest"],
  falling_leaves: [
    'falling_leaves',
    'Falling Leaves',
    'Falling Leaves - Resinveil Groove',
  ],
  floating_cemetery: ['floating_cemetery', 'Floating Cemetery'],
  flying_manor: [
    'flying_manor',
    'Flying Manor',
    'Flying Manor - Central Plaza',
  ],
  flying_waters: ['flying_waters', 'Flying Waters'],
  forgotten_battlefield: [
    'forgotten_battlefield',
    'Forgotten Battlefield',
  ],
  frozen_hearts: [
    'frozen_hearts',
    'Frozen Hearts',
    'Frozen Hearts - Glacial Falls',
  ],
  gestral_village: ['gestral_village', 'Gestral Village'],
  hidden_gestral_arena: ['hidden_gestral_arena', 'Hidden Gestral Arena'],
  isle_of_eyes: ['isle_of_eyes', 'Isle of Eyes'],
  lumiere: ['lumiere', 'Lumiere'],
  lumiere_prologue: ['lumiere_prologue', 'Lumiere - Prologue'],
  monoco_station: ['monoco_station', "Monoco's Station"],
  old_lumiere: ['old_lumiere', 'Old Lumiere'],
  painting_workshop: ['painting_workshop', 'Painting Workshop'],
  red_woods: ['red_woods', 'Red Woods'],
  renoir_drafts: [
    'renoir_drafts',
    "Renoir's Drafts",
    "Renoir's Drafts - Entrance",
  ],
  sacred_river: ['sacred_river', 'Sacred River'],
  sinister_cave: ['sinister_cave', 'Sinister Cave'],
  sirene: ['sirene', 'Sirene'],
  sirene_dress: ['sirene_dress', "Sirene's Dress"],
  sky_island: ['sky_island', 'Sky Island', 'Sky Island - Entrance'],
  spring_meadows: ['spring_meadows', 'Spring Meadows'],
  stone_wave_cliffs: [
    'stone_wave_cliffs',
    'Stone Wave Cliffs',
    'Stone Wave Cliffs - Flooded Buildings',
  ],
  stone_wave_cliffs_cave: [
    'stone_wave_cliffs_cave',
    'Stone Wave Cliffs Cave',
  ],
  sunless_cliffs: ['sunless_cliffs', 'Sunless Cliffs'],
  the_chosen_path: ['the_chosen_path', 'The Chosen Path'],
  the_continent: ['the_continent', 'The Continent'],
  the_crows: ['the_crows', 'The Crows'],
  the_monolith: [
    'the_monolith',
    'The Monolith',
    'Inside the Monolith',
    'Monolith Peak',
  ],
  the_reacher: ['the_reacher', 'The Reacher'],
  verso_drafts: [
    'verso_drafts',
    "Verso's Draft",
    "Verso's Drafts",
  ],
  visages: ['visages', 'Visages'],
  yellow_harvest: [
    'yellow_harvest',
    'Yellow Harvest',
    "Yellow Harvest - Harvester's Hollow",
  ],
}

const zoneAliasLookup = new Map<string, string>()
const reportedUnmatchedZoneNames = new Set<string>()

for (const [zoneName, aliases] of Object.entries(ZONE_ALIASES)) {
  for (const alias of aliases) {
    zoneAliasLookup.set(toZoneLookupKey(alias), zoneName)
  }
}

function toZoneLookupKey(value: string): string {
  return value
    .trim()
    .normalize('NFKD')
    .replace(/[\u2019\uFFFD]/g, "'")
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-zA-Z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function bossMatchesSearch(
  boss: Boss,
  term: string,
  translateBossName: (bossName: string) => string,
): boolean {
  return (
    boss.name.toLowerCase().includes(term) ||
    translateBossName(boss.name).toLowerCase().includes(term)
  )
}

function pictoMatchesSearch(picto: Picto, term: string): boolean {
  return [
    picto.friendlyName,
    picto.effect,
    picto.mapName,
    picto.nearestFlag,
    picto.howToGet,
  ].some((value) => value.toLowerCase().includes(term))
}

function bossMatchesFilter(boss: Boss, filterMode: ChecklistFilterMode): boolean {
  if (filterMode === 'found') {
    return boss.encountered && boss.killed
  }

  if (filterMode === 'remaining') {
    return !boss.killed
  }

  return true
}

function pictoMatchesFilter(
  picto: Picto,
  filterMode: ChecklistFilterMode,
): boolean {
  if (filterMode === 'found') {
    return picto.found
  }

  if (filterMode === 'remaining') {
    return !picto.found
  }

  return true
}

export function normalizeZoneName(
  rawName: string | undefined,
  _source: ZoneSource,
): NormalizedZoneMatch {
  const trimmed = rawName?.trim() ?? ''
  if (trimmed.length === 0) {
    return { zoneName: DEFAULT_ZONE_NAME, matched: true }
  }

  const zoneName = zoneAliasLookup.get(toZoneLookupKey(trimmed))
  if (zoneName) {
    return { zoneName, matched: true }
  }

  return {
    zoneName: trimmed,
    matched: false,
  }
}

export function buildChecklistModel(
  bosses: Boss[],
  pictos: Picto[],
): ChecklistModel {
  const groups = new Map<string, ChecklistZoneGroup>()
  const unmatchedZoneNames: UnmatchedZoneName[] = []

  const getOrCreateGroup = (zoneName: string): ChecklistZoneGroup => {
    const existing = groups.get(zoneName)
    if (existing) {
      return existing
    }

    const created: ChecklistZoneGroup = {
      zoneName,
      bosses: [],
      pictos: [],
      killed: 0,
      encountered: 0,
      totalBosses: 0,
      foundPictos: 0,
      totalPictos: 0,
      unmatchedEntries: [],
    }
    groups.set(zoneName, created)
    return created
  }

  for (const boss of bosses) {
    const normalized = normalizeZoneName(boss.zone, 'boss')
    const group = getOrCreateGroup(normalized.zoneName)
    group.bosses.push(boss)
    group.totalBosses += 1
    if (boss.encountered) {
      group.encountered += 1
    }
    if (boss.killed) {
      group.killed += 1
    }

    if (!normalized.matched && (boss.zone?.trim() ?? '').length > 0) {
      const unmatched = {
        source: 'boss' as const,
        rawName: boss.zone!.trim(),
        fallbackZoneName: normalized.zoneName,
      }
      unmatchedZoneNames.push(unmatched)
      group.unmatchedEntries.push(unmatched)
    }
  }

  for (const picto of pictos) {
    const normalized = normalizeZoneName(picto.mapName, 'picto')
    const group = getOrCreateGroup(normalized.zoneName)
    group.pictos.push(picto)
    group.totalPictos += 1
    if (picto.found) {
      group.foundPictos += 1
    }

    if (!normalized.matched && picto.mapName.trim().length > 0) {
      const unmatched = {
        source: 'picto' as const,
        rawName: picto.mapName.trim(),
        fallbackZoneName: normalized.zoneName,
      }
      unmatchedZoneNames.push(unmatched)
      group.unmatchedEntries.push(unmatched)
    }
  }

  return {
    zoneGroups: Array.from(groups.values()),
    unmatchedZoneNames,
  }
}

export function summarizeChecklist(model: ChecklistModel): ChecklistSummary {
  const totalBosses = model.zoneGroups.reduce(
    (sum, zone) => sum + zone.totalBosses,
    0,
  )
  const killedBosses = model.zoneGroups.reduce((sum, zone) => sum + zone.killed, 0)
  const totalPictos = model.zoneGroups.reduce(
    (sum, zone) => sum + zone.totalPictos,
    0,
  )
  const foundPictos = model.zoneGroups.reduce(
    (sum, zone) => sum + zone.foundPictos,
    0,
  )

  return {
    killedBosses,
    totalBosses,
    remainingBosses: totalBosses - killedBosses,
    foundPictos,
    totalPictos,
    remainingPictos: totalPictos - foundPictos,
  }
}

export function filterChecklistGroups(
  model: ChecklistModel,
  options: ChecklistFilterOptions,
): FilteredChecklistZoneGroup[] {
  const searchTerm = options.searchTerm.trim().toLowerCase()
  const translateBossName = options.translateBossName ?? ((value: string) => value)

  return model.zoneGroups
    .map((zone) => {
      const visibleBosses = zone.bosses.filter(
        (boss) =>
          bossMatchesFilter(boss, options.filterMode) &&
          (searchTerm.length === 0 ||
            bossMatchesSearch(boss, searchTerm, translateBossName)),
      )

      const visiblePictos = zone.pictos.filter(
        (picto) =>
          pictoMatchesFilter(picto, options.filterMode) &&
          (searchTerm.length === 0 || pictoMatchesSearch(picto, searchTerm)),
      )

      return {
        ...zone,
        visibleBosses,
        visiblePictos,
      }
    })
    .filter(
      (zone) => zone.visibleBosses.length > 0 || zone.visiblePictos.length > 0,
    )
}

export function reportUnmatchedZoneNames(
  unmatchedZoneNames: UnmatchedZoneName[],
  log: (message: string) => void = console.warn,
): void {
  for (const unmatched of unmatchedZoneNames) {
    const dedupeKey = `${unmatched.source}:${unmatched.rawName}`
    if (reportedUnmatchedZoneNames.has(dedupeKey)) {
      continue
    }

    reportedUnmatchedZoneNames.add(dedupeKey)
    log(
      `[zone-normalization] Unmatched ${unmatched.source} zone "${unmatched.rawName}" is using fallback group "${unmatched.fallbackZoneName}".`,
    )
  }
}
