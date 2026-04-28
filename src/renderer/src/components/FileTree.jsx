import React, { useState, useCallback, memo } from 'react'

const FileTreeItem = memo(function FileTreeItem({ node, depth, onOpenFile, activeFilePath, collapsedPaths, onToggleCollapse }) {
  const isDirectory = node.type === 'directory'
  const isCollapsed = collapsedPaths.has(node.path)
  const isActive = !isDirectory && node.path === activeFilePath

  if (isDirectory) {
    return (
      <div>
        <div
          className={`file-tree-node file-tree-folder${!isCollapsed ? ' expanded' : ''}`}
          style={{ paddingLeft: 12 + depth * 16 }}
          onClick={() => onToggleCollapse(node.path)}
          title={node.path}
        >
          <svg className={`file-tree-chevron${!isCollapsed ? ' expanded' : ''}`} viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <svg className="file-tree-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="file-tree-name">{node.name}</span>
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
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`file-tree-node file-tree-file${isActive ? ' active' : ''}`}
      style={{ paddingLeft: 12 + depth * 16 }}
      onClick={() => onOpenFile(node.path)}
      title={node.path}
    >
      <svg className="file-tree-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span className="file-tree-name">{node.name}</span>
    </div>
  )
})

function FileTree({ tree, onOpenFile, activeFilePath }) {
  const [collapsedPaths, setCollapsedPaths] = useState(() => new Set())

  const handleToggleCollapse = useCallback((path) => {
    setCollapsedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  if (!tree) return null

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
        />
      ))}
    </div>
  )
}

export default FileTree
