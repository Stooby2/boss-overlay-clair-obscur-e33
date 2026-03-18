import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import type { MonocoFeetCatalogFile, MonocoFeetSaveData } from '../electron/monocoFeet.ts'
import { extractMonocoFeet, parseMonocoFeetMetadata } from '../electron/monocoFeet.ts'
import {
  buildChecklistModel,
  filterChecklistGroups,
  normalizeZoneName,
  reportUnmatchedZoneNames,
  summarizeChecklist,
} from '../src/components/checklistModel.ts'
import type { Boss } from '../src/types/Boss.ts'
import type { CurrentLocation } from '../src/types/CurrentLocation.ts'
import type { MonocoFoot } from '../src/types/MonocoFoot.ts'
import type { Picto } from '../src/types/Picto.ts'

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf-8')) as T
}

const bosses: Boss[] = [
  {
    name: 'eveque',
    killed: true,
    encountered: true,
    zone: 'spring_meadows',
  },
  {
    name: 'scavenger',
    killed: false,
    encountered: true,
    zone: 'mystery_woods',
  },
]

const pictos: Picto[] = [
  {
    id: 'Dodger',
    friendlyName: 'Dodger',
    found: true,
    mastered: true,
    level: 3,
    effect: 'Gain 1 AP after Perfect Dodge. Once per turn.',
    health: '',
    defense: '',
    speed: '12',
    criticalRate: '3%',
    mapName: 'Spring Meadows',
    nearestFlag: 'Meadows Corridor',
    mapAndNearestFlag: 'Spring Meadows (Meadows Corridor)',
    howToGet: 'Defeat the Portier after Lune joins the party.',
  },
  {
    id: 'AcceleratorHeal',
    friendlyName: 'Accelerating Heal',
    found: false,
    mastered: false,
    level: 1,
    effect: 'Gain Rush after healing.',
    health: '',
    defense: '',
    speed: '',
    criticalRate: '',
    mapName: 'Verso’s Drafts',
    nearestFlag: 'Open Playground',
    mapAndNearestFlag: 'Verso’s Drafts (Open Playground)',
    howToGet: 'Follow the right tunnel from the open playground.',
  },
  {
    id: 'CriticalBreak',
    friendlyName: 'Critical Break',
    found: false,
    mastered: false,
    level: 1,
    effect: '',
    health: '',
    defense: '',
    speed: '',
    criticalRate: '',
    mapName: 'Floating Cemetery',
    nearestFlag: '',
    mapAndNearestFlag: 'Floating Cemetery ()',
    howToGet: '',
  },
]

const monocoFeet: MonocoFoot[] = [
  {
    id: 'AbbestFoot',
    skillId: 'AbbestMelee',
    skillName: 'Abbest Wind',
    footName: "Abbest's Foot",
    found: false,
    count: 0,
    skillUnlocked: false,
    monsterName: 'Abbest',
    monsterUrl: 'https://clair-obscur.fandom.com/wiki/Abbest',
    fextraUrl: 'https://expedition33.wiki.fextralife.com/Abbest',
    locations: ['Spring Meadows', 'The Monolith'],
  },
  {
    id: 'RamasseurFoot',
    skillId: 'RamasseurBonk',
    skillName: 'Ramasseur Bonk',
    footName: "Ramasseur's Foot",
    found: true,
    count: 1,
    skillUnlocked: true,
    monsterName: 'Ramasseur',
    monsterUrl: 'https://clair-obscur.fandom.com/wiki/Ramasseur',
    fextraUrl: 'https://expedition33.wiki.fextralife.com/Ramasseur',
    locations: ['Floating Cemetery'],
  },
  {
    id: 'CultistFoot',
    skillId: 'FlyingCultistSlash',
    skillName: 'Cultist Blood',
    footName: "Cultist's Foot",
    found: false,
    count: 0,
    skillUnlocked: false,
    monsterName: 'Cultist',
    monsterUrl: 'https://clair-obscur.fandom.com/wiki/Cultist',
    fextraUrl: 'https://expedition33.wiki.fextralife.com/Cultist',
    locations: ['Floating Cemetery'],
  },
]

const currentLocation: CurrentLocation = {
  levelKey: 'Level_Sirene_Main_V2',
  spawnTag: 'Level.SpawnPoint.Generic.Dynamic',
  returnSpawnTag: 'Level.SpawnPoint.WorldMap.Dynamic',
  areaName: 'Floating Cemetery',
  subLocationName: null,
  displayName: 'Floating Cemetery',
}

assert.deepEqual(normalizeZoneName('Spring Meadows', 'picto'), {
  zoneName: 'spring_meadows',
  matched: true,
})

assert.deepEqual(normalizeZoneName('Verso’s Drafts', 'picto'), {
  zoneName: 'verso_drafts',
  matched: true,
})

assert.deepEqual(normalizeZoneName('Floating Cemetery', 'picto'), {
  zoneName: 'floating_cemetery',
  matched: true,
})

assert.deepEqual(normalizeZoneName("Monoco's Station", 'foot'), {
  zoneName: 'monoco_station',
  matched: true,
})

assert.deepEqual(normalizeZoneName('Sirène', 'location'), {
  zoneName: 'sirene',
  matched: true,
})

assert.deepEqual(normalizeZoneName('lumiere_prologue', 'boss'), {
  zoneName: 'lumiere_prologue',
  matched: true,
})

assert.deepEqual(normalizeZoneName('mystery_woods', 'boss'), {
  zoneName: 'mystery_woods',
  matched: false,
})

const model = buildChecklistModel(bosses, pictos, monocoFeet, currentLocation)
const summary = summarizeChecklist(model)
assert.deepEqual(summary, {
  killedBosses: 1,
  totalBosses: 2,
  remainingBosses: 1,
  foundPictos: 1,
  totalPictos: 3,
  remainingPictos: 2,
  foundFeet: 1,
  totalFeet: 3,
  remainingFeet: 2,
  currentZoneRemainingBosses: 0,
  currentZoneRemainingPictos: 1,
  currentZoneRemainingFeet: 1,
})
assert.equal(model.currentZoneName, 'floating_cemetery')

const springMeadows = model.zoneGroups.find(
  (zone) => zone.zoneName === 'spring_meadows',
)
assert.ok(springMeadows)
assert.equal(springMeadows.bosses.length, 1)
assert.equal(springMeadows.pictos.length, 1)
assert.equal(springMeadows.monocoFeet.length, 1)
assert.equal(springMeadows.killed, 1)
assert.equal(springMeadows.totalPictos, 1)
assert.equal(springMeadows.totalFeet, 1)
assert.equal(springMeadows.unmatchedEntries.length, 0)

const theMonolith = model.zoneGroups.find((zone) => zone.zoneName === 'the_monolith')
assert.ok(theMonolith)
assert.equal(theMonolith.monocoFeet.length, 1)
assert.equal(theMonolith.totalFeet, 1)
assert.equal(theMonolith.foundFeet, 0)

const floatingCemetery = model.zoneGroups.find(
  (zone) => zone.zoneName === 'floating_cemetery',
)
assert.ok(floatingCemetery)
assert.equal(floatingCemetery.pictos.length, 1)
assert.equal(floatingCemetery.monocoFeet.length, 2)
assert.equal(floatingCemetery.foundFeet, 1)
assert.equal(floatingCemetery.totalFeet, 2)
assert.equal(floatingCemetery.unmatchedEntries.length, 0)

const mysteryWoods = model.zoneGroups.find(
  (zone) => zone.zoneName === 'mystery_woods',
)
assert.ok(mysteryWoods)
assert.deepEqual(mysteryWoods.unmatchedEntries, [
  {
    source: 'boss',
    rawName: 'mystery_woods',
    fallbackZoneName: 'mystery_woods',
  },
])

assert.deepEqual(model.unmatchedZoneNames, [
  {
    source: 'boss',
    rawName: 'mystery_woods',
    fallbackZoneName: 'mystery_woods',
  },
])

const foundGroups = filterChecklistGroups(model, {
  filterMode: 'found',
  searchTerm: '',
  translateBossName: (value) => value,
})
assert.equal(foundGroups.length, 2)
assert.equal(foundGroups[0].visibleBosses.length + foundGroups[1].visibleBosses.length, 1)
assert.equal(foundGroups[0].visiblePictos.length + foundGroups[1].visiblePictos.length, 1)
assert.equal(
  foundGroups[0].visibleMonocoFeet.length + foundGroups[1].visibleMonocoFeet.length,
  1,
)

const remainingGroups = filterChecklistGroups(model, {
  filterMode: 'remaining',
  searchTerm: 'abbest wind',
  translateBossName: (value) => value,
})
assert.equal(remainingGroups.length, 2)
assert.equal(remainingGroups[0].visibleBosses.length + remainingGroups[1].visibleBosses.length, 0)
assert.equal(remainingGroups[0].visiblePictos.length + remainingGroups[1].visiblePictos.length, 0)
assert.equal(
  remainingGroups[0].visibleMonocoFeet.length + remainingGroups[1].visibleMonocoFeet.length,
  2,
)

const currentZoneGroups = filterChecklistGroups(model, {
  filterMode: 'current_zone',
  searchTerm: '',
  translateBossName: (value) => value,
})
assert.equal(currentZoneGroups.length, 1)
assert.equal(currentZoneGroups[0].zoneName, 'floating_cemetery')
assert.equal(currentZoneGroups[0].visibleBosses.length, 0)
assert.equal(currentZoneGroups[0].visiblePictos.length, 1)
assert.equal(currentZoneGroups[0].visiblePictos[0].friendlyName, 'Critical Break')
assert.equal(currentZoneGroups[0].visibleMonocoFeet.length, 1)
assert.equal(currentZoneGroups[0].visibleMonocoFeet[0].skillName, 'Cultist Blood')

const currentZoneSearchMiss = filterChecklistGroups(model, {
  filterMode: 'current_zone',
  searchTerm: 'open playground',
  translateBossName: (value) => value,
})
assert.equal(currentZoneSearchMiss.length, 0)

const searchByMonsterName = filterChecklistGroups(model, {
  filterMode: 'all',
  searchTerm: 'abbest',
  translateBossName: (value) => value,
})
assert.equal(searchByMonsterName.length, 2)
assert.equal(
  searchByMonsterName[0].visibleMonocoFeet.length + searchByMonsterName[1].visibleMonocoFeet.length,
  2,
)

const unresolvedCurrentZone = buildChecklistModel(bosses, pictos, monocoFeet, {
  levelKey: 'Level_Unknown_Debug',
  spawnTag: 'Level.SpawnPoint.Unknown.Debug',
  areaName: 'Mystery Depths',
  subLocationName: null,
  displayName: 'Mystery Depths',
})
assert.equal(unresolvedCurrentZone.currentZoneName, 'Mystery Depths')
assert.deepEqual(unresolvedCurrentZone.unmatchedZoneNames, [
  {
    source: 'boss',
    rawName: 'mystery_woods',
    fallbackZoneName: 'mystery_woods',
  },
  {
    source: 'location',
    rawName: 'Mystery Depths',
    fallbackZoneName: 'Mystery Depths',
  },
])
assert.equal(
  filterChecklistGroups(unresolvedCurrentZone, {
    filterMode: 'current_zone',
    searchTerm: '',
    translateBossName: (value) => value,
  }).length,
  0,
)

const logged: string[] = []
reportUnmatchedZoneNames(model.unmatchedZoneNames, (message) => {
  logged.push(message)
})
reportUnmatchedZoneNames(model.unmatchedZoneNames, (message) => {
  logged.push(message)
})

assert.equal(logged.length, 1)
assert.match(logged[0], /mystery_woods/)

const rootDir = process.cwd()
const monocoCatalogPath = resolve(rootDir, 'data', 'monoco_feet.json')
const monocoMetadataPath = resolve(rootDir, 'data', 'feet_collection_with_locations.json')
const monocoFixturePath = resolve(rootDir, 'test_save', 'monoco', '26_feet.json')

const monocoCatalog = await readJson<MonocoFeetCatalogFile>(monocoCatalogPath)
const monocoMetadata = parseMonocoFeetMetadata(
  await readJson(monocoMetadataPath),
)
const monocoFixture = await readJson<MonocoFeetSaveData>(monocoFixturePath)
const extractedMonocoFeet = extractMonocoFeet(
  monocoFixture,
  monocoCatalog.MonocoFeet,
  monocoMetadata,
)

assert.equal(
  extractedMonocoFeet.filter((foot) => foot.found).length,
  24,
  'The 26-feet fixture should include 24 collectible feet plus the 2 starter skills outside the catalog.',
)

console.log('checklistModel tests passed')
