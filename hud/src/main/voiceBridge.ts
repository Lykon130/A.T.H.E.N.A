import type { BrowserWindow } from 'electron'
import { WebSocketServer, type WebSocket } from 'ws'
import type { VoiceActivity } from '../shared/types'

// voice/hud_bridge.py connects here as a client and streams real TTS playback
// amplitude while Athena is speaking. The HUD works fine with nothing
// connected — the idle view just never shows a speaking wave.
const HOST = '127.0.0.1'
const PORT = 8765

function parseActivity(raw: string): VoiceActivity | null {
  try {
    const data = JSON.parse(raw)
    if (typeof data.speaking !== 'boolean') return null
    return { speaking: data.speaking, amplitude: typeof data.amplitude === 'number' ? data.amplitude : 0 }
  } catch {
    return null
  }
}

/** Starts the local voice-activity bridge; returns a function that stops it. */
export function startVoiceBridge(window: BrowserWindow): () => void {
  const send = (activity: VoiceActivity): void => {
    if (!window.isDestroyed()) window.webContents.send('voice:activity', activity)
  }

  const wss = new WebSocketServer({ host: HOST, port: PORT })

  wss.on('connection', (socket: WebSocket) => {
    socket.on('message', (raw) => {
      const activity = parseActivity(raw.toString())
      if (activity) send(activity)
    })
    // The voice process died or disconnected mid-utterance — don't leave the
    // wave lit forever waiting for an idle message that's never coming.
    socket.on('close', () => send({ speaking: false, amplitude: 0 }))
  })

  wss.on('error', (err) => {
    console.error('[voiceBridge] WebSocket server error (voice/ live wiring unavailable):', err)
  })

  return () => wss.close()
}
