import assert from 'node:assert/strict'

import {
  buildChecklistModel,
  filterChecklistGroups,
  normalizeZoneName,
  reportUnmatchedZoneNames,
  summarizeChecklist,
} from '../src/components/checklistModel.ts'
import type { Boss } from '../src/types/Boss.ts'
import type { CurrentLocation } from '../src/types/CurrentLocation.ts'
import type { Picto } from '../src/types/Picto.ts'

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

const model = buildChecklistModel(bosses, pictos, currentLocation)
const summary = summarizeChecklist(model)
assert.deepEqual(summary, {
  killedBosses: 1,
  totalBosses: 2,
  remainingBosses: 1,
  foundPictos: 1,
  totalPictos: 3,
  remainingPictos: 2,
  currentZoneRemainingBosses: 0,
  currentZoneRemainingPictos: 1,
})
assert.equal(model.currentZoneName, 'floating_cemetery')

const springMeadows = model.zoneGroups.find(
  (zone) => zone.zoneName === 'spring_meadows',
)
assert.ok(springMeadows)
assert.equal(springMeadows.bosses.length, 1)
assert.equal(springMeadows.pictos.length, 1)
assert.equal(springMeadows.killed, 1)
assert.equal(springMeadows.totalPictos, 1)
assert.equal(springMeadows.unmatchedEntries.length, 0)

const versoDrafts = model.zoneGroups.find(
  (zone) => zone.zoneName === 'verso_drafts',
)
assert.ok(versoDrafts)
assert.equal(versoDrafts.pictos.length, 1)
assert.equal(versoDrafts.unmatchedEntries.length, 0)

const floatingCemetery = model.zoneGroups.find(
  (zone) => zone.zoneName === 'floating_cemetery',
)
assert.ok(floatingCemetery)
assert.equal(floatingCemetery.pictos.length, 1)
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
assert.equal(foundGroups.length, 1)
assert.equal(foundGroups[0].visibleBosses.length, 1)
assert.equal(foundGroups[0].visiblePictos.length, 1)

const remainingGroups = filterChecklistGroups(model, {
  filterMode: 'remaining',
  searchTerm: 'accelerating heal',
  translateBossName: (value) => value,
})
assert.equal(remainingGroups.length, 1)
assert.equal(remainingGroups[0].zoneName, 'verso_drafts')
assert.equal(remainingGroups[0].visibleBosses.length, 0)
assert.equal(remainingGroups[0].visiblePictos.length, 1)

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

const currentZoneSearchMiss = filterChecklistGroups(model, {
  filterMode: 'current_zone',
  searchTerm: 'open playground',
  translateBossName: (value) => value,
})
assert.equal(currentZoneSearchMiss.length, 0)

const unresolvedCurrentZone = buildChecklistModel(bosses, pictos, {
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

const searchByWaypoint = filterChecklistGroups(model, {
  filterMode: 'all',
  searchTerm: 'open playground',
  translateBossName: (value) => value,
})
assert.equal(searchByWaypoint.length, 1)
assert.equal(searchByWaypoint[0].zoneName, 'verso_drafts')
assert.equal(searchByWaypoint[0].visiblePictos[0].friendlyName, 'Accelerating Heal')

const logged: string[] = []
reportUnmatchedZoneNames(model.unmatchedZoneNames, (message) => {
  logged.push(message)
})
reportUnmatchedZoneNames(model.unmatchedZoneNames, (message) => {
  logged.push(message)
})

assert.equal(logged.length, 1)
assert.match(logged[0], /mystery_woods/)

console.log('checklistModel tests passed')
