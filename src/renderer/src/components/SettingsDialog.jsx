import React from 'react'

function SettingsDialog({ onClose }) {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-dialog" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span>设置</span>
          <button className="settings-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          <p className="settings-placeholder">设置功能即将推出</p>
        </div>
      </div>
    </div>
  )
}

export default SettingsDialog
