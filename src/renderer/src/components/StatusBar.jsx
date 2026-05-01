import React, { useState, useEffect, useRef, memo } from 'react'

const StatusBar = memo(function StatusBar({ editor, filePath, modified, tabs, onToggleSidebar, sidebarVisible, compactMode, onToggleCompactMode, onAICommand }) {
  const [stats, setStats] = useState({ words: 0, chars: 0, lines: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    if (!editor) return

    const updateStats = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        const doc = editor.state.doc
        const text = doc.textContent
        const textWithoutNewlines = text.replace(/\n/g, '')
        const wordMatches = text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]|[^\s]+/g)
        const words = wordMatches ? wordMatches.length : 0
        const chars = textWithoutNewlines.length
        const lines = doc.childCount
        setStats({ words, chars, lines })
        rafRef.current = null
      })
    }

    editor.on('update', updateStats)
    return () => {
      editor.off('update', updateStats)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [editor])

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
        <button
          className="status-bar-btn status-bar-compact-toggle"
          onClick={onToggleCompactMode}
          title={compactMode ? '切换为宽松模式' : '切换为紧凑模式'}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {compactMode ? (
              <>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <line x1="8" y1="3" x2="8" y2="21" />
              </>
            ) : (
              <>
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </>
            )}
          </svg>
        </button>
        <span className="status-bar-text status-bar-tabs-count">
          {tabs.length > 0 ? `${tabs.length} 个标签页` : ''}
        </span>
      </div>
      <div className="status-bar-right">
        {modified && <span className="status-bar-text status-bar-modified">已修改</span>}
        <button
          className="status-bar-btn status-bar-ai-toggle"
          onMouseDown={(e) => { e.preventDefault(); onAICommand() }}
          title="AI 命令 (Ctrl+K)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
        <span className="status-bar-text status-bar-stat">{stats.words} 词</span>
        <span className="status-bar-text status-bar-stat">{stats.chars} 字符</span>
        <span className="status-bar-text status-bar-stat">{stats.lines} 行</span>
        <span className="status-bar-text status-bar-encoding">UTF-8</span>
      </div>
    </div>
  )
})

export default StatusBar
