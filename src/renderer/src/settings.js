const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets',
  spellcheck: true,
  closeLastTabAction: 'closeApp',
  showToolbar: true,
  showOpenFilesModule: true,
  fontFamily: 'default',
  fontSize: 16,
  compactMode: false,
  sidebarWidth: 220,
  startupBehavior: 'newFile',
  shortcuts: {
    newFile: 'Ctrl+N',
    open: 'Ctrl+O',
    save: 'Ctrl+S',
    saveAs: 'Ctrl+Shift+S',
    sidebarToggle: 'Ctrl+B'
  },
  folderSortMode: 'foldersFirst-createTime'
}

function getSettings() {
  try {
    const saved = localStorage.getItem('editorSettings')
    const settings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    if (settings.closeLastTabAction === 'newTab') {
      settings.closeLastTabAction = 'showWelcome'
    }
    return settings
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(partial) {
  try {
    const current = JSON.parse(localStorage.getItem('editorSettings') || '{}')
    const merged = { ...current, ...partial }
    localStorage.setItem('editorSettings', JSON.stringify(merged))
    return merged
  } catch {
    return partial
  }
}

function applyFontSettings(settings) {
  const fontFamily = settings.fontFamily && settings.fontFamily !== 'default'
    ? settings.fontFamily
    : 'inherit'
  const fontSize = settings.fontSize || 16
  let el = document.getElementById('editor-font')
  if (!el) {
    el = document.createElement('style')
    el.id = 'editor-font'
    document.head.appendChild(el)
  }
  el.textContent = `.ProseMirror { font-family: ${fontFamily} !important; font-size: ${fontSize}px !important; }`
}

export { DEFAULT_SETTINGS, getSettings, saveSettings, applyFontSettings }
