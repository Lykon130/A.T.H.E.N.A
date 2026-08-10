import { contextBridge, ipcRenderer } from 'electron'
import type { AthenaBridge, VaultSnapshot } from '../shared/types'

const bridge: AthenaBridge = {
  onVaultUpdate(callback) {
    const listener = (_event: Electron.IpcRendererEvent, snapshot: VaultSnapshot): void =>
      callback(snapshot)
    ipcRenderer.on('vault:update', listener)
    return () => ipcRenderer.removeListener('vault:update', listener)
  },
  refresh() {
    ipcRenderer.send('vault:refresh')
  }
}

contextBridge.exposeInMainWorld('athena', bridge)
