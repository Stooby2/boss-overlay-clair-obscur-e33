import assert from 'node:assert/strict'

import {
  buildChecklistModel,
  normalizeZoneName,
  reportUnmatchedZoneNames,
} from '../src/components/checklistModel.ts'
import type { Boss } from '../src/types/Boss.ts'
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
    zone: 'red_woods',
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
    effect: '',
    health: '',
    defense: '',
    speed: '',
    criticalRate: '',
    mapName: 'Verso’s Drafts',
    nearestFlag: '',
    mapAndNearestFlag: 'Verso’s Drafts ()',
    howToGet: '',
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

assert.deepEqual(normalizeZoneName('Spring Meadows', 'picto'), {
  zoneName: 'spring_meadows',
  matched: true,
})

assert.deepEqual(normalizeZoneName('Verso’s Drafts', 'picto'), {
  zoneName: 'verso_drafts',
  matched: true,
})

assert.deepEqual(normalizeZoneName('Floating Cemetery', 'picto'), {
  zoneName: 'Floating Cemetery',
  matched: false,
})

const model = buildChecklistModel(bosses, pictos)
const springMeadows = model.zoneGroups.find(
  (zone) => zone.zoneName === 'spring_meadows',
)
assert.ok(springMeadows)
assert.equal(springMeadows.bosses.length, 1)
assert.equal(springMeadows.pictos.length, 1)
assert.equal(springMeadows.killed, 1)
assert.equal(springMeadows.totalPictos, 1)

const versoDrafts = model.zoneGroups.find(
  (zone) => zone.zoneName === 'verso_drafts',
)
assert.ok(versoDrafts)
assert.equal(versoDrafts.pictos.length, 1)

assert.deepEqual(model.unmatchedZoneNames, [
  {
    source: 'boss',
    rawName: 'red_woods',
    fallbackZoneName: 'red_woods',
  },
  {
    source: 'picto',
    rawName: 'Floating Cemetery',
    fallbackZoneName: 'Floating Cemetery',
  },
])

const logged: string[] = []
reportUnmatchedZoneNames(model.unmatchedZoneNames, (message) => {
  logged.push(message)
})
reportUnmatchedZoneNames(model.unmatchedZoneNames, (message) => {
  logged.push(message)
})

assert.equal(logged.length, 2)
assert.match(logged[0], /red_woods/)
assert.match(logged[1], /Floating Cemetery/)

console.log('checklistModel tests passed')
