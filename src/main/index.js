import { app, shell, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import { join, resolve, extname, basename, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync, unlinkSync, rmdirSync } from 'fs'
import { readdir, stat as statAsync, readFile } from 'fs/promises'

import { execFile } from 'child_process'
import { THEMES, DARK_THEME } from './themes/defaults.js'

let mainWindow

function getSettingsPath() {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings() {
  try {
    const p = getSettingsPath()
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8'))
    }
  } catch { }
  return {}
}

function saveSettingsFile(settings) {
  try {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  } catch { }
}

const appSettings = loadSettings()
const HW_ACCEL_MODE = appSettings.hardwareAcceleration || 'auto'

if (HW_ACCEL_MODE === 'never') {
  app.disableHardwareAcceleration()
}

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

function openFolderAndSend(folderPath) {
  if (mainWindow) {
    mainWindow.webContents.send('folder:opened', { folderPath })
  }
}

function ensureWindowVisible(bounds) {
  const displays = screen.getAllDisplays()
  const onScreen = displays.some(display => {
    const { x, y, width, height } = display.bounds
    return (
      bounds.x < x + width &&
      bounds.x + bounds.width > x &&
      bounds.y < y + height &&
      bounds.y + bounds.height > y
    )
  })
  if (onScreen) return bounds
  const primary = screen.getPrimaryDisplay().workArea
  return {
    x: Math.max(0, Math.round((primary.width - bounds.width) / 2)),
    y: Math.max(0, Math.round((primary.height - bounds.height) / 2)),
    width: bounds.width,
    height: bounds.height
  }
}

function createWindow() {
  const windowMode = appSettings.windowMode || 'center'
  const defaultBounds = { width: 1200, height: 800 }
  let windowOptions = {
    minWidth: 580,
    minHeight: 400,
    title: 'MarkFree',
    frame: false,
    show: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  }

  if (windowMode === 'center') {
    windowOptions.width = defaultBounds.width
    windowOptions.height = defaultBounds.height
  } else if (windowMode === 'auto') {
    const lastBounds = appSettings.lastWindowBounds
    if (lastBounds && lastBounds.width && lastBounds.height) {
      const visible = ensureWindowVisible(lastBounds)
      windowOptions.x = visible.x
      windowOptions.y = visible.y
      windowOptions.width = visible.width
      windowOptions.height = visible.height
    } else {
      windowOptions.width = defaultBounds.width
      windowOptions.height = defaultBounds.height
    }
  } else if (windowMode === 'fixed') {
    const bounds = appSettings.windowBounds
    if (bounds && bounds.width && bounds.height) {
      windowOptions.x = bounds.x ?? undefined
      windowOptions.y = bounds.y ?? undefined
      windowOptions.width = bounds.width
      windowOptions.height = bounds.height
    } else {
      windowOptions.width = defaultBounds.width
      windowOptions.height = defaultBounds.height
    }
  }

  mainWindow = new BrowserWindow(windowOptions)

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

  mainWindow.on('close', () => {
    const currentSettings = loadSettings()
    if (currentSettings.windowMode === 'auto') {
      const bounds = mainWindow.getBounds()
      currentSettings.lastWindowBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      }
      saveSettingsFile(currentSettings)
    }
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
  for (const theme of THEMES) {
    const filePath = join(dir, `${theme.name}.css`)
    if (!existsSync(filePath)) {
      writeFileSync(filePath, theme.css, 'utf-8')
    }
  }
}

ipcMain.handle('theme:list', async () => {
  const themes = THEMES.map(t => ({ name: t.name, label: t.label, builtin: t.builtin }))
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
    } catch (_) { }
  }
  const builtin = THEMES.find(t => t.name === name)
  if (builtin) return { name, css: builtin.css }
  return { name, css: DARK_THEME }
})

ipcMain.handle('theme:openFolder', async () => {
  const dir = ensureThemesDir()
  shell.openPath(dir)
})

ipcMain.handle('settings:get', async () => loadSettings())

ipcMain.handle('settings:save', async (_event, settings) => {
  const current = loadSettings()
  const merged = { ...current, ...settings }
  saveSettingsFile(merged)
  return merged
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
  return result.filePaths[0]
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

async function buildDirectoryChildren(dirPath) {
  let entries
  try {
    entries = await readdir(dirPath, { withFileTypes: true })
  } catch {
    return null
  }
  const children = []
  const MAX_WORD_COUNT_SIZE = 5 * 1024 * 1024
  const filePromises = []

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      children.push({
        name: entry.name,
        path: fullPath,
        type: 'directory',
        children: null
      })
    } else if (entry.isFile() && /\.md$|\.markdown$/i.test(entry.name)) {
      filePromises.push((async () => {
        let birthtime = 0, mtime = 0, wordCount = 0
        try {
          const stat = await statAsync(fullPath)
          birthtime = stat.birthtimeMs
          mtime = stat.mtimeMs
          if (stat.size > 0 && stat.size <= MAX_WORD_COUNT_SIZE) {
            const content = await readFile(fullPath, 'utf-8')
            wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
          }
        } catch {}
        return {
          name: entry.name,
          path: fullPath,
          type: 'file',
          birthtime,
          mtime,
          wordCount
        }
      })())
    }
  }
  const fileResults = await Promise.all(filePromises)
  children.push(...fileResults)
  if (children.length === 0) return null
  children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return {
    name: basename(dirPath),
    path: dirPath,
    type: 'directory',
    children
  }
}

ipcMain.handle('folder:getTree', async (_event, folderPath) => {
  try {
    return await buildDirectoryChildren(folderPath)
  } catch {
    return null
  }
})

ipcMain.handle('folder:getChildren', async (_event, dirPath) => {
  try {
    return await buildDirectoryChildren(dirPath)
  } catch {
    return null
  }
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

ipcMain.handle('folder:createFile', async (_event, dirPath) => {
  try {
    let name = '新建文件.md'
    let counter = 1
    while (existsSync(join(dirPath, name))) {
      counter++
      name = `新建文件 ${counter}.md`
    }
    const filePath = join(dirPath, name)
    writeFileSync(filePath, '', 'utf-8')
    return { success: true, path: filePath, name }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('folder:createFolder', async (_event, dirPath) => {
  try {
    let name = '新建文件夹'
    let counter = 1
    while (existsSync(join(dirPath, name))) {
      counter++
      name = `新建文件夹 ${counter}`
    }
    const folderPath = join(dirPath, name)
    mkdirSync(folderPath, { recursive: true })
    return { success: true, path: folderPath, name }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('folder:deleteEntry', async (_event, entryPath) => {
  try {
    const stat = statSync(entryPath)
    if (stat.isDirectory()) {
      const contents = readdirSync(entryPath)
      if (contents.length > 0) {
        return { success: false, error: '文件夹不为空，无法删除' }
      }
      rmdirSync(entryPath)
    } else {
      unlinkSync(entryPath)
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('folder:renameEntry', async (_event, { oldPath, newName }) => {
  try {
    const dir = dirname(oldPath)
    const newPath = join(dir, newName)
    renameSync(oldPath, newPath)
    return { success: true, path: newPath }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('file:registerAssociation', async () => {
  if (process.platform !== 'win32') {
    return { success: false, message: '仅支持 Windows 系统' }
  }
  const exePath = app.getPath('exe')
  const safeExePath = JSON.stringify(exePath)
  return new Promise(resolve => {
    execFile('reg', ['add', 'HKCU\\Software\\Classes\\.md', '/ve', '/d', 'MarkFree.md', '/f'], () => {
      execFile('reg', ['add', 'HKCU\\Software\\Classes\\MarkFree.md', '/ve', '/d', 'Markdown File', '/f'], () => {
        execFile('reg', ['add', 'HKCU\\Software\\Classes\\MarkFree.md\\shell\\open\\command', '/ve', '/d', `${safeExePath} "%1"`, '/f'], (err) => {
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
    execFile('reg', ['delete', 'HKCU\\Software\\Classes\\MarkFree.md', '/f'], (err) => {
      resolve({ success: !err, message: err ? err.message : '已取消 .md 文件关联' })
    })
  })
})

ipcMain.handle('file:getAssociationStatus', async () => {
  if (process.platform !== 'win32') return { registered: false }
  return new Promise(resolve => {
    execFile('reg', ['query', 'HKCU\\Software\\Classes\\.md', '/ve'], (err, stdout) => {
      if (err) return resolve({ registered: false })
      resolve({ registered: stdout.includes('MarkFree.md') })
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
  writeDefaultThemes()
  createWindow()

  const initialFile = process.argv.find(a => /\.md$|\.markdown$/i.test(a) && a !== process.execPath)
  if (initialFile) {
    mainWindow.webContents.once('did-finish-load', () => {
      openFileAndSend(initialFile)
    })
  } else {
    const defaultPath = loadSettings().defaultOpenPath
    if (defaultPath) {
      mainWindow.webContents.once('did-finish-load', () => {
        try {
          if (existsSync(defaultPath)) {
            const s = statSync(defaultPath)
            if (s.isDirectory()) {
              openFolderAndSend(defaultPath)
            } else if (/\.md$|\.markdown$/i.test(defaultPath)) {
              openFileAndSend(defaultPath)
            }
          }
        } catch { }
      })
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
