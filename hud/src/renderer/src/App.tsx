import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { VaultSnapshot, VoiceActivity } from '../../shared/types'
import OverviewOrbit from './components/OverviewOrbit'
import DepartmentDetail from './components/DepartmentDetail'
import NeuralIdle from './components/NeuralIdle'
import CommandBar from './components/CommandBar'
import type { Action } from './lib/commands'
import { syntheticAmplitude } from './lib/syntheticVoice'

const FLASH_TO_NAV_DELAY_MS = 550
const SPEAK_TEST_DURATION_MS = 5000

type Flash = { departmentId: string; start: number } | null

const IDLE_VOICE: VoiceActivity = { speaking: false, amplitude: 0 }

export default function App(): JSX.Element {
  const [snapshot, setSnapshot] = useState<VaultSnapshot | null>(null)
  const [showOrbit, setShowOrbit] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const [voice, setVoice] = useState<VoiceActivity>(IDLE_VOICE)

  const navTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const speakTestRafRef = useRef<number>()
  const speakTestStartRef = useRef(0)

  useEffect(() => {
    const unsubscribe = window.athena.onVaultUpdate(setSnapshot)
    return unsubscribe
  }, [])

  useEffect(() => {
    // Live voice activity from voice/ (real TTS playback amplitude), relayed
    // through the main process's WebSocket bridge. Overrides speak-test.
    const unsubscribe = window.athena.onVoiceActivity(setVoice)
    return unsubscribe
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(navTimeoutRef.current)
      cancelAnimationFrame(speakTestRafRef.current ?? 0)
    }
  }, [])

  const runAction = useCallback(
    (action: Action) => {
      if (action.type === 'show-departments') {
        clearTimeout(navTimeoutRef.current)
        setShowOrbit(true)
        setSelectedId(null)
      } else if (action.type === 'show-department') {
        const onIdle = !showOrbit && !selectedId
        clearTimeout(navTimeoutRef.current)
        if (onIdle) {
          setFlash({ departmentId: action.id, start: performance.now() })
          navTimeoutRef.current = setTimeout(() => {
            setShowOrbit(true)
            setSelectedId(action.id)
          }, FLASH_TO_NAV_DELAY_MS)
        } else {
          setShowOrbit(true)
          setSelectedId(action.id)
        }
      } else if (action.type === 'go-idle') {
        clearTimeout(navTimeoutRef.current)
        setShowOrbit(false)
        setSelectedId(null)
      } else if (action.type === 'speak-test') {
        cancelAnimationFrame(speakTestRafRef.current ?? 0)
        speakTestStartRef.current = performance.now()
        const tick = (): void => {
          const elapsedMs = performance.now() - speakTestStartRef.current
          if (elapsedMs >= SPEAK_TEST_DURATION_MS) {
            setVoice(IDLE_VOICE)
            return
          }
          setVoice({ speaking: true, amplitude: syntheticAmplitude(elapsedMs / 1000) })
          speakTestRafRef.current = requestAnimationFrame(tick)
        }
        speakTestRafRef.current = requestAnimationFrame(tick)
      }
      setCommandBarOpen(false)
    },
    [showOrbit, selectedId]
  )

  const stepBack = useCallback(() => {
    if (selectedId) {
      setSelectedId(null)
    } else if (showOrbit) {
      setShowOrbit(false)
    }
  }, [selectedId, showOrbit])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandBarOpen((open) => !open)
      } else if (e.key === 'Escape' && !commandBarOpen) {
        stepBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandBarOpen, stepBack])

  const selectedDepartment = snapshot?.departments.find((d) => d.id === selectedId) ?? null
  const departments = snapshot?.departments ?? []

  return (
    <div className="app">
      <header className="app-bar">
        <span className="app-bar-title">A.T.H.E.N.A</span>
        <div className="app-bar-status">
          {snapshot?.connected ? (
            <span className="status-pill status-live">
              <span className="status-dot" /> LIVE
            </span>
          ) : (
            <span className="status-pill status-offline">
              <span className="status-dot" /> {snapshot ? 'VAULT OFFLINE' : 'CONNECTING…'}
            </span>
          )}
          <button className="app-bar-refresh" onClick={() => window.athena.refresh()}>
            refresh
          </button>
        </div>
      </header>

      {snapshot?.connected === false && (
        <div className="offline-banner">
          Can't reach the Obsidian Local REST API — is Obsidian running with the plugin enabled?
          {snapshot.error ? ` (${snapshot.error})` : ''}
        </div>
      )}

      <main className="app-main">
        <AnimatePresence mode="wait">
          {selectedDepartment ? (
            <DepartmentDetail
              key={selectedDepartment.id}
              department={selectedDepartment}
              onBack={() => setSelectedId(null)}
            />
          ) : showOrbit ? (
            <motion.div
              key="orbit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <OverviewOrbit departments={departments} onSelect={setSelectedId} />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              className="idle-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <NeuralIdle
                departments={departments}
                flash={flash}
                speaking={voice.speaking}
                amplitude={voice.amplitude}
              />
              <div className="idle-hint">ctrl+k to command</div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {commandBarOpen && (
          <CommandBar
            departments={departments}
            onAction={runAction}
            onClose={() => setCommandBarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
