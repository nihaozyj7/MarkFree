import React, { useState } from 'react'

function Sidebar({ tabs, activeTabId, onSwitchTab, folderFiles, folderPath, onOpenFolder, onOpenFolderFile, showOpenFilesModule }) {
  const folderName = folderPath ? folderPath.split(/[/\\]/).filter(Boolean).pop() : ''
  const [openFilesCollapsed, setOpenFilesCollapsed] = useState(false)

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        {showOpenFilesModule !== false && (
          <div className="sidebar-list">
            <div className="sidebar-list-title sidebar-list-collapsible" onClick={() => setOpenFilesCollapsed(v => !v)}>
              <span className="sidebar-list-title-label">
                <svg className={`sidebar-chevron${openFilesCollapsed ? ' collapsed' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                已打开的文件
              </span>
              <span className="sidebar-count-badge">{tabs.length}</span>
            </div>
            {!openFilesCollapsed && (
              tabs.length === 0 ? (
                <div className="sidebar-empty">暂无打开的文件</div>
              ) : (
                tabs.map(tab => (
                  <div
                    key={ tab.id }
                    className={ `sidebar-item${tab.id === activeTabId ? ' active' : ''}` }
                    onClick={ () => onSwitchTab(tab.id) }
                    title={ tab.filePath || tab.fileName }
                  >
                    <svg className="sidebar-item-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="sidebar-item-name">{ tab.fileName }</span>
                    { tab.modified && <span className="sidebar-item-modified">*</span> }
                  </div>
                ))
              )
            )}
          </div>
        )}
        { folderFiles.length > 0 && (
          <div className="sidebar-list">
            <div className="sidebar-list-title">
              <span>{ folderName }</span>
              <button className="sidebar-refresh-btn" onClick={ onOpenFolder } title="选择文件夹">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
            { folderFiles.map((file, idx) => (
              <div
                key={ file.filePath || idx }
                className="sidebar-item"
                onClick={ () => onOpenFolderFile(file.filePath) }
                title={ file.filePath }
              >
                <svg className="sidebar-item-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="sidebar-item-name">{ file.name }</span>
              </div>
            )) }
          </div>
        ) }
      </div>
    </div>
  )
}

export default Sidebar
