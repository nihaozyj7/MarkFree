import { contextBridge, ipcRenderer, webUtils } from 'electron'

let pendingDropPath = ''

document.addEventListener('drop', (e) => {
  const file = e.dataTransfer?.files?.[0]
  if (!file || !/\.md$|\.markdown$/i.test(file.name)) return
  try {
    pendingDropPath = webUtils.getPathForFile(file) || ''
  } catch {
    pendingDropPath = ''
  }
}, true)

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openMultipleFiles: () => ipcRenderer.invoke('dialog:openMultipleFiles'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (content, filePath) => ipcRenderer.invoke('dialog:saveFile', { content, filePath }),
  saveAsFile: (content) => ipcRenderer.invoke('dialog:saveAsFile', content),
  openFileByPath: (filePath) => ipcRenderer.invoke('file:openByPath', filePath),
  selectImageFile: () => ipcRenderer.invoke('dialog:selectImageFile'),
  saveImageToDisk: (params) => ipcRenderer.invoke('image:saveToDisk', params),
  registerAssociation: () => ipcRenderer.invoke('file:registerAssociation'),
  unregisterAssociation: () => ipcRenderer.invoke('file:unregisterAssociation'),
  getAssociationStatus: () => ipcRenderer.invoke('file:getAssociationStatus'),
  onFileOpened: (callback) => {
    ipcRenderer.on('file:opened', (_event, data) => callback(data))
  },
  removeFileOpenedListener: () => {
    ipcRenderer.removeAllListeners('file:opened')
  },
  onFolderOpened: (callback) => {
    ipcRenderer.on('folder:opened', (_event, data) => callback(data))
  },
  removeFolderOpenedListener: () => {
    ipcRenderer.removeAllListeners('folder:opened')
  },
  setTitle: (title) => ipcRenderer.send('window:setTitle', title),
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  getPendingDropPath: () => {
    const path = pendingDropPath
    pendingDropPath = ''
    return path
  },

  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  getFolderTree: (folderPath) => ipcRenderer.invoke('folder:getTree', folderPath),
  getFolderChildren: (dirPath) => ipcRenderer.invoke('folder:getChildren', dirPath),
  listMdFiles: (folderPath) => ipcRenderer.invoke('folder:listMdFiles', folderPath),

  createFile: (dirPath) => ipcRenderer.invoke('folder:createFile', dirPath),
  createFolder: (dirPath) => ipcRenderer.invoke('folder:createFolder', dirPath),
  deleteEntry: (entryPath) => ipcRenderer.invoke('folder:deleteEntry', entryPath),
  renameEntry: (oldPath, newName) => ipcRenderer.invoke('folder:renameEntry', { oldPath, newName }),

  getThemes: () => ipcRenderer.invoke('theme:list'),
  loadTheme: (name) => ipcRenderer.invoke('theme:load', name),
  openThemeFolder: () => ipcRenderer.invoke('theme:openFolder'),

  getAppSettings: () => ipcRenderer.invoke('settings:get'),
  saveAppSettings: (settings) => ipcRenderer.invoke('settings:save', settings)
})
