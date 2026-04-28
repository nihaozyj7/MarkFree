import React, { useState, useCallback, useRef, useEffect, memo } from 'react'

const FileTreeItem = memo(function FileTreeItem({
  node, depth, onOpenFile, activeFilePath, collapsedPaths, onToggleCollapse,
  onContextMenu, renamingPath, renameValue, onRenameChange, onRenameSubmit, onRenameCancel
}) {
  const inputRef = useRef(null)
  const isDirectory = node.type === 'directory'
  const isCollapsed = collapsedPaths.has(node.path)
  const isActive = !isDirectory && node.path === activeFilePath
  const isRenaming = renamingPath === node.path

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleClick = useCallback((e) => {
    if (isRenaming) return
    if (isDirectory) {
      onToggleCollapse(node.path)
    } else {
      onOpenFile(node.path)
    }
  }, [isRenaming, isDirectory, node.path, onOpenFile, onToggleCollapse])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu(e, node)
  }, [onContextMenu, node])

  const handleRenameKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onRenameSubmit(node.path)
    } else if (e.key === 'Escape') {
      onRenameCancel()
    }
  }, [node.path, onRenameSubmit, onRenameCancel])

  const sharedProps = {
    className: `file-tree-node${isDirectory ? ' file-tree-folder' : ' file-tree-file'}${!isCollapsed && isDirectory ? ' expanded' : ''}${isActive ? ' active' : ''}`,
    style: { paddingLeft: 12 + depth * 16 },
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    title: node.path
  }

  const renameInput = (
    <input
      ref={inputRef}
      className="file-tree-rename-input"
      value={renameValue}
      onChange={e => onRenameChange(e.target.value)}
      onKeyDown={handleRenameKeyDown}
      onBlur={() => onRenameSubmit(node.path)}
      onClick={e => e.stopPropagation()}
    />
  )

  const nameContent = isRenaming ? renameInput : <span className="file-tree-name">{node.name}</span>

  if (isDirectory) {
    return (
      <div>
        <div {...sharedProps}>
          <svg className={`file-tree-chevron${!isCollapsed ? ' expanded' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <svg className="file-tree-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          {nameContent}
        </div>
        {!isCollapsed && node.children.map(child => (
          <FileTreeItem
            key={child.path}
            node={child}
            depth={depth + 1}
            onOpenFile={onOpenFile}
            activeFilePath={activeFilePath}
            collapsedPaths={collapsedPaths}
            onToggleCollapse={onToggleCollapse}
            onContextMenu={onContextMenu}
            renamingPath={renamingPath}
            renameValue={renameValue}
            onRenameChange={onRenameChange}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
          />
        ))}
      </div>
    )
  }

  return (
    <div {...sharedProps}>
      <svg className="file-tree-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      {nameContent}
    </div>
  )
})

function FileTree({ tree, onOpenFile, activeFilePath, onRefreshTree, folderPath }) {
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set())
  const [contextMenu, setContextMenu] = useState(null)
  const [renamingPath, setRenamingPath] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  const handleToggleCollapse = useCallback((path) => {
    setCollapsedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleContextMenu = useCallback((e, node) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const handleKey = (e) => { if (e.key === 'Escape') closeContextMenu() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [contextMenu, closeContextMenu])

  const startRename = useCallback((node) => {
    setRenameValue(node.name)
    setRenamingPath(node.path)
    closeContextMenu()
  }, [closeContextMenu])

  const handleRenameChange = useCallback((value) => {
    setRenameValue(value)
  }, [])

  const handleRenameSubmit = useCallback(async (oldPath) => {
    const trimmed = renameValue.trim()
    if (!trimmed) {
      setRenamingPath(null)
      return
    }
    const nodeName = oldPath.split(/[/\\]/).pop()
    if (trimmed === nodeName) {
      setRenamingPath(null)
      return
    }
    const result = await window.electronAPI.renameEntry(oldPath, trimmed)
    if (result.success) {
      setRenamingPath(null)
      onRefreshTree()
    } else {
      alert('重命名失败: ' + result.error)
    }
  }, [renameValue, onRefreshTree])

  const handleRenameCancel = useCallback(() => {
    setRenamingPath(null)
    setRenameValue('')
  }, [])

  const handleCreateFile = useCallback(async (dirPath) => {
    closeContextMenu()
    const result = await window.electronAPI.createFile(dirPath)
    if (result.success) {
      await onRefreshTree()
      setRenameValue(result.name)
      setRenamingPath(result.path)
    } else {
      alert('创建文件失败: ' + result.error)
    }
  }, [closeContextMenu, onRefreshTree])

  const handleCreateFolder = useCallback(async (dirPath) => {
    closeContextMenu()
    const result = await window.electronAPI.createFolder(dirPath)
    if (result.success) {
      await onRefreshTree()
      setRenameValue(result.name)
      setRenamingPath(result.path)
    } else {
      alert('创建文件夹失败: ' + result.error)
    }
  }, [closeContextMenu, onRefreshTree])

  const handleDelete = useCallback(async (entryPath) => {
    closeContextMenu()
    const name = entryPath.split(/[/\\]/).pop()
    if (!confirm(`确定删除「${name}」？此操作不可撤销。`)) return
    const result = await window.electronAPI.deleteEntry(entryPath)
    if (result.success) {
      onRefreshTree()
    } else {
      alert('删除失败: ' + result.error)
    }
  }, [closeContextMenu, onRefreshTree])

  if (!tree) return null

  const contextNode = contextMenu?.node

  return (
    <div className="file-tree">
      {tree.children.map(child => (
        <FileTreeItem
          key={child.path}
          node={child}
          depth={0}
          onOpenFile={onOpenFile}
          activeFilePath={activeFilePath}
          collapsedPaths={collapsedPaths}
          onToggleCollapse={handleToggleCollapse}
          onContextMenu={handleContextMenu}
          renamingPath={renamingPath}
          renameValue={renameValue}
          onRenameChange={handleRenameChange}
          onRenameSubmit={handleRenameSubmit}
          onRenameCancel={handleRenameCancel}
        />
      ))}
      {contextMenu && (
        <>
          <div className="file-tree-context-menu-overlay" onClick={closeContextMenu} />
          <div
            className="file-tree-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextNode.type === 'directory' && (
              <>
                <div className="file-tree-context-item" onClick={() => handleCreateFile(contextNode.path)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="file-tree-context-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="12" y1="18" x2="12" y2="12"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                  </svg>
                  新建文件
                </div>
                <div className="file-tree-context-item" onClick={() => handleCreateFolder(contextNode.path)}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="file-tree-context-icon">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                  新建文件夹
                </div>
                <div className="file-tree-context-divider" />
              </>
            )}
            <div className="file-tree-context-item" onClick={() => startRename(contextNode)}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="file-tree-context-icon">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              重命名
            </div>
            <div className="file-tree-context-item danger" onClick={() => handleDelete(contextNode.path)}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="file-tree-context-icon">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              删除
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FileTree
