import React, { useState, useRef, useCallback, useEffect } from 'react'

function Sidebar({ tabs, activeTabId, onSwitchTab, folderFiles, folderPath, onOpenFolder, onOpenFolderFile, showOpenFilesModule, width, onWidthChange }) {
  const folderName = folderPath ? folderPath.split(/[/\\]/).filter(Boolean).pop() : ''
  const [openFilesCollapsed, setOpenFilesCollapsed] = useState(false)
  const sidebarRef = useRef(null)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleMouseDown = useCallback((e) => {
    dragging.current = true
    startX.current = e.clientX
    startWidth.current = sidebarRef.current?.offsetWidth || 220
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!dragging.current) return
    const newWidth = Math.max(120, Math.min(500, startWidth.current + (e.clientX - startX.current)))
    if (sidebarRef.current) {
      sidebarRef.current.style.width = newWidth + 'px'
      sidebarRef.current.style.minWidth = newWidth + 'px'
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (sidebarRef.current) {
      onWidthChange(sidebarRef.current.offsetWidth)
    }
  }, [onWidthChange])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div ref={sidebarRef} className="sidebar" style={{ width, minWidth: width }}>
      <div className="sidebar-resize-handle" onMouseDown={handleMouseDown} />
      <div className="sidebar-content">
        {(folderFiles.length === 0 || showOpenFilesModule !== false) && (
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
