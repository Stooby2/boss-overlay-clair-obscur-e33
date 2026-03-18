import { useEffect, useMemo, useState } from 'react'

import { useI18n } from '../i18n'
import { Boss } from '../types/Boss'
import { Picto } from '../types/Picto'
import {
  buildChecklistModel,
  reportUnmatchedZoneNames,
} from './checklistModel'

interface Props {
  bosses: Boss[]
  pictos: Picto[]
  onAddBoss?: () => void
  onToggleBoss?: (boss: Boss, killed: boolean) => void
  allowManualEdit?: boolean
}

interface ZoneGroup {
  zoneName: string
  bosses: Boss[]
  killed: number
  encountered: number
  total: number
}

function BossChecklist({
  bosses,
  pictos,
  onAddBoss,
  onToggleBoss,
  allowManualEdit = false,
}: Props) {
  const { t, translateZone, translateBossName } = useI18n()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState<
    'all' | 'alive' | 'killed' | 'encountered'
  >('all')
  const [collapsedZones, setCollapsedZones] = useState<Set<string>>(new Set())

  const checklistModel = useMemo(
    () => buildChecklistModel(bosses, pictos),
    [bosses, pictos],
  )

  useEffect(() => {
    reportUnmatchedZoneNames(checklistModel.unmatchedZoneNames)
  }, [checklistModel.unmatchedZoneNames])

  const zoneGroups = useMemo(() => {
    return checklistModel.zoneGroups
      .filter((zone) => zone.bosses.length > 0)
      .map(
        (zone): ZoneGroup => ({
          zoneName: zone.zoneName,
          bosses: zone.bosses,
          killed: zone.killed,
          encountered: zone.encountered,
          total: zone.totalBosses,
        }),
      )
  }, [checklistModel.zoneGroups])

  const filteredZoneGroups = useMemo(() => {
    return zoneGroups
      .map((zone) => {
        let filtered = zone.bosses

        if (filterMode === 'alive') {
          filtered = filtered.filter((boss) => !boss.killed)
        } else if (filterMode === 'killed') {
          filtered = filtered.filter((boss) => boss.killed)
        } else if (filterMode === 'encountered') {
          filtered = filtered.filter((boss) => boss.encountered)
        }

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase()
          filtered = filtered.filter(
            (boss) =>
              boss.name.toLowerCase().includes(term) ||
              translateBossName(boss.name).toLowerCase().includes(term),
          )
        }

        return {
          ...zone,
          bosses: filtered,
          visibleTotal: filtered.length,
        }
      })
      .filter((zone) => zone.bosses.length > 0)
  }, [zoneGroups, searchTerm, filterMode, translateBossName])

  const stats = useMemo(() => {
    const killed = bosses.filter((b) => b.encountered && b.killed).length
    const total = bosses.length
    return { killed, total }
  }, [bosses])

  const toggleZone = (zoneName: string) => {
    setCollapsedZones((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(zoneName)) {
        newSet.delete(zoneName)
      } else {
        newSet.add(zoneName)
      }
      return newSet
    })
  }

  const toggleAllZones = () => {
    if (collapsedZones.size === zoneGroups.length) {
      setCollapsedZones(new Set())
    } else {
      setCollapsedZones(new Set(zoneGroups.map((z) => z.zoneName)))
    }
  }

  return (
    <div className="boss-list">
      {bosses.length === 0 ? (
        <div className="empty">
          <p>{t('bossList.noData')}</p>
          <p>{t('bossList.configurePathInSettings')}</p>
        </div>
      ) : (
        <>
          <div className="stats">
            <span className="stat-item killed">
              {t('bossList.bossesKilled', {
                killed: stats.killed.toString(),
                total: stats.total.toString(),
              })}
            </span>
            {onAddBoss && (
              <button
                onClick={onAddBoss}
                style={{
                  padding: '6px 12px',
                  background: '#2ecc71',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
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
              {t('bossList.filterAll', {
                count: bosses.filter((b) => b.encountered).length.toString(),
              })}
            </button>
            <button
              className={`filter-btn ${filterMode === 'killed' ? 'active' : ''}`}
              onClick={() => setFilterMode('killed')}
            >
              {t('bossList.filterKilled', {
                count: stats.killed.toString(),
              })}
            </button>
            <button
              className={`filter-btn ${filterMode === 'alive' ? 'active' : ''}`}
              onClick={() => setFilterMode('alive')}
            >
              {t('bossList.filterAlive', {
                count: (stats.total - stats.killed).toString(),
              })}
            </button>
            <button
              className="filter-btn"
              onClick={toggleAllZones}
              title={
                collapsedZones.size === zoneGroups.length
                  ? t('bossList.expandAll')
                  : t('bossList.collapseAll')
              }
            >
              {collapsedZones.size === zoneGroups.length ? '📂' : '📁'}
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
                return (
                  <div key={zone.zoneName} className="zone-group">
                    <div
                      className="zone-header"
                      onClick={() => toggleZone(zone.zoneName)}
                    >
                      <span className="zone-toggle">
                        {isCollapsed ? '▶' : '▼'}
                      </span>
                      <span className="zone-name">
                        {translateZone(zone.zoneName)}
                      </span>
                      <span className="zone-stats">
                        ({zone.killed}/{zone.total})
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className="zone-bosses">
                        {zone.bosses.map((boss, index) => (
                          <div
                            key={`${zone.zoneName}-${index}`}
                            className={`boss-item ${boss.killed ? 'killed' : ''} ${!boss.encountered ? 'not-encountered' : ''}`}
                          >
                            {(() => {
                              const isManualBoss =
                                boss.originalName?.startsWith('MANUAL_')
                              const canToggle = isManualBoss || allowManualEdit
                              const tooltipText = !canToggle
                                ? t('bossList.autoDetected')
                                : boss.killed
                                  ? t('bossList.markAsAlive')
                                  : t('bossList.markAsKilled')

                              return (
                                <span
                                  className="checkbox"
                                  onClick={() =>
                                    canToggle &&
                                    onToggleBoss?.(boss, !boss.killed)
                                  }
                                  style={{
                                    cursor:
                                      canToggle && onToggleBoss
                                        ? 'pointer'
                                        : 'not-allowed',
                                    opacity: canToggle ? 1 : 0.5,
                                  }}
                                  title={tooltipText}
                                >
                                  {boss.killed
                                    ? '☑'
                                    : boss.encountered
                                      ? '☐'
                                      : '⬜'}
                                </span>
                              )
                            })()}
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
