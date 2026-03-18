import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '../i18n'
import type { Boss } from '../types/Boss'
import type { CurrentLocation } from '../types/CurrentLocation'
import type { Picto } from '../types/Picto'
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
  currentLocation?: CurrentLocation | null
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
        {boss.killed ? '☑' : boss.encountered ? '☐' : '⬜'}
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
            🔧
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

function BossChecklist({
  bosses,
  pictos,
  currentLocation: _currentLocation,
  onAddBoss,
  onToggleBoss,
  allowManualEdit = false,
}: Props) {
  const { t, translateZone, translateBossName } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<ChecklistFilterMode>('all')
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set())

  const checklistModel = useMemo(
    () => buildChecklistModel(bosses, pictos),
    [bosses, pictos],
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
    if (collapsedZones.size === filteredZoneGroups.length) {
      setCollapsedZones(new Set())
      return
    }

    setCollapsedZones(new Set(filteredZoneGroups.map((zone) => zone.zoneName)))
  }

  return (
    <div className="boss-list">
      {bosses.length === 0 && pictos.length === 0 ? (
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
            </div>
            {onAddBoss && (
              <button onClick={onAddBoss} className="add-boss-btn">
                {t('bossList.addBossManually')}
              </button>
            )}
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
              onClick={() => setFilterMode('all')}
            >
              {t('bossList.filterAll')}
            </button>
            <button
              className={`filter-btn ${filterMode === 'found' ? 'active' : ''}`}
              onClick={() => setFilterMode('found')}
            >
              {t('bossList.filterFound', {
                bosses: stats.killedBosses.toString(),
                pictos: stats.foundPictos.toString(),
              })}
            </button>
            <button
              className={`filter-btn ${filterMode === 'remaining' ? 'active' : ''}`}
              onClick={() => setFilterMode('remaining')}
            >
              {t('bossList.filterRemaining', {
                bosses: stats.remainingBosses.toString(),
                pictos: stats.remainingPictos.toString(),
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
              {collapsedZones.size === filteredZoneGroups.length ? '📂' : '📁'}
            </button>
          </div>

          <div className="boss-items">
            {filteredZoneGroups.length === 0 ? (
              <div className="empty">
                <p>{t('bossList.noResults')}</p>
              </div>
            ) : (
              filteredZoneGroups.map((zone) => {
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
                        {isCollapsed ? '▶' : '▼'}
                      </span>
                      <span className="zone-name">
                        {translateZone(zone.zoneName)}
                      </span>
                      {unmatchedNames.length > 0 && (
                        <span className="zone-badge">{t('bossList.unmappedLocationBadge')}</span>
                      )}
                      <span className="zone-stats">
                        B {zone.killed}/{zone.totalBosses} | P {zone.foundPictos}/{zone.totalPictos}
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
