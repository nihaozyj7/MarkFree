import React, { useState, useEffect } from 'react'

function StatusBar({ editor, filePath, modified, tabs, onToggleSidebar, sidebarVisible }) {
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 0 })

  useEffect(() => {
    if (!editor) return

    const updateStats = () => {
      const text = editor.state.doc.textContent
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = text.length
      const lines = editor.state.doc.nodeSize - 2
      setStats({ words, chars, lines })
    }

    updateStats()
    editor.on('update', updateStats)
    return () => editor.off('update', updateStats)
  }, [editor])

  const fileName = filePath ? filePath.split(/[/\\]/).pop() : ''

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <button
          className={`status-bar-btn status-bar-sidebar-toggle${sidebarVisible ? ' active' : ''}`}
          onClick={onToggleSidebar}
          title={sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <span className="status-bar-text status-bar-tabs-count">
          {tabs.length > 0 ? `${tabs.length} 个标签页` : ''}
        </span>
      </div>
      <div className="status-bar-right">
        {modified && <span className="status-bar-text status-bar-modified">已修改</span>}
        {fileName && <span className="status-bar-text status-bar-file">{fileName}</span>}
        <span className="status-bar-text status-bar-stat">{stats.words} 词</span>
        <span className="status-bar-text status-bar-stat">{stats.chars} 字符</span>
        <span className="status-bar-text status-bar-stat">{stats.lines} 行</span>
        <span className="status-bar-text status-bar-encoding">UTF-8</span>
      </div>
    </div>
  )
}

export default StatusBar
