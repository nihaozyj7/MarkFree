import React, { useState, useRef, useEffect } from 'react'

const menuGroups = [
  [
    { id: 'open', label: '打开文件', shortcut: 'Ctrl+O' },
    { id: 'save', label: '保存', shortcut: 'Ctrl+S' },
    { id: 'saveAs', label: '另存为', shortcut: 'Ctrl+Shift+S' }
  ],
  [
    { id: 'exportHtml', label: '导出 HTML' }
  ],
  [
    { id: 'settings', label: '设置' }
  ],
  [
    { id: 'registerAssociation', label: '注册 .md 文件关联' },
    { id: 'unregisterAssociation', label: '取消 .md 文件关联' }
  ]
]

function TitleBar({ fileName, onMenuAction }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleTitleClick = (e) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const handleItemClick = (action) => {
    setMenuOpen(false)
    onMenuAction(action)
  }

  return (
    <div className="title-bar">
      <div className="title-bar-drag">
        <svg className="title-bar-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <div className="title-bar-text" onClick={handleTitleClick}>
          <span>{fileName || 'MarkdownPad'}</span>
          <svg className="title-bar-arrow" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <polygon points="6,9 12,15 18,9" />
          </svg>
        </div>
      </div>
      <div className="title-bar-controls">
        <button className="title-btn title-btn-minimize" onClick={() => window.electronAPI.minimizeWindow()}>
          <svg viewBox="0 0 12 12" width="12" height="12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button className="title-btn title-btn-maximize" onClick={() => window.electronAPI.maximizeWindow()}>
          <svg viewBox="0 0 12 12" width="12" height="12">
            <rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button className="title-btn title-btn-close" onClick={() => window.electronAPI.closeWindow()}>
          <svg viewBox="0 0 12 12" width="12" height="12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="title-menu" ref={menuRef}>
          {menuGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="title-menu-divider" />}
              {group.map(item => (
                <div key={item.id} className="title-menu-item" onClick={() => handleItemClick(item.id)}>
                  <span>{item.label}</span>
                  {item.shortcut && <span className="title-menu-shortcut">{item.shortcut}</span>}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  )
}

export default TitleBar
