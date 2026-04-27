import React, { useState, useEffect, memo } from 'react'

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets',
  spellcheck: true,
  closeLastTabAction: 'closeApp',
  showToolbar: true,
  showOpenFilesModule: true,
  fontFamily: 'default',
  fontSize: 16,
  shortcuts: {
    newFile: 'Ctrl+N',
    open: 'Ctrl+O',
    save: 'Ctrl+S',
    saveAs: 'Ctrl+Shift+S',
    sidebarToggle: 'Ctrl+B'
  }
}

const SHORTCUT_LABELS = {
  newFile: '新建文件',
  open: '打开文件',
  save: '保存',
  saveAs: '另存为',
  sidebarToggle: '侧边栏'
}

const SettingsDialog = memo(function SettingsDialog({ onClose, currentTheme, onThemeChange, onSaveSettings, hwAccel, onHwAccelChange, defaultOpenPath, onDefaultOpenPathChange, windowMode, windowBounds, onWindowModeChange, onWindowBoundsChange }) {
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
      updateSettings({
        shortcuts: { ...settings.shortcuts, [editingShortcut]: shortcut }
      })
      setEditingShortcut(null)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [editingShortcut])

  const updateSettings = (partial) => {
    const newSettings = { ...settings, ...partial }
    setSettings(newSettings)
    localStorage.setItem('editorSettings', JSON.stringify(newSettings))
    onSaveSettings?.(newSettings)
  }

  const startClose = () => {
    setClosing(true)
    setTimeout(() => onClose(), 200)
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
            <h3 className="settings-section-title">硬件加速</h3>
            <p className="settings-section-desc">修改后需重启应用生效</p>
            <select
              className="settings-select"
              value={hwAccel}
              onChange={e => onHwAccelChange(e.target.value)}
            >
              <option value="auto">自动（推荐）</option>
              <option value="always">始终启用</option>
              <option value="never">禁用</option>
            </select>
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">编辑器</h3>
            <label className="settings-radio">
              <input type="checkbox" checked={settings.spellcheck !== false} onChange={e => updateSettings({spellcheck: e.target.checked})} />
              <span>语法检查</span>
            </label>
            <label className="settings-radio">
              <input type="checkbox" checked={settings.showToolbar !== false} onChange={e => updateSettings({showToolbar: e.target.checked})} />
              <span>显示工具栏</span>
            </label>
            <label className="settings-radio">
              <input type="checkbox" checked={settings.showOpenFilesModule !== false} onChange={e => updateSettings({showOpenFilesModule: e.target.checked})} />
              <span>打开文件夹时显示已打开的文件</span>
            </label>
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">字体</h3>
            <div className="settings-row">
              <label className="settings-row-label">字体</label>
              <select
                className="settings-select settings-select-inline"
                value={settings.fontFamily || 'default'}
                onChange={e => updateSettings({fontFamily: e.target.value})}
              >
                <option value="default">系统默认</option>
                <option value="system-ui, -apple-system, sans-serif">Sans Serif</option>
                <option value="Georgia, 'Times New Roman', serif">Serif</option>
                <option value="'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace">Monospace</option>
                <option value="'Microsoft YaHei', 'PingFang SC', sans-serif">微软雅黑</option>
                <option value="'Noto Serif SC', 'SimSun', serif">宋体</option>
              </select>
            </div>
            <div className="settings-row">
              <label className="settings-row-label">字号</label>
              <select
                className="settings-select settings-select-inline"
                value={settings.fontSize || 16}
                onChange={e => updateSettings({fontSize: Number(e.target.value)})}
              >
                <option value={14}>14px</option>
                <option value={15}>15px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
                <option value={22}>22px</option>
                <option value={24}>24px</option>
              </select>
            </div>
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
                    onClick={() => updateSettings({
                      shortcuts: { ...settings.shortcuts, [key]: DEFAULT_SETTINGS.shortcuts[key] }
                    })}
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
            <select
              className="settings-select"
              value={settings.closeLastTabAction}
                onChange={e => updateSettings({closeLastTabAction: e.target.value})}
            >
              <option value="closeApp">关闭最后一个标签页时关闭软件</option>
              <option value="newTab">关闭最后一个标签页时创建新标签页</option>
            </select>
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">默认打开路径</h3>
            <p className="settings-section-desc">应用直接启动时（非命令行调用）默认打开的文件或文件夹，留空则创建未命名文件</p>
            <input
              className="settings-input"
              type="text"
              value={defaultOpenPath}
              onChange={e => onDefaultOpenPathChange?.(e.target.value)}
              placeholder="例如: C:\Users\Docs 或 C:\Users\Docs\readme.md"
            />
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">窗口启动位置与尺寸</h3>
            <p className="settings-section-desc">修改后需重启应用生效</p>
            <select
              className="settings-select"
              value={windowMode}
              onChange={e => onWindowModeChange(e.target.value)}
            >
              <option value="center">居中（默认）</option>
              <option value="auto">自动记忆上次位置</option>
              <option value="fixed">固定</option>
            </select>
            {windowMode === 'fixed' && (
              <div className="settings-window-bounds">
                <div className="settings-row">
                  <label className="settings-row-label">X</label>
                  <input
                    className="settings-input settings-input-inline"
                    type="number"
                    value={windowBounds?.x ?? 0}
                    onChange={e => onWindowBoundsChange({ ...windowBounds, x: Number(e.target.value) })}
                  />
                </div>
                <div className="settings-row">
                  <label className="settings-row-label">Y</label>
                  <input
                    className="settings-input settings-input-inline"
                    type="number"
                    value={windowBounds?.y ?? 0}
                    onChange={e => onWindowBoundsChange({ ...windowBounds, y: Number(e.target.value) })}
                  />
                </div>
                <div className="settings-row">
                  <label className="settings-row-label">宽</label>
                  <input
                    className="settings-input settings-input-inline"
                    type="number"
                    min={680}
                    value={windowBounds?.width ?? 1200}
                    onChange={e => onWindowBoundsChange({ ...windowBounds, width: Number(e.target.value) })}
                  />
                </div>
                <div className="settings-row">
                  <label className="settings-row-label">高</label>
                  <input
                    className="settings-input settings-input-inline"
                    type="number"
                    min={480}
                    value={windowBounds?.height ?? 800}
                    onChange={e => onWindowBoundsChange({ ...windowBounds, height: Number(e.target.value) })}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="settings-divider" />
          <div className="settings-section">
            <h3 className="settings-section-title">图片插入位置</h3>
            <select
              className="settings-select"
              value={settings.imageInsertMode}
                onChange={e => updateSettings({imageInsertMode: e.target.value})}
            >
              <option value="base64">插入为 Base64</option>
              <option value="relative">相对路径（图片保存至项目文件夹）</option>
              <option value="absolute">绝对路径</option>
            </select>
          </div>
          {settings.imageInsertMode === 'relative' && (
            <div className="settings-section">
              <h3 className="settings-section-title">图片存储文件夹</h3>
              <input className="settings-input" type="text" value={settings.imageFolder} onChange={e => updateSettings({imageFolder: e.target.value})} placeholder=".assets" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default SettingsDialog
