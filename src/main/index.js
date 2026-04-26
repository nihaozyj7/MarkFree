import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { execFile } from 'child_process'

let mainWindow

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
    const filePath = argv.find(a => /\.md$|\.markdown$/i.test(a))
    if (filePath) openFileAndSend(filePath)
  })
}

app.on('open-file', (event, filePath) => {
  event.preventDefault()
  openFileAndSend(filePath)
})

function openFileAndSend(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const fileName = filePath.split(/[/\\]/).pop()
    if (mainWindow) {
      mainWindow.webContents.send('file:opened', { content, filePath, fileName })
    }
  } catch (err) {
    dialog.showErrorBox('打开文件错误', `无法打开文件: ${err.message}`)
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Markdown WYSIWYG Editor',
    frame: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault()
      let filePath = decodeURIComponent(url.slice(7))
      if (process.platform === 'win32') {
        filePath = filePath.replace(/^\//, '')
      }
      if (/\.md$|\.markdown$/i.test(filePath)) {
        openFileAndSend(filePath)
      }
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const filePath = result.filePaths[0]
  const content = readFileSync(filePath, 'utf-8')
  return { content, filePath, fileName: filePath.split(/[/\\]/).pop() }
})

ipcMain.handle('dialog:saveFile', async (_event, { content, filePath }) => {
  if (!filePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled) return null
    filePath = result.filePath
  }
  writeFileSync(filePath, content, 'utf-8')
  return { filePath, fileName: filePath.split(/[/\\]/).pop() }
})

ipcMain.handle('dialog:saveAsFile', async (_event, content) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  })
  if (result.canceled) return null
  writeFileSync(result.filePath, content, 'utf-8')
  return { filePath: result.filePath, fileName: result.filePath.split(/[/\\]/).pop() }
})

ipcMain.handle('file:openByPath', async (_event, filePath) => {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const fileName = filePath.split(/[/\\]/).pop()
    return { content, filePath, fileName }
  } catch (err) {
    return null
  }
})

ipcMain.handle('file:registerAssociation', async () => {
  if (process.platform !== 'win32') {
    return { success: false, message: '仅支持 Windows 系统' }
  }
  const exePath = app.getPath('exe')
  return new Promise(resolve => {
    execFile('reg', ['add', 'HKCU\\Software\\Classes\\.md', '/ve', '/d', 'MarkdownWYSIWYG.md', '/f'], () => {
      execFile('reg', ['add', 'HKCU\\Software\\Classes\\MarkdownWYSIWYG.md', '/ve', '/d', 'Markdown File', '/f'], () => {
        execFile('reg', ['add', 'HKCU\\Software\\Classes\\MarkdownWYSIWYG.md\\shell\\open\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f'], (err) => {
          resolve({ success: !err, message: err ? err.message : '.md 文件关联注册成功' })
        })
      })
    })
  })
})

ipcMain.handle('file:unregisterAssociation', async () => {
  if (process.platform !== 'win32') {
    return { success: false, message: '仅支持 Windows 系统' }
  }
  return new Promise(resolve => {
    execFile('reg', ['delete', 'HKCU\\Software\\Classes\\MarkdownWYSIWYG.md', '/f'], (err) => {
      resolve({ success: !err, message: err ? err.message : '已取消 .md 文件关联' })
    })
  })
})

ipcMain.handle('file:getAssociationStatus', async () => {
  if (process.platform !== 'win32') return { registered: false }
  return new Promise(resolve => {
    execFile('reg', ['query', 'HKCU\\Software\\Classes\\.md', '/ve'], (err, stdout) => {
      if (err) return resolve({ registered: false })
      resolve({ registered: stdout.includes('MarkdownWYSIWYG.md') })
    })
  })
})

ipcMain.on('window:setTitle', (_event, title) => {
  if (mainWindow) mainWindow.setTitle(title)
})

ipcMain.on('window:minimize', () => mainWindow?.minimize())

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})

ipcMain.on('window:close', () => mainWindow?.close())

app.whenReady().then(() => {
  createWindow()

  const initialFile = process.argv.find(a => /\.md$|\.markdown$/i.test(a) && a !== process.execPath)
  if (initialFile) {
    mainWindow.webContents.once('did-finish-load', () => {
      openFileAndSend(initialFile)
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
