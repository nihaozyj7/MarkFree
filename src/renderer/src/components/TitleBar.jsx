import React, { useState, useRef, useEffect } from 'react'

const menuGroups = [
  {
    label: '文件',
    items: [
      { id: 'newFile', label: '新建文件', shortcut: 'Ctrl+N' },
      { id: 'open', label: '打开文件', shortcut: 'Ctrl+O' },
      { id: 'openFolder', label: '打开文件夹' },
      { id: 'save', label: '保存', shortcut: 'Ctrl+S' },
      { id: 'saveAs', label: '另存为', shortcut: 'Ctrl+Shift+S' }
    ]
  },
  {
    label: '导出',
    items: [
      { id: 'exportHtml', label: '导出 HTML' }
    ]
  },
  {
    label: '设置',
    items: [
      { id: 'settings', label: '设置' }
    ]
  },
  {
    label: '文件关联',
    items: [
      { id: 'registerAssociation', label: '注册 .md 文件关联' },
      { id: 'unregisterAssociation', label: '取消 .md 文件关联' }
    ]
  }
]

function TitleBar({ tabs, activeTabId, onSwitchTab, onCloseTab, onMenuAction, onAddTab }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const tabListRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!tabListRef.current || !activeTabId) return
    const el = tabListRef.current.querySelector('.tb-tab.active')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeTabId])

  const handleBrandClick = (e) => {
    e.stopPropagation()
    setMenuOpen(!menuOpen)
  }

  const handleItemClick = (action) => {
    setMenuOpen(false)
    onMenuAction(action)
  }

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <div className="title-bar-brand" onClick={handleBrandClick}>
          <svg className="title-bar-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span>mdPad</span>
          <svg className="title-bar-arrow" viewBox="0 0 24 24" width="10" height="10" fill="currentColor">
            <polygon points="6,9 12,15 18,9" />
          </svg>
        </div>
        <div className="title-bar-tabs" ref={tabListRef}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`tb-tab${tab.id === activeTabId ? ' active' : ''}${tab.modified ? ' modified' : ''}`}
              onClick={() => onSwitchTab(tab.id)}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault()
                  onCloseTab(tab.id)
                }
              }}
              title={tab.filePath || tab.fileName}
            >
              <svg className="tb-tab-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="tb-tab-name">{tab.fileName}</span>
              {tab.modified && <span className="tb-tab-modified">*</span>}
              <button
                className="tb-tab-close"
                onClick={(e) => { e.stopPropagation(); onCloseTab(tab.id) }}
                title="关闭"
              >
                <svg viewBox="0 0 12 12" width="10" height="10">
                  <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          ))}
          <button className="tb-tab-add" onClick={() => onAddTab?.()} title="新建标签页">
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="7" y1="2" x2="7" y2="12" />
              <line x1="2" y1="7" x2="12" y2="7" />
            </svg>
          </button>
        </div>
        <div className="title-bar-spacer"></div>
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
              <div className="title-menu-group-label">{group.label}</div>
              {group.items.map(item => (
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
