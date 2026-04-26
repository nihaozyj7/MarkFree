import React, { useState, useEffect } from 'react'

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets',
  spellcheck: true,
  closeLastTabAction: 'closeApp',
  showToolbar: true,
  shortcuts: {
    newFile: 'Ctrl+N',
    open: 'Ctrl+O',
    save: 'Ctrl+S',
    saveAs: 'Ctrl+Shift+S'
  }
}

const SHORTCUT_LABELS = {
  newFile: '新建文件',
  open: '打开文件',
  save: '保存',
  saveAs: '另存为'
}

function SettingsDialog({ onClose, currentTheme, onThemeChange, onSaveSettings }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('editorSettings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [themes, setThemes] = useState([])
  const [closing, setClosing] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingShortcut, setEditingShortcut] = useState(null)

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true))
    window.electronAPI.getThemes().then(setThemes).catch(() => {})
  }, [])

  useEffect(() => {
    if (!editingShortcut) return
    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const keys = []
      if (e.ctrlKey || e.metaKey) keys.push('Ctrl')
      if (e.shiftKey) keys.push('Shift')
      if (e.altKey) keys.push('Alt')
      const key = e.key
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return
      let displayKey = key.length === 1 ? key.toUpperCase() : key === ' ' ? 'Space' : key.charAt(0).toUpperCase() + key.slice(1)
      keys.push(displayKey)
      const shortcut = keys.join('+')
      setSettings(s => ({
        ...s,
        shortcuts: { ...s.shortcuts, [editingShortcut]: shortcut }
      }))
      setEditingShortcut(null)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [editingShortcut])

  const startClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 200)
  }

  const handleSave = () => {
    localStorage.setItem('editorSettings', JSON.stringify(settings))
    onSaveSettings?.(settings)
    startClose()
  }

  return (
    <div className={`settings-overlay${open ? ' open' : ''}${closing ? ' closing' : ''}`} onClick={startClose}>
      <div className={`settings-dialog${open ? ' open' : ''}${closing ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span>设置</span>
          <button className="settings-close-btn" onClick={startClose}>✕</button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <h3 className="settings-section-title">主题</h3>
            {themes.length === 0 ? (
              <div className="settings-loading">加载中...</div>
            ) : (
              <select
                className="settings-select"
                value={currentTheme}
                onChange={e => onThemeChange(e.target.value)}
              >
                {themes.map(t => (
                  <option key={t.name} value={t.name}>
                    {t.label}{t.builtin ? '（默认）' : ''}
                  </option>
                ))}
              </select>
            )}
            <div className="settings-section-actions">
              <button className="settings-btn settings-btn-ghost" onClick={() => window.electronAPI.openThemeFolder()}>
                打开主题文件夹
              </button>
            </div>
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">编辑器</h3>
            <label className="settings-radio">
              <input type="checkbox" checked={settings.spellcheck !== false} onChange={e => setSettings({...settings, spellcheck: e.target.checked})} />
              <span>语法检查</span>
            </label>
            <label className="settings-radio">
              <input type="checkbox" checked={settings.showToolbar !== false} onChange={e => setSettings({...settings, showToolbar: e.target.checked})} />
              <span>显示工具栏</span>
            </label>
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">快捷键</h3>
            {Object.keys(settings.shortcuts || DEFAULT_SETTINGS.shortcuts).map(key => (
              <div key={key} className="settings-shortcut-row">
                <span className="settings-shortcut-label">{SHORTCUT_LABELS[key] || key}</span>
                <button
                  className={`settings-shortcut-key${editingShortcut === key ? ' recording' : ''}`}
                  onClick={() => setEditingShortcut(editingShortcut === key ? null : key)}
                >
                  {editingShortcut === key ? '按下快捷键...' : (settings.shortcuts?.[key] || DEFAULT_SETTINGS.shortcuts[key])}
                </button>
                {(settings.shortcuts?.[key] && settings.shortcuts[key] !== DEFAULT_SETTINGS.shortcuts[key]) && (
                  <button
                    className="settings-shortcut-reset"
                    onClick={() => setSettings(s => ({
                      ...s,
                      shortcuts: { ...s.shortcuts, [key]: DEFAULT_SETTINGS.shortcuts[key] }
                    }))}
                    title="恢复默认"
                  >
                    ↺
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">标签页</h3>
            <label className="settings-radio">
              <input type="radio" name="closeAction" value="closeApp" checked={settings.closeLastTabAction === 'closeApp'} onChange={() => setSettings({...settings, closeLastTabAction: 'closeApp'})} />
              <span>关闭最后一个标签页时关闭软件</span>
            </label>
            <label className="settings-radio">
              <input type="radio" name="closeAction" value="newTab" checked={settings.closeLastTabAction === 'newTab'} onChange={() => setSettings({...settings, closeLastTabAction: 'newTab'})} />
              <span>关闭最后一个标签页时创建新标签页</span>
            </label>
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">图片插入位置</h3>
            <label className="settings-radio">
              <input type="radio" name="imageMode" value="base64" checked={settings.imageInsertMode === 'base64'} onChange={() => setSettings({...settings, imageInsertMode: 'base64'})} />
              <span>插入为 Base64</span>
            </label>
            <label className="settings-radio">
              <input type="radio" name="imageMode" value="relative" checked={settings.imageInsertMode === 'relative'} onChange={() => setSettings({...settings, imageInsertMode: 'relative'})} />
              <span>相对路径（图片保存至项目文件夹）</span>
            </label>
            <label className="settings-radio">
              <input type="radio" name="imageMode" value="absolute" checked={settings.imageInsertMode === 'absolute'} onChange={() => setSettings({...settings, imageInsertMode: 'absolute'})} />
              <span>绝对路径</span>
            </label>
          </div>
          {settings.imageInsertMode === 'relative' && (
            <div className="settings-section">
              <h3 className="settings-section-title">图片存储文件夹</h3>
              <input className="settings-input" type="text" value={settings.imageFolder} onChange={e => setSettings({...settings, imageFolder: e.target.value})} placeholder=".assets" />
            </div>
          )}

          <div className="settings-actions">
            <button className="settings-btn settings-btn-primary" onClick={handleSave}>保存</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsDialog
