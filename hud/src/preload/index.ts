import { contextBridge, ipcRenderer } from 'electron'
import type { AthenaBridge, VaultSnapshot, VoiceActivity } from '../shared/types'

const bridge: AthenaBridge = {
  onVaultUpdate(callback) {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: VaultSnapshot): void =>
      callback(snapshot)
    ipcRenderer.on('vault:update', listener)
    return () => ipcRenderer.removeListener('vault:update', listener)
  },
  refresh() {
    ipcRenderer.send('vault:refresh')
  },
  onVoiceActivity(callback) {
    const listener = (_event: Electron.IpcRendererEvent, activity: VoiceActivity): void =>
      callback(activity)
    ipcRenderer.on('voice:activity', listener)
    return () => ipcRenderer.removeListener('voice:activity', listener)
  }
}

contextBridge.exposeInMainWorld('athena', bridge)
