import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react'
import FileTree from './FileTree'

function compareNodes(a, b, sortMode) {
  const [position, sortBy] = (sortMode || 'foldersFirst-createTime').split('-')
  const foldersFirst = position === 'foldersFirst'

  if (a.type !== b.type) {
    if (foldersFirst) return a.type === 'directory' ? -1 : 1
    return a.type === 'directory' ? 1 : -1
  }

  if (sortBy === 'createTime') return (a.birthtime || 0) - (b.birthtime || 0)
  if (sortBy === 'modifyTime') return (a.mtime || 0) - (b.mtime || 0)
  if (sortBy === 'wordCount') return (a.wordCount || 0) - (b.wordCount || 0)

  return a.name.localeCompare(b.name)
}

function sortTree(tree, sortMode) {
  if (!tree || !tree.children) return tree
  return {
    ...tree,
    children: [...tree.children].sort((a, b) => compareNodes(a, b, sortMode)).map(child =>
      child.type === 'directory' && child.children ? sortTree(child, sortMode) : child
    )
  }
}

const SidebarTabItem = memo(function SidebarTabItem({ tab, isActive, onSwitchTab }) {
  const handleClick = useCallback(() => onSwitchTab(tab.id), [onSwitchTab, tab.id])
  return (
    <div
      className={`sidebar-item${isActive ? ' active' : ''}`}
      onClick={handleClick}
      title={tab.filePath || tab.fileName}
    >
      <svg className="sidebar-item-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="sidebar-item-name">{tab.fileName}</span>
      {tab.modified && <span className="sidebar-item-modified">*</span>}
    </div>
  )
})

const Sidebar = memo(function Sidebar({ tabs, activeTabId, onSwitchTab, folderTree, folderPath, onOpenFolderFile, onRefreshFolderTree, showOpenFilesModule, activeFilePath, width, onWidthChange, onCreateFile, onCreateFolder, renameTargetPath, renameTargetValue, onClearRenameTarget, sortMode, fileTreeMode }) {
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

  const handleMouseMoveRef = useRef()
  handleMouseMoveRef.current = (e) => {
    if (!dragging.current) return
    const newWidth = Math.max(120, Math.min(500, startWidth.current + (e.clientX - startX.current)))
    if (sidebarRef.current) {
      sidebarRef.current.style.width = newWidth + 'px'
      sidebarRef.current.style.minWidth = newWidth + 'px'
    }
  }

  const handleMouseUpRef = useRef()
  handleMouseUpRef.current = () => {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (sidebarRef.current) {
      onWidthChange(sidebarRef.current.offsetWidth)
    }
  }

  useEffect(() => {
    const onMove = (e) => handleMouseMoveRef.current(e)
    const onUp = () => handleMouseUpRef.current()
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  const sortedTree = useMemo(() => {
    return sortMode && folderTree ? sortTree(folderTree, sortMode) : folderTree
  }, [folderTree, sortMode])

  return (
    <div ref={sidebarRef} className="sidebar" style={{ width, minWidth: width }}>
      <div className="sidebar-resize-handle" onMouseDown={handleMouseDown} />
      <div className="sidebar-content">
        {(showOpenFilesModule !== false) && (
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
                  <SidebarTabItem
                    key={tab.id}
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    onSwitchTab={onSwitchTab}
                  />
                ))
              )
            )}
          </div>
        )}
        {folderTree && (
          <div className="sidebar-list">
            <div className="sidebar-list-title">
              <span>{folderName}</span>
              <div className="sidebar-header-actions">
                <button className="sidebar-action-btn" onClick={onCreateFile} title="新建文件">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                </button>
                <button className="sidebar-action-btn" onClick={onCreateFolder} title="新建文件夹">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                </button>
                <button className="sidebar-action-btn" onClick={onRefreshFolderTree} title="刷新">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
              </div>
            </div>
            <FileTree
              tree={sortedTree}
              onOpenFile={onOpenFolderFile}
              activeFilePath={activeFilePath}
              onRefreshTree={onRefreshFolderTree}
              externalRenamePath={renameTargetPath}
              externalRenameValue={renameTargetValue}
              onExternalRenamePathChange={onClearRenameTarget}
              sortMode={sortMode}
              fileTreeMode={fileTreeMode}
            />
          </div>
        )}
      </div>
    </div>
  )
})

export default Sidebar