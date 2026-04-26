import React, { useState, useEffect } from 'react'

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets'
}

function SettingsDialog({ onClose, currentTheme, onThemeChange }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('editorSettings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [themes, setThemes] = useState([])

  useEffect(() => {
    window.electronAPI.getThemes().then(setThemes).catch(() => {})
  }, [])

  const handleSave = () => {
    localStorage.setItem('editorSettings', JSON.stringify(settings))
    onClose()
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span>设置</span>
          <button className="settings-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          <div className="settings-section">
            <h3 className="settings-section-title">主题</h3>
            {themes.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>加载中...</div>
            ) : (
              themes.map(t => (
                <label key={t.name} className="settings-radio">
                  <input
                    type="radio"
                    name="theme"
                    value={t.name}
                    checked={currentTheme === t.name}
                    onChange={() => onThemeChange(t.name)}
                  />
                  <span>{t.label}</span>
                  {t.builtin && <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 6 }}>(默认)</span>}
                </label>
              ))
            )}
            <div style={{ marginTop: 8 }}>
              <button
                className="settings-btn"
                style={{ fontSize: 12, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 4, color: 'var(--text-secondary)', cursor: 'pointer' }}
                onClick={() => window.electronAPI.openThemeFolder()}
              >
                打开主题文件夹
              </button>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--border-color)', marginBottom: 24 }} />
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
