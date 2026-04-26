import React, { useState, useEffect } from 'react'

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets',
  spellcheck: true
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

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true))
    window.electronAPI.getThemes().then(setThemes).catch(() => {})
  }, [])

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
