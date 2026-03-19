import assert from 'node:assert/strict'

import type { FilteredChecklistZoneGroup } from '../src/components/checklistModel.ts'
import {
  applyChecklistFeatureVisibility,
  buildFilterCountParts,
  buildZoneStatsParts,
  DEFAULT_CHECKLIST_FEATURE_VISIBILITY,
  toggleChecklistFeatureVisibility,
  zoneHasVisibleContent,
} from '../src/components/checklistVisibility.ts'

const sampleZone = {
  zoneName: 'spring_meadows',
  bosses: [],
  pictos: [],
  monocoFeet: [],
  journals: [],
  lostGestrals: [],
  friendlyNevrons: [],
  weapons: [],
  killed: 1,
  encountered: 1,
  totalBosses: 2,
  foundPictos: 3,
  totalPictos: 5,
  foundFeet: 1,
  totalFeet: 2,
  foundJournals: 1,
  totalJournals: 4,
  foundLostGestrals: 0,
  totalLostGestrals: 1,
  peacefulFriendlyNevrons: 0,
  killedFriendlyNevrons: 0,
  totalFriendlyNevrons: 1,
  foundWeapons: 1,
  totalWeapons: 3,
  unmatchedEntries: [],
  visibleBosses: [{ name: 'goblu' }],
  visiblePictos: [{ id: 'Dodger' }],
  visibleMonocoFeet: [{ id: 'AbbestFoot' }],
  visibleJournals: [{ id: 'Journal_Exp81' }],
  visibleLostGestrals: [{ id: 'FindLostGestral_1' }],
  visibleFriendlyNevrons: [{ id: 'Nevron_JarNeedLight' }],
  visibleWeapons: [{ id: 'PracticeBlade' }],
} as unknown as FilteredChecklistZoneGroup

const visibility = toggleChecklistFeatureVisibility(
  DEFAULT_CHECKLIST_FEATURE_VISIBILITY,
  'bosses',
)
assert.equal(visibility.bosses, false)
assert.equal(visibility.pictos, true)

const hiddenGroups = applyChecklistFeatureVisibility([sampleZone], {
  ...DEFAULT_CHECKLIST_FEATURE_VISIBILITY,
  bosses: false,
  pictos: false,
  journals: false,
  lostGestrals: false,
})
assert.equal(hiddenGroups[0].visibleBosses.length, 0)
assert.equal(hiddenGroups[0].visiblePictos.length, 0)
assert.equal(hiddenGroups[0].visibleJournals.length, 0)
assert.equal(hiddenGroups[0].visibleLostGestrals.length, 0)
assert.equal(hiddenGroups[0].visibleMonocoFeet.length, 1)
assert.equal(hiddenGroups[0].visibleWeapons.length, 1)
assert.equal(zoneHasVisibleContent(hiddenGroups[0]), true)

const emptyGroups = applyChecklistFeatureVisibility([sampleZone], {
  bosses: false,
  pictos: false,
  feet: false,
  journals: false,
  lostGestrals: false,
  friendlyNevrons: false,
  weapons: false,
})
assert.equal(zoneHasVisibleContent(emptyGroups[0]), false)

assert.deepEqual(
  buildFilterCountParts(
    {
      killedBosses: 4,
      totalBosses: 10,
      remainingBosses: 6,
      foundPictos: 11,
      totalPictos: 20,
      remainingPictos: 9,
      foundFeet: 2,
      totalFeet: 8,
      remainingFeet: 6,
      foundJournals: 1,
      totalJournals: 3,
      remainingJournals: 2,
      foundLostGestrals: 5,
      totalLostGestrals: 9,
      remainingLostGestrals: 4,
      peacefulFriendlyNevrons: 2,
      killedFriendlyNevrons: 1,
      totalFriendlyNevrons: 10,
      remainingFriendlyNevrons: 7,
      foundWeapons: 4,
      totalWeapons: 12,
      remainingWeapons: 8,
      currentZoneRemainingBosses: 1,
      currentZoneRemainingPictos: 2,
      currentZoneRemainingFeet: 3,
      currentZoneRemainingJournals: 0,
      currentZoneRemainingLostGestrals: 0,
      currentZoneRemainingFriendlyNevrons: 0,
      currentZoneRemainingWeapons: 0,
    },
    {
      bosses: false,
      pictos: true,
      feet: false,
      journals: true,
      lostGestrals: true,
      friendlyNevrons: true,
      weapons: true,
    },
    'remaining',
  ),
  ['P:9'],
)

assert.deepEqual(
  buildZoneStatsParts(sampleZone, {
    bosses: false,
    pictos: true,
    feet: false,
    journals: true,
    lostGestrals: false,
    friendlyNevrons: true,
    weapons: true,
  }),
  ['P 3/5', 'J 1/4'],
)

console.log('checklistVisibility tests passed')
