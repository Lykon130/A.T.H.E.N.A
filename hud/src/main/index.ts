import { join } from 'path'
import { app, BrowserWindow, ipcMain } from 'electron'
import { getVaultSnapshot } from './vaultClient'
import { startVoiceBridge } from './voiceBridge'

const POLL_INTERVAL_MS = 30_000

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    show: false,
    backgroundColor: '#05070a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => window.show())

  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

async function pushSnapshot(window: BrowserWindow): Promise<void> {
  const snapshot = await getVaultSnapshot()
  if (!window.isDestroyed()) {
    window.webContents.send('vault:update', snapshot)
  }
}

app.whenReady().then(() => {
  const window = createWindow()

  window.webContents.once('did-finish-load', () => {
    void pushSnapshot(window)
  })

  const interval = setInterval(() => void pushSnapshot(window), POLL_INTERVAL_MS)
  const stopVoiceBridge = startVoiceBridge(window)
  window.on('closed', () => {
    clearInterval(interval)
    stopVoiceBridge()
  })

  ipcMain.on('vault:refresh', () => void pushSnapshot(window))

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
