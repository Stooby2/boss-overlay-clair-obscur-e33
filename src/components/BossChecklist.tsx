import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '../i18n'
import type { Boss } from '../types/Boss'
import type { CurrentLocation } from '../types/CurrentLocation'
import type { JournalEntry } from '../types/JournalEntry'
import type { MonocoFoot } from '../types/MonocoFoot'
import type { Picto } from '../types/Picto'
import { formatZoneLevelLabel } from '../utils/zoneLevelLabel.ts'
import {
  buildChecklistModel,
  type ChecklistFilterMode,
  filterChecklistGroups,
  reportUnmatchedZoneNames,
  summarizeChecklist,
} from './checklistModel'

interface Props {
  bosses: Boss[]
  pictos: Picto[]
  monocoFeet: MonocoFoot[]
  journals: JournalEntry[]
  currentLocation?: CurrentLocation | null
  filterMode: ChecklistFilterMode
  onFilterModeChange: (mode: ChecklistFilterMode) => void
  onAddBoss?: () => void
  onToggleBoss?: (boss: Boss, killed: boolean) => void
  allowManualEdit?: boolean
}

interface BossRowProps {
  boss: Boss
  allowManualEdit: boolean
  onToggleBoss?: (boss: Boss, killed: boolean) => void
  translateBossName: (bossName: string) => string
  t: (key: string, params?: Record<string, string | number>) => string
}

interface PictoRowProps {
  picto: Picto
  t: (key: string, params?: Record<string, string | number>) => string
}

interface MonocoFootRowProps {
  foot: MonocoFoot
  t: (key: string, params?: Record<string, string | number>) => string
}

const CHECKBOX_KILLED = '\u2611'
const CHECKBOX_ENCOUNTERED = '\u2610'
const CHECKBOX_UNKNOWN = '\u2B1C'
const MANUAL_MARKER = '\u{1F527}'
const EXPAND_ALL_ICON = '\u{1F4C2}'
const COLLAPSE_ALL_ICON = '\u{1F4C1}'
const ZONE_EXPANDED_ICON = '\u25BC'
const ZONE_COLLAPSED_ICON = '\u25B6'

function BossRow({
  boss,
  allowManualEdit,
  onToggleBoss,
  translateBossName,
  t,
}: BossRowProps) {
  const isManualBoss = boss.originalName?.startsWith('MANUAL_')
  const canToggle = isManualBoss || allowManualEdit
  const tooltipText = !canToggle
    ? t('bossList.autoDetected')
    : boss.killed
      ? t('bossList.markAsAlive')
      : t('bossList.markAsKilled')

  return (
    <div
      className={`boss-item ${boss.killed ? 'killed' : ''} ${!boss.encountered ? 'not-encountered' : ''}`}
    >
      <span
        className="checkbox"
        onClick={() => canToggle && onToggleBoss?.(boss, !boss.killed)}
        style={{
          cursor: canToggle && onToggleBoss ? 'pointer' : 'not-allowed',
          opacity: canToggle ? 1 : 0.5,
        }}
        title={tooltipText}
      >
        {boss.killed ? CHECKBOX_KILLED : boss.encountered ? CHECKBOX_ENCOUNTERED : CHECKBOX_UNKNOWN}
      </span>
      <span className="name">
        {translateBossName(boss.name)}
        {boss.originalName?.startsWith('MANUAL_') && (
          <span
            style={{
              marginLeft: '6px',
              fontSize: '11px',
              opacity: 0.7,
            }}
            title={t('bossList.manuallyAdded')}
          >
            {MANUAL_MARKER}
          </span>
        )}
      </span>
    </div>
  )
}

function PictoRow({ picto, t }: PictoRowProps) {
  const nearestFlag = picto.nearestFlag || t('bossList.noNearestFlag')
  const howToGet = picto.howToGet || t('bossList.noHowToGet')

  return (
    <div className={`picto-item ${picto.found ? 'found' : 'missing'}`}>
      <div className="picto-header">
        <span className="picto-name">{picto.friendlyName}</span>
        <span className={`picto-status ${picto.found ? 'found' : 'missing'}`}>
          {picto.found ? t('bossList.pictoFound') : t('bossList.pictoMissing')}
        </span>
      </div>
      <div className="picto-meta">
        <span className="picto-label">{t('bossList.nearestFlagLabel')}</span>
        <span className="picto-value">{nearestFlag}</span>
      </div>
      <div className="picto-meta picto-description">
        <span className="picto-label">{t('bossList.howToGetLabel')}</span>
        <span className="picto-value">{howToGet}</span>
      </div>
    </div>
  )
}

function MonocoFootRow({ foot, t }: MonocoFootRowProps) {
  const locations = foot.locations.length > 0
    ? foot.locations.join(', ')
    : t('bossList.noFootLocations')
  const droppedBy = foot.monsterName || t('bossList.noFootMonster')

  return (
    <div className={`monoco-foot-item ${foot.found ? 'found' : 'missing'}`}>
      <div className="monoco-foot-header">
        <div className="monoco-foot-title-block">
          <span className="monoco-foot-name">{foot.skillName}</span>
          <span className="monoco-foot-subtitle">{foot.footName}</span>
        </div>
        <span className={`monoco-foot-status ${foot.found ? 'found' : 'missing'}`}>
          {foot.found ? t('bossList.footFound') : t('bossList.footMissing')}
        </span>
      </div>
      <div className="monoco-foot-meta">
        <span className="monoco-foot-label">{t('bossList.footDroppedByLabel')}</span>
        <span className="monoco-foot-value">{droppedBy}</span>
      </div>
      <div className="monoco-foot-meta monoco-foot-description">
        <span className="monoco-foot-label">{t('bossList.footLocationsLabel')}</span>
        <span className="monoco-foot-value">{locations}</span>
      </div>
    </div>
  )
}

function BossChecklist(props: Props) {
  const {
    bosses,
    pictos,
    monocoFeet,
    journals,
    currentLocation,
    filterMode,
    onFilterModeChange,
    onAddBoss,
    onToggleBoss,
    allowManualEdit = false,
  } = props
  const { t, translateZone, translateBossName } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set())

  const checklistModel = useMemo(
    () => buildChecklistModel(bosses, pictos, monocoFeet, journals, currentLocation),
    [bosses, pictos, monocoFeet, journals, currentLocation],
  )

  useEffect(() => {
    reportUnmatchedZoneNames(checklistModel.unmatchedZoneNames)
  }, [checklistModel.unmatchedZoneNames])

  const filteredZoneGroups = useMemo(
    () =>
      filterChecklistGroups(checklistModel, {
        filterMode,
        searchTerm,
        translateBossName,
      }),
    [checklistModel, filterMode, searchTerm, translateBossName],
  )

  const stats = useMemo(() => summarizeChecklist(checklistModel), [checklistModel])

  const renderedZoneGroups = useMemo(
    () =>
      filteredZoneGroups.filter(
        (zone) =>
          zone.visibleBosses.length > 0 ||
          zone.visiblePictos.length > 0 ||
          zone.visibleMonocoFeet.length > 0,
      ),
    [filteredZoneGroups],
  )

  const currentLocationLabel =
    currentLocation?.areaName ??
    currentLocation?.displayName ??
    t('bossList.currentZoneUnknown')

  const toggleZone = (zoneName: string) => {
    setCollapsedZones((prev) => {
      const next = new Set(prev)
      if (next.has(zoneName)) {
        next.delete(zoneName)
      } else {
        next.add(zoneName)
      }
      return next
    })
  }

  const toggleAllZones = () => {
    if (collapsedZones.size === renderedZoneGroups.length) {
      setCollapsedZones(new Set())
      return
    }

    setCollapsedZones(new Set(renderedZoneGroups.map((zone) => zone.zoneName)))
  }

  return (
    <div className="boss-list">
      {bosses.length === 0 && pictos.length === 0 && monocoFeet.length === 0 ? (
        <div className="empty">
          <p>{t('bossList.noData')}</p>
          <p>{t('bossList.configurePathInSettings')}</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stats-summary">
              <span className="stat-item killed">
                {t('bossList.bossesKilled', {
                  killed: stats.killedBosses.toString(),
                  total: stats.totalBosses.toString(),
                })}
              </span>
              <span className="stat-item total">
                {t('bossList.pictosCollected', {
                  found: stats.foundPictos.toString(),
                  total: stats.totalPictos.toString(),
                })}
              </span>
              <span className="stat-item total">
                {t('bossList.feetCollected', {
                  found: stats.foundFeet.toString(),
                  total: stats.totalFeet.toString(),
                })}
              </span>
            </div>
            {onAddBoss && (
              <button onClick={onAddBoss} className="add-boss-btn">
                {t('bossList.addBossManually')}
              </button>
            )}
          </div>

          <div className="current-location-banner">
            <span className="current-location-label">
              {t('bossList.currentZoneLabel')}
            </span>
            <span className="current-location-value">{currentLocationLabel}</span>
          </div>

          <input
            type="text"
            className="search-input"
            placeholder={t('bossList.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="filters">
            <button
              className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => onFilterModeChange('all')}
            >
              {t('bossList.filterAll')}
            </button>
            <button
              className={`filter-btn ${filterMode === 'found' ? 'active' : ''}`}
              onClick={() => onFilterModeChange('found')}
            >
              {t('bossList.filterFound', {
                bosses: stats.killedBosses.toString(),
                pictos: stats.foundPictos.toString(),
                feet: stats.foundFeet.toString(),
              })}
            </button>
            <button
              className={`filter-btn ${filterMode === 'remaining' ? 'active' : ''}`}
              onClick={() => onFilterModeChange('remaining')}
            >
              {t('bossList.filterRemaining', {
                bosses: stats.remainingBosses.toString(),
                pictos: stats.remainingPictos.toString(),
                feet: stats.remainingFeet.toString(),
              })}
            </button>
            <button
              className={`filter-btn ${filterMode === 'current_zone' ? 'active' : ''}`}
              onClick={() => onFilterModeChange('current_zone')}
            >
              {t('bossList.filterCurrentZone', {
                bosses: stats.currentZoneRemainingBosses.toString(),
                pictos: stats.currentZoneRemainingPictos.toString(),
                feet: stats.currentZoneRemainingFeet.toString(),
              })}
            </button>
            <button
              className="filter-btn filter-btn-icon"
              onClick={toggleAllZones}
              title={
                collapsedZones.size === filteredZoneGroups.length
                  ? t('bossList.expandAll')
                  : t('bossList.collapseAll')
              }
            >
              {collapsedZones.size === filteredZoneGroups.length ? EXPAND_ALL_ICON : COLLAPSE_ALL_ICON}
            </button>
          </div>

          <div className="boss-items">
            {renderedZoneGroups.length === 0 ? (
              <div className="empty">
                <p>{t('bossList.noResults')}</p>
              </div>
            ) : (
              renderedZoneGroups.map((zone) => {
                const isCollapsed = collapsedZones.has(zone.zoneName)
                const unmatchedNames = [
                  ...new Set(zone.unmatchedEntries.map((entry) => entry.rawName)),
                ]
                return (
                  <div key={zone.zoneName} className="zone-group">
                    <div
                      className={`zone-header ${unmatchedNames.length > 0 ? 'zone-header-unmapped' : ''}`}
                      onClick={() => toggleZone(zone.zoneName)}
                    >
                      <span className="zone-toggle">
                        {isCollapsed ? ZONE_COLLAPSED_ICON : ZONE_EXPANDED_ICON}
                      </span>
                      <span className="zone-name">
                        {translateZone(zone.zoneName)}
                        {formatZoneLevelLabel(
                          zone.recommendedMinLevel,
                          zone.recommendedMaxLevel,
                        )}
                      </span>
                      {unmatchedNames.length > 0 && (
                        <span className="zone-badge">{t('bossList.unmappedLocationBadge')}</span>
                      )}
                      <span className="zone-stats">
                        B {zone.killed}/{zone.totalBosses} | P {zone.foundPictos}/{zone.totalPictos} | F {zone.foundFeet}/{zone.totalFeet}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className="zone-items">
                        {unmatchedNames.length > 0 && (
                          <div className="zone-audit">
                            <span className="zone-audit-label">
                              {t('bossList.unmappedLocationLabel')}
                            </span>
                            <span className="zone-audit-value">
                              {unmatchedNames.join(', ')}
                            </span>
                          </div>
                        )}
                        {zone.visibleBosses.map((boss) => (
                          <BossRow
                            key={`${zone.zoneName}-${boss.originalName ?? boss.name}`}
                            boss={boss}
                            allowManualEdit={allowManualEdit}
                            onToggleBoss={onToggleBoss}
                            translateBossName={translateBossName}
                            t={t}
                          />
                        ))}
                        {zone.visiblePictos.map((picto) => (
                          <PictoRow key={`${zone.zoneName}-${picto.id}`} picto={picto} t={t} />
                        ))}
                        {zone.visibleMonocoFeet.map((foot) => (
                          <MonocoFootRow key={`${zone.zoneName}-${foot.id}`} foot={foot} t={t} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default BossChecklist
