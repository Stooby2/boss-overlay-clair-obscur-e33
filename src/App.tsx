import { CSSProperties, useEffect, useMemo, useState } from 'react'

import BossChecklist from './components/BossChecklist'
import { BossInfoForm } from './components/BossInfoForm'
import Settings from './components/Settings'
import { useI18n } from './i18n'
import { Boss } from './types/Boss'
import { Picto } from './types/Picto'
import { SaveSnapshot } from './types/SaveSnapshot'
import {
  DEFAULT_BACKGROUND_OPACITY,
  getOverlayTheme,
  normalizeBackgroundOpacity,
} from './utils/backgroundOpacity'

function App() {
  const { t } = useI18n()
  const [bosses, setBosses] = useState<Boss[]>([])
  const [pictos, setPictos] = useState<Picto[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [savePath, setSavePath] = useState('')
  const [isAddingBoss, setIsAddingBoss] = useState(false)
  const [manualStates, setManualStates] = useState<
    Record<string, { killed: boolean; encountered: boolean }>
  >({})
  const [allowManualEdit, setAllowManualEdit] = useState(false)
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    DEFAULT_BACKGROUND_OPACITY,
  )

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getConfig().then((config) => {
        setAllowManualEdit(config.allowManualEditAutoDetected ?? false)
        setBackgroundOpacity(
          normalizeBackgroundOpacity(config.backgroundOpacity),
        )
      })
    }
  }, [])

  useEffect(() => {
    if (window.electronAPI && savePath) {
      window.electronAPI.getManualStates(savePath).then((states) => {
        setManualStates(states)
      })
    }
  }, [savePath])

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onBossUpdate((snapshot: SaveSnapshot) => {
        const mergedBosses = snapshot.bosses.map((boss) => {
          if (boss.originalName && manualStates[boss.originalName]) {
            return {
              ...boss,
              killed: manualStates[boss.originalName].killed,
              encountered: manualStates[boss.originalName].encountered,
            }
          }
          return boss
        })

        setBosses(mergedBosses)
        setPictos(snapshot.pictos)
      })

      window.electronAPI.onRestoreSavePath((path: string) => {
        setSavePath(path)
        window.electronAPI.startWatch(path)
      })
    }
  }, [manualStates])

  const handleStartWatch = (path: string) => {
    setSavePath(path)
    if (window.electronAPI) {
      window.electronAPI.startWatch(path)
    }

    setShowSettings(false)
  }

  const handleConfigChange = (config: {
    allowManualEditAutoDetected?: boolean
    backgroundOpacity?: number
  }) => {
    if (config.allowManualEditAutoDetected !== undefined) {
      setAllowManualEdit(config.allowManualEditAutoDetected)
    }
    if (config.backgroundOpacity !== undefined) {
      setBackgroundOpacity(normalizeBackgroundOpacity(config.backgroundOpacity))
    }
  }

  const handleSaveBossInfo = async (info: {
    originalName: string
    id: string
    category: string
    zone: string
  }) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveBossInfo(info)
      if (result.success) {
        setIsAddingBoss(false)
      } else {
        alert(
          t('bossForm.saveError', { error: result.error || 'Unknown error' }),
        )
      }
    }
  }

  const handleCancelBossInfo = () => {
    setIsAddingBoss(false)
  }

  const handleAddBoss = () => {
    setIsAddingBoss(true)
  }

  const handleToggleBoss = async (boss: Boss, killed: boolean) => {
    if (!boss.originalName || !savePath) return

    const isManualBoss = boss.originalName.startsWith('MANUAL_')
    if (!isManualBoss && !allowManualEdit) {
      return
    }

    const newState = {
      killed,
      encountered: true,
    }

    if (window.electronAPI) {
      await window.electronAPI.saveManualState(
        savePath,
        boss.originalName,
        newState,
      )
    }

    setManualStates((prev) => ({
      ...prev,
      [boss.originalName!]: newState,
    }))

    setBosses((prevBosses) =>
      prevBosses.map((candidate) =>
        candidate.originalName === boss.originalName
          ? { ...candidate, ...newState }
          : candidate,
      ),
    )
  }

  const overlayTheme = useMemo(
    () => getOverlayTheme(backgroundOpacity),
    [backgroundOpacity],
  )

  const appStyle = useMemo(
    () =>
      ({
        background: overlayTheme.backgroundColor,
        ...overlayTheme.cssVariables,
      }) as CSSProperties,
    [overlayTheme],
  )

  return (
    <div className="app" style={appStyle}>
      {isAddingBoss && (
        <BossInfoForm
          boss={{
            name: '',
            originalName: `MANUAL_${Date.now()}`,
            category: 'Boss',
            zone: '',
          }}
          onSubmit={handleSaveBossInfo}
          onCancel={handleCancelBossInfo}
          isEditMode={false}
        />
      )}

      <div className="title-bar">
        <span>Boss Overlay</span>
        <div className="controls">
          <button onClick={() => setShowSettings(!showSettings)}>⚙️</button>
          <button onClick={() => window.electronAPI?.closeApp()}>✕</button>
        </div>
      </div>

      {showSettings ? (
        <Settings
          onSavePathChange={handleStartWatch}
          currentPath={savePath}
          onConfigChange={handleConfigChange}
        />
      ) : (
        <BossChecklist
          bosses={bosses}
          pictos={pictos}
          onAddBoss={handleAddBoss}
          onToggleBoss={handleToggleBoss}
          allowManualEdit={allowManualEdit}
        />
      )}
    </div>
  )
}

export default App
