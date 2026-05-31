import { app, shell, BrowserWindow, ipcMain, dialog, screen, protocol, net } from 'electron'
import url from 'url'
import { join, resolve, extname, basename, dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, renameSync, unlinkSync, rmdirSync } from 'fs'
import { readdir, stat as statAsync, readFile } from 'fs/promises'

import { execFile } from 'child_process'
import { THEMES, DARK_THEME } from './themes/defaults.js'
import { buildMessages } from './ai/prompts.js'
import { createProvider, cleanResponse } from './ai/provider.js'
import { encrypt, decrypt } from './encrypt.js'

let mainWindow
let closeConfirmed = false

function getSettingsPath() {
  return join(app.getPath('userData'), 'settings.json')
}

function loadSettings() {
  try {
    const p = getSettingsPath()
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8'))
    }
  } catch (e) { console.error('加载设置文件失败:', e) }
  return {}
}

function saveSettingsFile(settings) {
  try {
    const dir = app.getPath('userData')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8')
  } catch (e) { console.error('保存设置文件失败:', e) }
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

  mainWindow.on('close', (e) => {
    if (!closeConfirmed) {
      e.preventDefault()
      mainWindow.webContents.send('app:beforeClose')
      return
    }
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
    } catch (e) { console.error('加载主题 CSS 失败:', e) }
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

// ===== AI =====

ipcMain.handle('ai:chat', async (_event, { prompt, selectedText }) => {
  try {
    const settings = loadSettings()
    const aiSettings = settings.ai || {}
    aiSettings.apiKey = decrypt(aiSettings.apiKey)
    if (!aiSettings.apiKey) {
      return { error: '请先在设置中配置 API Key' }
    }
    const provider = createProvider(aiSettings)
    const messages = buildMessages({
      prompt,
      selectedText: selectedText || '',
      systemPrompt: aiSettings.systemPrompt
    })
    const result = await provider.chat(messages)
    return { content: cleanResponse(result) }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('ai:testConnection', async () => {
  try {
    const settings = loadSettings()
    const aiSettings = settings.ai || {}
    aiSettings.apiKey = decrypt(aiSettings.apiKey)
    if (!aiSettings.apiKey) {
      return { success: false, message: '请先配置 API Key' }
    }
    const provider = createProvider(aiSettings)
    return await provider.testConnection()
  } catch (err) {
    return { success: false, message: err.message }
  }
})

ipcMain.handle('ai:getSettings', async () => {
  const settings = loadSettings()
  const ai = settings.ai || {}
  return {
    endpoint: ai.endpoint || 'https://api.deepseek.com',
    model: ai.model || 'deepseek-chat',
    temperature: ai.temperature ?? 0.7,
    maxTokens: ai.maxTokens ?? 2048,
    systemPrompt: ai.systemPrompt || '',
    hasKey: !!ai.apiKey
  }
})

ipcMain.handle('ai:saveSettings', async (_event, aiSettings) => {
  const settings = loadSettings()
  if (aiSettings.apiKey) {
    aiSettings.apiKey = encrypt(aiSettings.apiKey)
  } else {
    aiSettings.apiKey = settings.ai?.apiKey || ''
  }
  settings.ai = { ...settings.ai, ...aiSettings }
  saveSettingsFile(settings)
  return { success: true }
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
        } catch (e) { console.error('读取文件状态失败:', e) }
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

const EXECUTABLE_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.msi', '.ps1', '.vbs', '.vbe',
  '.js', '.jse', '.wsf', '.wsh', '.msc', '.cpl', '.hta', '.reg', '.pif'
])

function isExecutablePath(filePath) {
  const ext = extname(filePath).toLowerCase()
  return EXECUTABLE_EXTENSIONS.has(ext)
}

ipcMain.handle('shell:isExecutable', async (_event, filePath) => {
  return isExecutablePath(filePath)
})

ipcMain.handle('shell:openPath', async (_event, filePath) => {
  try {
    const ext = extname(filePath).toLowerCase()
    if (isExecutablePath(filePath)) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['取消', '仍然打开'],
        defaultId: 0,
        cancelId: 0,
        title: '安全警告',
        message: `"${basename(filePath)}" 是可执行文件`,
        detail: '打开可执行文件可能存在安全风险。\n\n确定要继续吗？'
      })
      if (choice === 1) {
        return shell.openPath(filePath)
      }
      return 'cancelled'
    }
    return shell.openPath(filePath)
  } catch (err) {
    return err.message
  }
})

ipcMain.handle('link:open', async (_event, { url, linkOpenMode, baseDir }) => {
  try {

    if (/^https?:\/\//i.test(url)) {
      if (linkOpenMode === 'builtinBrowser') {
        const bw = new BrowserWindow({
          width: 1024,
          height: 768,
          title: url,
          webPreferences: { sandbox: true, contextIsolation: true }
        })
        bw.loadURL(url)
        return 'opened'
      }
      shell.openExternal(url)
      return 'opened'
    }

    if (/^mailto:/i.test(url)) {
      shell.openExternal(url)
      return 'opened'
    }

    let filePath = url
    if (url.startsWith('file://')) {
      filePath = decodeURIComponent(url.slice(7))
      if (process.platform === 'win32') {
        filePath = filePath.replace(/^\//, '')
      }
    }

    if (baseDir) {
      filePath = resolve(baseDir, filePath)
    }

    if (/\.md$|\.markdown$/i.test(filePath)) {
      try {
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8')
          const fileName = filePath.split(/[/\\]/).pop()
          mainWindow.webContents.send('file:opened', { content, filePath, fileName })
          return 'opened'
        }
  } catch (e) { console.error('保存设置失败:', e) }
      return 'not_found'
    }

    const ext = extname(filePath).toLowerCase()
    if (isExecutablePath(filePath)) {
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'warning',
        buttons: ['取消', '仍然打开'],
        defaultId: 0,
        cancelId: 0,
        title: '安全警告',
        message: `"${basename(filePath)}" 是可执行文件`,
        detail: '打开可执行文件可能存在安全风险。\n\n确定要继续吗？'
      })
      if (choice === 1) {
        shell.openPath(filePath)
        return 'opened'
      }
      return 'cancelled'
    }

    shell.openPath(filePath)
    return 'opened'
  } catch (err) {
    return err.message
  }
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

ipcMain.handle('help:open', () => {
  const helpHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>MarkFree 帮助</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; color: #e0e0e0; background: #1e1e2e; line-height: 1.7; padding: 0; }
  .container { max-width: 800px; margin: 0 auto; padding: 40px 32px; }
  h1 { font-size: 26px; color: #89b4fa; margin-bottom: 8px; }
  .version { font-size: 13px; color: #888; margin-bottom: 32px; }
  h2 { font-size: 18px; color: #89b4fa; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #333; }
  h3 { font-size: 15px; color: #cba6f7; margin: 20px 0 8px; }
  p { font-size: 14px; color: #cdd6f4; margin: 8px 0; }
  ul { padding-left: 20px; margin: 8px 0; }
  li { font-size: 14px; color: #cdd6f4; margin: 4px 0; }
  .shortcut-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .shortcut-table th, .shortcut-table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #333; font-size: 14px; }
  .shortcut-table th { color: #89b4fa; font-weight: 600; }
  kbd { background: #313244; border: 1px solid #45475a; border-radius: 4px; padding: 2px 8px; font-size: 13px; font-family: inherit; color: #cdd6f4; }
  code { background: #313244; border: 1px solid #45475a; border-radius: 3px; padding: 1px 6px; font-size: 13px; font-family: 'Consolas', 'Courier New', monospace; color: #a6e3a1; }
  .section { margin: 24px 0; }
  .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0; }
  .feature-card { background: #313244; border-radius: 8px; padding: 16px; }
  .feature-card h4 { font-size: 14px; color: #89b4fa; margin-bottom: 4px; }
  .feature-card p { font-size: 13px; color: #a6adc8; margin: 0; }
  .note { background: #313244; border-left: 3px solid #f9e2af; padding: 12px 16px; border-radius: 4px; margin: 12px 0; }
  .note p { color: #cdd6f4; font-size: 13px; margin: 0; }
</style>
</head>
<body>
<div class="container">
  <h1>MarkFree 帮助文档</h1>
  <p class="version">版本 1.5.0</p>

  <div class="section">
    <h2>关于 MarkFree</h2>
    <p>MarkFree 是一款基于 Electron、React 和 TipTap 构建的所见即所得 Markdown 编辑器。编辑器使用 Markdown 语法和可视化工具栏/右键菜单进行格式化，实时渲染为富文本，同时支持源码模式直接编辑 Markdown 原始文本。</p>
  </div>

  <div class="section">
    <h2>核心功能</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Markdown + 所见即所得</h4>
        <p>输入 Markdown 语法自动渲染为富文本，也可通过工具栏按钮和右键菜单设置格式，无需记忆快捷键。</p>
      </div>
      <div class="feature-card">
        <h4>源码模式</h4>
        <p>点击状态栏 <kbd>&lt;/&gt;</kbd> 按钮切换到 Markdown 源码编辑模式，直接编辑原始 Markdown 文本。</p>
      </div>
      <div class="feature-card">
        <h4>AI 助手</h4>
        <p>按 <kbd>Ctrl+K</kbd> 呼出 AI 命令面板，可选中文字后让 AI 续写、改写、翻译等，或直接输入指令生成内容。</p>
      </div>
      <div class="feature-card">
        <h4>多标签页</h4>
        <p>支持同时打开多个文件，在标签页之间自由切换，鼠标中键点击可关闭标签页。</p>
      </div>
      <div class="feature-card">
        <h4>语法高亮</h4>
        <p>代码块支持 11+ 种语言的语法高亮，包括 JavaScript、Python、C++、Go、Rust 等。</p>
      </div>
      <div class="feature-card">
        <h4>图片管理</h4>
        <p>支持 Base64 内嵌、相对路径和绝对路径三种图片插入方式，拖拽粘贴均可插入图片。</p>
      </div>
      <div class="feature-card">
        <h4>链接与锚点</h4>
        <p><kbd>Ctrl+点击</kbd> 打开网页链接或 .md 文件；<code>#锚点</code> 链接可跳转到文档内标题。</p>
      </div>
      <div class="feature-card">
        <h4>文件树</h4>
        <p>侧边栏打开文件夹后，可浏览文件树、创建/重命名/删除文件和文件夹，支持排序。</p>
      </div>
      <div class="feature-card">
        <h4>主题系统</h4>
        <p>内置深色和浅色主题，并支持自定义 CSS 主题，可在设置中打开主题文件夹编辑。</p>
      </div>
      <div class="feature-card">
        <h4>导出 HTML</h4>
        <p>将当前文档导出为独立 HTML 文件，包含内联样式，可直接在浏览器中查看。</p>
      </div>
      <div class="feature-card">
        <h4>Markdown 复制/粘贴</h4>
        <p>菜单栏「Markdown」→ 复制 MD / 粘贴 MD，可在 Markdown 源码与富文本之间转换。</p>
      </div>
      <div class="feature-card">
        <h4>文件关联</h4>
        <p>可将 .md 文件设为默认使用 MarkFree 打开（Windows），在设置中一键注册或取消。</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>编辑方式</h2>
    <div class="note">
      <p><strong>提示：</strong>编辑器已屏蔽了 <kbd>Ctrl+B</kbd>（加粗）、<kbd>Ctrl+I</kbd>（斜体）、<kbd>Ctrl+E</kbd>（代码）等富文本快捷键，这些按键被分配给了应用级操作（如 <kbd>Ctrl+B</kbd> 切换侧边栏）。格式化请使用以下方式：</p>
    </div>

    <h3>方式一：Markdown 语法</h3>
    <p>直接在编辑器中输入 Markdown 语法，会自动渲染为对应格式：</p>
    <table class="shortcut-table">
      <thead><tr><th>语法</th><th>效果</th></tr></thead>
      <tbody>
        <tr><td><code># 标题</code> ~ <code>###### 标题</code></td><td>一级 ~ 六级标题</td></tr>
        <tr><td><code>**粗体**</code></td><td>粗体</td></tr>
        <tr><td><code>*斜体*</code></td><td>斜体</td></tr>
        <tr><td><code>~~删除线~~</code></td><td>删除线</td></tr>
        <tr><td><code>\`行内代码\`</code></td><td>行内代码</td></tr>
        <tr><td><code>!!! 下划线 !!!</code></td><td>下划线</td></tr>
        <tr><td><code>&gt; 引用内容</code></td><td>引用块</td></tr>
        <tr><td><code>- 项目</code></td><td>无序列表</td></tr>
        <tr><td><code>1. 项目</code></td><td>有序列表</td></tr>
        <tr><td><code>- [ ] 待办</code> / <code>- [x] 已完成</code></td><td>任务列表</td></tr>
        <tr><td><code>\`\`\`语言</code></td><td>代码块</td></tr>
        <tr><td><code>[链接](URL)</code></td><td>超链接</td></tr>
        <tr><td><code>![图片](URL)</code></td><td>图片</td></tr>
        <tr><td><code>---</code></td><td>水平分隔线</td></tr>
      </tbody>
    </table>

    <h3>方式二：工具栏</h3>
    <p>编辑区上方工具栏提供以下按钮：</p>
    <ul>
      <li><strong>格式：</strong> B（粗体）、I（斜体）、U（下划线）、S（删除线）、&lt;&gt;（行内代码）</li>
      <li><strong>标题：</strong> H1、H2、H3</li>
      <li><strong>列表：</strong> 无序列表、有序列表、任务列表</li>
      <li><strong>块元素：</strong> 引用、代码块、分隔线</li>
      <li><strong>表格：</strong> 插入表格、添加行/列</li>
      <li><strong>其他：</strong> 插入链接、插入图片</li>
    </ul>

    <h3>方式三：右键菜单</h3>
    <p>在编辑区右键可打开格式化菜单，包含：</p>
    <ul>
      <li><strong>格式：</strong> 加粗、斜体、下划线、删除线、行内代码</li>
      <li><strong>标题：</strong> 标题 1 ~ 6</li>
      <li><strong>列表：</strong> 无序列表、有序列表、任务列表</li>
      <li><strong>块元素：</strong> 引用、代码块、分隔线</li>
      <li><strong>编辑：</strong> 剪切、复制、粘贴、全选</li>
      <li><strong>表格：</strong> 插入表格、上/下插行、左/右插列、删行、删列、删表、合并、拆分</li>
    </ul>
  </div>

  <div class="section">
    <h2>全局快捷键</h2>
    <table class="shortcut-table">
      <thead><tr><th>操作</th><th>快捷键</th></tr></thead>
      <tbody>
        <tr><td>新建文件</td><td><kbd>Ctrl+N</kbd></td></tr>
        <tr><td>打开文件</td><td><kbd>Ctrl+O</kbd></td></tr>
        <tr><td>保存</td><td><kbd>Ctrl+S</kbd></td></tr>
        <tr><td>另存为</td><td><kbd>Ctrl+Shift+S</kbd></td></tr>
        <tr><td>切换侧边栏</td><td><kbd>Ctrl+B</kbd></td></tr>
        <tr><td>AI 命令面板</td><td><kbd>Ctrl+K</kbd></td></tr>
        <tr><td>打开链接 / 跳转锚点</td><td><kbd>Ctrl+点击</kbd> 链接</td></tr>
        <tr><td>撤销 / 重做</td><td><kbd>Ctrl+Z</kbd> / <kbd>Ctrl+Y</kbd></td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>AI 助手</h2>
    <h3>快捷键</h3>
    <p>按 <kbd>Ctrl+K</kbd> 打开 AI 命令面板。</p>
    <h3>使用方式</h3>
    <ul>
      <li><strong>无选中文本</strong>：在当前光标位置插入 AI 生成的内容</li>
      <li><strong>选中文本</strong>：AI 将基于选中内容进行续写、改写、翻译等操作，生成的内容会替换选中文本</li>
    </ul>
    <h3>配置 API</h3>
    <p>在 <strong>设置 &gt; AI 助手</strong> 中配置：</p>
    <ul>
      <li><strong>端点</strong>：兼容 OpenAI 格式的 API 地址（默认 DeepSeek）</li>
      <li><strong>Key</strong>：API 密钥</li>
      <li><strong>模型</strong>：模型名称（如 deepseek-chat）</li>
      <li><strong>Temperature</strong>：生成随机性（0-2，越低越确定性）</li>
      <li><strong>Max Tokens</strong>：最大生成 token 数</li>
      <li><strong>系统提示词</strong>：自定义系统提示词（留空使用默认）</li>
    </ul>
    <p>配置完成后可点击「测试连接」验证 API 是否可用。</p>
  </div>

  <div class="section">
    <h2>链接与锚点</h2>
    <ul>
      <li><kbd>Ctrl+点击</kbd> 网页链接 → 在默认浏览器（或内置浏览器）中打开</li>
      <li><kbd>Ctrl+点击</kbd> 本地 .md 文件链接 → 在编辑器中直接打开</li>
      <li><kbd>Ctrl+点击</kbd> <code>#锚点</code> 链接 → 跳转到文档内对应标题</li>
      <li>在链接上停留可看到气泡菜单，显示链接地址，支持编辑和取消链接</li>
    </ul>
  </div>

  <div class="section">
    <h2>技术栈</h2>
    <p>Electron 33 · React 18 · TipTap 2 · ProseMirror · Vite 5 · lowlight · markdown-it</p>
  </div>

  <div class="section" style="margin-top:40px; padding-top:20px; border-top:1px solid #333;">
    <p style="text-align:center; color:#666; font-size:12px;">© 2026 MarkFree · <a href="https://github.com/nihaozyj7/MarkFree" style="color:#89b4fa;">GitHub</a></p>
  </div>
</div>
</body>
</html>`
  const helpWin = new BrowserWindow({
    width: 900,
    height: 700,
    title: 'MarkFree 帮助',
    parent: mainWindow,
    webPreferences: { sandbox: true, contextIsolation: true }
  })
  helpWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(helpHtml))
  helpWin.setMenu(null)
})

ipcMain.on('app:confirmClose', () => {
  closeConfirmed = true
  mainWindow?.close()
})

ipcMain.on('app:cancelClose', () => {
  closeConfirmed = false
})

app.whenReady().then(() => {
  protocol.handle('local-file', (request) => {
    let filePath = decodeURIComponent(request.url.slice('local-file://'.length))
    filePath = filePath.replace(/^\/+/, '/')
    if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
      filePath = filePath.slice(1)
    }
    return net.fetch(url.pathToFileURL(filePath).toString()).catch(() => {
      return new Response('', { status: 404 })
    })
  })

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
  } catch (e) { console.error('加载设置失败:', e) }
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
