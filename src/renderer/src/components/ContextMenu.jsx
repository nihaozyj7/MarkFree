import React, { useState, useEffect, useRef, useCallback } from 'react'

const MENU_GROUPS = [
  {
    label: '格式',
    items: [
      { id: 'bold', label: '加粗', action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive('bold'), shortcut: 'Ctrl+B' },
      { id: 'italic', label: '斜体', action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive('italic'), shortcut: 'Ctrl+I' },
      { id: 'underline', label: '下划线', action: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive('underline'), shortcut: 'Ctrl+U' },
      { id: 'strike', label: '删除线', action: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive('strike') },
      { id: 'code', label: '行内代码', action: (e) => e.chain().focus().toggleCode().run(), isActive: (e) => e.isActive('code') }
    ]
  },
  {
    label: '标题',
    items: [
      { id: 'h1', label: '标题 1', action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive('heading', { level: 1 }) },
      { id: 'h2', label: '标题 2', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive('heading', { level: 2 }) },
      { id: 'h3', label: '标题 3', action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive('heading', { level: 3 }) },
      { id: 'h4', label: '标题 4', action: (e) => e.chain().focus().toggleHeading({ level: 4 }).run(), isActive: (e) => e.isActive('heading', { level: 4 }) },
      { id: 'h5', label: '标题 5', action: (e) => e.chain().focus().toggleHeading({ level: 5 }).run(), isActive: (e) => e.isActive('heading', { level: 5 }) },
      { id: 'h6', label: '标题 6', action: (e) => e.chain().focus().toggleHeading({ level: 6 }).run(), isActive: (e) => e.isActive('heading', { level: 6 }) }
    ]
  },
  {
    label: '列表',
    items: [
      { id: 'bulletList', label: '无序列表', action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive('bulletList') },
      { id: 'orderedList', label: '有序列表', action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
      { id: 'taskList', label: '任务列表', action: (e) => e.chain().focus().toggleTaskList().run(), isActive: (e) => e.isActive('taskList') }
    ]
  },
  {
    label: '块元素',
    items: [
      { id: 'blockquote', label: '引用', action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive('blockquote') },
      { id: 'codeBlock', label: '代码块', action: (e) => e.chain().focus().toggleCodeBlock().run(), isActive: (e) => e.isActive('codeBlock') },
      { id: 'horizontalRule', label: '分隔线', action: (e) => e.chain().focus().setHorizontalRule().run(), isActive: () => false }
    ]
  },
  {
    label: '编辑',
    items: [
      { id: 'cut', label: '剪切', action: () => document.execCommand('cut'), shortcut: 'Ctrl+X' },
      { id: 'copy', label: '复制', action: () => document.execCommand('copy'), shortcut: 'Ctrl+C' },
      { id: 'paste', label: '粘贴', action: () => document.execCommand('paste'), shortcut: 'Ctrl+V' },
      { id: 'selectAll', label: '全选', action: (e) => e.commands.selectAll(), shortcut: 'Ctrl+A' }
    ]
  },
  {
    label: '导出',
    items: [
      { id: 'exportHtml', label: '导出为 HTML' }
    ]
  }
]

function ContextMenu({ editor, visible, position, onClose, onCopyMarkdown, onPasteMarkdown, onExportHtml }) {
  const menuRef = useRef(null)
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 })

  const handleExportHtml = useCallback(() => {
    onExportHtml?.()
    onClose()
  }, [onExportHtml, onClose])

  const handleCopyMarkdown = useCallback(() => {
    onCopyMarkdown?.()
    onClose()
  }, [onCopyMarkdown, onClose])

  const handlePasteMarkdown = useCallback(() => {
    onPasteMarkdown?.()
    onClose()
  }, [onPasteMarkdown, onClose])

  useEffect(() => {
    if (!visible) return

    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, onClose])

  useEffect(() => {
    if (!visible || !menuRef.current) return

    requestAnimationFrame(() => {
      if (!menuRef.current) return
      const rect = menuRef.current.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      let x = position.x
      let y = position.y

      if (x + rect.width > vw) x = vw - rect.width - 8
      if (y + rect.height > vh) y = vh - rect.height - 8
      if (x < 0) x = 8
      if (y < 0) y = 8

      setAdjustedPos({ x, y })
    })
  }, [visible, position])

  if (!visible) return null

  const allActions = {
    exportHtml: handleExportHtml,
    copyMarkdown: handleCopyMarkdown,
    pasteMarkdown: handlePasteMarkdown
  }

  return (
    <div
      className="context-menu-overlay"
      onContextMenu={(e) => { e.preventDefault(); onClose() }}
    >
      <div
        className="context-menu"
        ref={menuRef}
        style={{ left: adjustedPos.x || position.x, top: adjustedPos.y || position.y }}
      >
        {MENU_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && <div className="context-menu-divider" />}
            <div className="context-menu-group-label">{group.label}</div>
            {group.items.map((item) => (
              <div
                key={item.id}
                className={`context-menu-item${item.isActive && item.isActive(editor) ? ' active' : ''}`}
                onClick={() => {
                  const action = allActions[item.id]
                  if (action) {
                    action()
                  } else if (item.action) {
                    item.action(editor)
                    onClose()
                  }
                }}
              >
                <span className="context-menu-item-label">{item.label}</span>
                {item.shortcut && <span className="context-menu-item-shortcut">{item.shortcut}</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
        <div className="context-menu-divider" />
        <div className="context-menu-group-label">Markdown</div>
        <div className="context-menu-item" onClick={handleCopyMarkdown}>
          <span className="context-menu-item-label">复制 Markdown</span>
        </div>
        <div className="context-menu-item" onClick={handlePasteMarkdown}>
          <span className="context-menu-item-label">粘贴 Markdown</span>
        </div>
      </div>
    </div>
  )
}

export default ContextMenu