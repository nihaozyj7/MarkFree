import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, resolve, extname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs'

import { execFile } from 'child_process'
import { DARK_THEME, LIGHT_THEME } from './themes/defaults.js'

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
    title: 'MarkdownPad',
    frame: false,
    show: false,
    backgroundColor: '#1a1a2e',
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

// ===== 主题管理 =====

function getThemesDir() {
  return join(app.getPath('userData'), 'themes')
}

function ensureThemesDir() {
  const dir = getThemesDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function writeDefaultThemes() {
  const dir = ensureThemesDir()
  const darkPath = join(dir, 'dark.css')
  const lightPath = join(dir, 'light.css')
  if (!existsSync(darkPath)) {
    writeFileSync(darkPath, DARK_THEME, 'utf-8')
  }
  if (!existsSync(lightPath)) {
    writeFileSync(lightPath, LIGHT_THEME, 'utf-8')
  }
}

ipcMain.handle('theme:list', async () => {
  const themes = [
    { name: 'dark', label: '深色主题', builtin: true },
    { name: 'light', label: '浅色主题', builtin: true }
  ]
  const dir = getThemesDir()
  if (existsSync(dir)) {
    const files = readdirSync(dir)
    for (const file of files) {
      if (file.endsWith('.css')) {
        const name = file.slice(0, -4)
        if (!themes.some(t => t.name === name)) {
          themes.push({ name, label: name, builtin: false })
        }
      }
    }
  }
  return themes
})

ipcMain.handle('theme:load', async (_event, name) => {
  const dir = getThemesDir()
  const filePath = join(dir, `${name}.css`)
  if (existsSync(filePath)) {
    try {
      const css = readFileSync(filePath, 'utf-8')
      return { name, css }
    } catch (_) {}
  }
  if (name === 'light') return { name, css: LIGHT_THEME }
  return { name, css: DARK_THEME }
})

ipcMain.handle('theme:openFolder', async () => {
  const dir = ensureThemesDir()
  shell.openPath(dir)
})

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

ipcMain.handle('dialog:openMultipleFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths.map(filePath => {
    const content = readFileSync(filePath, 'utf-8')
    return { content, filePath, fileName: filePath.split(/[/\\]/).pop() }
  })
})

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const folderPath = result.filePaths[0]
  const entries = readdirSync(folderPath)
  const files = entries.filter(f => /\.md$|\.markdown$/i.test(f))
  return files.map(file => {
    const filePath = join(folderPath, file)
    const content = readFileSync(filePath, 'utf-8')
    return { content, filePath, fileName: file }
  })
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

const MIME_MAP = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.bmp': 'image/bmp', '.ico': 'image/x-icon'
}

ipcMain.handle('dialog:selectImageFile', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    const filePath = result.filePaths[0]
    const data = readFileSync(filePath)
    const ext = extname(filePath).toLowerCase()
    return { filePath, base64: data.toString('base64'), ext, mime: MIME_MAP[ext] || 'image/png' }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('image:saveToDisk', async (_event, { base64Data, ext, folderPath, fileDir }) => {
  try {
    let targetDir
    if (folderPath.startsWith('./') || folderPath.startsWith('.\\')) {
      targetDir = resolve(fileDir, folderPath)
    } else if (folderPath.startsWith('/') || /^[a-zA-Z]:\\/.test(folderPath)) {
      targetDir = folderPath
    } else {
      targetDir = resolve(fileDir, folderPath)
    }

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const ts = Date.now().toString().slice(-8)
    const rand = String(Math.floor(1000 + Math.random() * 9000))
    const filename = ts + rand + ext

    const absolutePath = join(targetDir, filename)
    writeFileSync(absolutePath, Buffer.from(base64Data, 'base64'))

    const normalizedFolder = folderPath.replace(/^\.\//, '').replace(/\\/g, '/')
    const relativePath = `./${normalizedFolder}/${filename}`

    return { absolutePath, relativePath }
  } catch (err) {
    return { error: err.message }
  }
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

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('folder:listMdFiles', async (_event, folderPath) => {
  try {
    const entries = readdirSync(folderPath)
    const files = entries
      .filter(f => /\.md$|\.markdown$/i.test(f))
      .map(f => ({
        name: f,
        filePath: join(folderPath, f)
      }))
    return files
  } catch (err) {
    return []
  }
})

ipcMain.handle('file:registerAssociation', async () => {
  if (process.platform !== 'win32') {
    return { success: false, message: '仅支持 Windows 系统' }
  }
  const exePath = app.getPath('exe')
  return new Promise(resolve => {
    execFile('reg', ['add', 'HKCU\\Software\\Classes\\.md', '/ve', '/d', 'MarkdownPad.md', '/f'], () => {
      execFile('reg', ['add', 'HKCU\\Software\\Classes\\MarkdownPad.md', '/ve', '/d', 'Markdown File', '/f'], () => {
        execFile('reg', ['add', 'HKCU\\Software\\Classes\\MarkdownPad.md\\shell\\open\\command', '/ve', '/d', `"${exePath}" "%1"`, '/f'], (err) => {
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
    execFile('reg', ['delete', 'HKCU\\Software\\Classes\\MarkdownPad.md', '/f'], (err) => {
      resolve({ success: !err, message: err ? err.message : '已取消 .md 文件关联' })
    })
  })
})

ipcMain.handle('file:getAssociationStatus', async () => {
  if (process.platform !== 'win32') return { registered: false }
  return new Promise(resolve => {
    execFile('reg', ['query', 'HKCU\\Software\\Classes\\.md', '/ve'], (err, stdout) => {
      if (err) return resolve({ registered: false })
      resolve({ registered: stdout.includes('MarkdownPad.md') })
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

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  writeDefaultThemes()
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
