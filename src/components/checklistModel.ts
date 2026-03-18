import type { Boss } from '../types/Boss'
import type { CurrentLocation } from '../types/CurrentLocation'
import type { MonocoFoot } from '../types/MonocoFoot'
import type { Picto } from '../types/Picto'

export type ZoneSource = 'boss' | 'picto' | 'foot' | 'location'
export type ChecklistFilterMode = 'all' | 'found' | 'remaining' | 'current_zone'

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
  monocoFeet: MonocoFoot[]
  killed: number
  encountered: number
  totalBosses: number
  foundPictos: number
  totalPictos: number
  foundFeet: number
  totalFeet: number
  unmatchedEntries: UnmatchedZoneName[]
}

export interface FilteredChecklistZoneGroup extends ChecklistZoneGroup {
  visibleBosses: Boss[]
  visiblePictos: Picto[]
  visibleMonocoFeet: MonocoFoot[]
}

export interface ChecklistModel {
  zoneGroups: ChecklistZoneGroup[]
  unmatchedZoneNames: UnmatchedZoneName[]
  currentZoneName: string | null
  monocoFeet: MonocoFoot[]
}

export interface ChecklistSummary {
  killedBosses: number
  totalBosses: number
  remainingBosses: number
  foundPictos: number
  totalPictos: number
  remainingPictos: number
  foundFeet: number
  totalFeet: number
  remainingFeet: number
  currentZoneRemainingBosses: number
  currentZoneRemainingPictos: number
  currentZoneRemainingFeet: number
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
  lumiere: ['lumiere', 'Lumiere', 'Lumière'],
  lumiere_prologue: ['lumiere_prologue', 'Lumiere - Prologue'],
  monoco_station: ['monoco_station', "Monoco's Station"],
  old_lumiere: ['old_lumiere', 'Old Lumiere', 'Old Lumière'],
  painting_workshop: ['painting_workshop', 'Painting Workshop'],
  red_woods: ['red_woods', 'Red Woods'],
  renoir_drafts: [
    'renoir_drafts',
    "Renoir's Drafts",
    "Renoir's Drafts - Entrance",
  ],
  sacred_river: ['sacred_river', 'Sacred River'],
  sinister_cave: ['sinister_cave', 'Sinister Cave'],
  sirene: ['sirene', 'Sirene', 'Sirène'],
  sirene_dress: ['sirene_dress', "Sirene's Dress", "Sirène's Dress"],
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
  verso_drafts: ['verso_drafts', "Verso's Draft", "Verso's Drafts"],
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

function monocoFootMatchesSearch(foot: MonocoFoot, term: string): boolean {
  return [foot.skillName, foot.footName, foot.monsterName, ...foot.locations].some(
    (value) => value.toLowerCase().includes(term),
  )
}

function bossMatchesFilter(boss: Boss, filterMode: ChecklistFilterMode): boolean {
  if (filterMode === 'found') {
    return boss.encountered && boss.killed
  }

  if (filterMode === 'remaining' || filterMode === 'current_zone') {
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

  if (filterMode === 'remaining' || filterMode === 'current_zone') {
    return !picto.found
  }

  return true
}

function monocoFootMatchesFilter(
  foot: MonocoFoot,
  filterMode: ChecklistFilterMode,
): boolean {
  if (filterMode === 'found') {
    return foot.found
  }

  if (filterMode === 'remaining' || filterMode === 'current_zone') {
    return !foot.found
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

function normalizeCurrentLocation(
  currentLocation: CurrentLocation | null | undefined,
): {
  currentZoneName: string | null
  unmatchedLocation: UnmatchedZoneName[]
} {
  if (!currentLocation) {
    return { currentZoneName: null, unmatchedLocation: [] }
  }

  const rawName = currentLocation.areaName ?? currentLocation.displayName
  if (!rawName) {
    return { currentZoneName: null, unmatchedLocation: [] }
  }

  const normalized = normalizeZoneName(rawName, 'location')
  if (normalized.matched) {
    return { currentZoneName: normalized.zoneName, unmatchedLocation: [] }
  }

  return {
    currentZoneName: normalized.zoneName,
    unmatchedLocation: [
      {
        source: 'location',
        rawName,
        fallbackZoneName: normalized.zoneName,
      },
    ],
  }
}

export function buildChecklistModel(
  bosses: Boss[],
  pictos: Picto[],
  monocoFeet: MonocoFoot[],
  currentLocation?: CurrentLocation | null,
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
      monocoFeet: [],
      killed: 0,
      encountered: 0,
      totalBosses: 0,
      foundPictos: 0,
      totalPictos: 0,
      foundFeet: 0,
      totalFeet: 0,
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

  for (const foot of monocoFeet) {
    const rawLocations = foot.locations.length > 0 ? foot.locations : ['']
    const processedZones = new Set<string>()

    for (const rawLocation of rawLocations) {
      const normalized = normalizeZoneName(rawLocation, 'foot')
      if (processedZones.has(normalized.zoneName)) {
        continue
      }
      processedZones.add(normalized.zoneName)

      const group = getOrCreateGroup(normalized.zoneName)
      group.monocoFeet.push(foot)
      group.totalFeet += 1
      if (foot.found) {
        group.foundFeet += 1
      }

      if (!normalized.matched && rawLocation.trim().length > 0) {
        const unmatched = {
          source: 'foot' as const,
          rawName: rawLocation.trim(),
          fallbackZoneName: normalized.zoneName,
        }
        unmatchedZoneNames.push(unmatched)
        group.unmatchedEntries.push(unmatched)
      }
    }
  }

  const normalizedLocation = normalizeCurrentLocation(currentLocation)
  unmatchedZoneNames.push(...normalizedLocation.unmatchedLocation)

  return {
    zoneGroups: Array.from(groups.values()),
    unmatchedZoneNames,
    currentZoneName: normalizedLocation.currentZoneName,
    monocoFeet,
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
  const totalFeet = model.monocoFeet.length
  const foundFeet = model.monocoFeet.filter((foot) => foot.found).length
  const currentZone = model.currentZoneName
    ? model.zoneGroups.find((zone) => zone.zoneName === model.currentZoneName) ?? null
    : null

  return {
    killedBosses,
    totalBosses,
    remainingBosses: totalBosses - killedBosses,
    foundPictos,
    totalPictos,
    remainingPictos: totalPictos - foundPictos,
    foundFeet,
    totalFeet,
    remainingFeet: totalFeet - foundFeet,
    currentZoneRemainingBosses: currentZone
      ? currentZone.totalBosses - currentZone.killed
      : 0,
    currentZoneRemainingPictos: currentZone
      ? currentZone.totalPictos - currentZone.foundPictos
      : 0,
    currentZoneRemainingFeet: currentZone
      ? currentZone.totalFeet - currentZone.foundFeet
      : 0,
  }
}

export function filterChecklistGroups(
  model: ChecklistModel,
  options: ChecklistFilterOptions,
): FilteredChecklistZoneGroup[] {
  const searchTerm = options.searchTerm.trim().toLowerCase()
  const translateBossName = options.translateBossName ?? ((value: string) => value)

  let zoneGroups = model.zoneGroups
  if (options.filterMode === 'current_zone') {
    if (!model.currentZoneName) {
      return []
    }

    zoneGroups = zoneGroups.filter((zone) => zone.zoneName === model.currentZoneName)
  }

  return zoneGroups
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

      const visibleMonocoFeet = zone.monocoFeet.filter(
        (foot) =>
          monocoFootMatchesFilter(foot, options.filterMode) &&
          (searchTerm.length === 0 || monocoFootMatchesSearch(foot, searchTerm)),
      )

      return {
        ...zone,
        visibleBosses,
        visiblePictos,
        visibleMonocoFeet,
      }
    })
    .filter(
      (zone) =>
        zone.visibleBosses.length > 0 ||
        zone.visiblePictos.length > 0 ||
        zone.visibleMonocoFeet.length > 0,
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
