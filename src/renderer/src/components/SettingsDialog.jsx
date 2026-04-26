import React, { useState } from 'react'

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: './assets',
  imageNaming: 'hash'
}

function SettingsDialog({ onClose }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('editorSettings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

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
              <input className="settings-input" type="text" value={settings.imageFolder} onChange={e => setSettings({...settings, imageFolder: e.target.value})} placeholder="./assets" />
            </div>
          )}
          {settings.imageInsertMode !== 'base64' && (
            <div className="settings-section">
              <h3 className="settings-section-title">图片命名方式</h3>
              <label className="settings-radio">
                <input type="radio" name="imageNaming" value="hash" checked={settings.imageNaming === 'hash'} onChange={() => setSettings({...settings, imageNaming: 'hash'})} />
                <span>Hash（前16位）</span>
              </label>
              <label className="settings-radio">
                <input type="radio" name="imageNaming" value="timestamp" checked={settings.imageNaming === 'timestamp'} onChange={() => setSettings({...settings, imageNaming: 'timestamp'})} />
                <span>时间戳</span>
              </label>
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
