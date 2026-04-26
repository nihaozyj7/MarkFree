import React, { useState, useEffect, useRef } from 'react'

const ICONS = {
  bold: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 4 4 0 1 0-4-4H6z" />
      <path d="M6 12h9a4 4 0 0 1 4 4 0 1 0-4-4H6z" />
    </svg>
  ),
  italic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="4" x2="10" y2="4" />
      <line x1="14" y1="20" x2="5" y2="20" />
      <line x1="15" y1="4" x2="9" y2="20" />
    </svg>
  ),
  underline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
      <line x1="4" y1="21" x2="20" y2="21" />
    </svg>
  ),
  strike: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4H9a3 3 0 0 0-2.83 4" />
      <path d="M14 12a4 4 0 0 1 0 8H6" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  h1: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="m17 12 3-2v8" />
    </svg>
  ),
  h2: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12h8" />
      <path d="M4 18V6" />
      <path d="M12 18V6" />
      <path d="M21 18H16a2 2 0 0 1-2-2 2 2 0 0 1 2-2h3.5A1.5 1.5 0 0 0 21 12.5 1.5 1.5 0 0 0 19.5 11H16" />
    </svg>
  ),
  heading: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h8" />
      <path d="M6 18V6" />
      <path d="M12 18V6" />
      <path d="M18 12v-3h1a2 2 0 1 0 0-4" />
      <path d="M18 18v.01" />
    </svg>
  ),
  bulletList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  orderedList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" y1="6" x2="21" y2="6" />
      <line x1="10" y1="12" x2="21" y2="12" />
      <line x1="10" y1="18" x2="21" y2="18" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
    </svg>
  ),
  taskList: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  blockquote: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M3 12h12" />
      <path d="M3 18h15" />
    </svg>
  ),
  codeBlock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  horizontalRule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="8 8 12 4 16 8" />
      <polyline points="16 16 12 20 8 16" />
    </svg>
  ),
  cut: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <path d="M8.12 8.12 12 12" />
      <path d="M20 4 8.12 15.88" />
      <circle cx="6" cy="18" r="3" />
      <path d="M14.8 14.8 20 20" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  paste: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  ),
  selectAll: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  addRowAfter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="10" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <rect x="3" y="12" width="18" height="10" rx="1" />
      <line x1="12" y1="15" x2="12" y2="19" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </svg>
  ),
  addRowBefore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="10" rx="1" />
      <line x1="12" y1="5" x2="12" y2="9" />
      <line x1="10" y1="7" x2="14" y2="7" />
      <line x1="12" y1="14" x2="12" y2="22" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  ),
  addColumnAfter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="10" height="18" rx="1" />
      <line x1="5" y1="12" x2="9" y2="12" />
      <line x1="7" y1="10" x2="7" y2="14" />
      <line x1="16" y1="12" x2="22" y2="12" />
      <line x1="19" y1="9" x2="19" y2="15" />
    </svg>
  ),
  addColumnBefore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="12" y2="12" />
      <line x1="8" y1="9" x2="8" y2="15" />
      <rect x="14" y="3" width="8" height="18" rx="1" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="20" y1="10" x2="20" y2="14" />
    </svg>
  ),
  deleteRow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="2" width="18" height="20" rx="1" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="17" y1="9" x2="21" y2="12" />
      <line x1="17" y1="15" x2="21" y2="12" />
    </svg>
  ),
  deleteColumn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="1" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="9" y1="17" x2="12" y2="21" />
      <line x1="15" y1="17" x2="12" y2="21" />
    </svg>
  ),
  deleteTable: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  mergeCells: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="4" y1="8" x2="8" y2="8" />
      <line x1="4" y1="16" x2="8" y2="16" />
    </svg>
  ),
  splitCell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="8" y1="6" x2="8" y2="10" />
      <line x1="16" y1="6" x2="16" y2="10" />
    </svg>
  ),
}

const MENU_GROUPS = [
  {
    label: '格式',
    items: [
      { id: 'bold', label: '加粗', icon: 'bold', action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive('bold') },
      { id: 'italic', label: '斜体', icon: 'italic', action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive('italic') },
      { id: 'underline', label: '下划线', icon: 'underline', action: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive('underline') },
      { id: 'strike', label: '删除线', icon: 'strike', action: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive('strike') },
      { id: 'code', label: '行内代码', icon: 'code', action: (e) => e.chain().focus().toggleCode().run(), isActive: (e) => e.isActive('code') },
    ]
  },
  {
    label: '标题',
    items: [
      { id: 'h1', label: '标题 1', icon: 'h1', action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive('heading', { level: 1 }) },
      { id: 'h2', label: '标题 2', icon: 'h2', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive('heading', { level: 2 }) },
      { id: 'h3', label: '标题 3', icon: 'heading', action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive('heading', { level: 3 }) },
      { id: 'h4', label: '标题 4', icon: 'heading', action: (e) => e.chain().focus().toggleHeading({ level: 4 }).run(), isActive: (e) => e.isActive('heading', { level: 4 }) },
      { id: 'h5', label: '标题 5', icon: 'heading', action: (e) => e.chain().focus().toggleHeading({ level: 5 }).run(), isActive: (e) => e.isActive('heading', { level: 5 }) },
      { id: 'h6', label: '标题 6', icon: 'heading', action: (e) => e.chain().focus().toggleHeading({ level: 6 }).run(), isActive: (e) => e.isActive('heading', { level: 6 }) },
    ]
  },
  {
    label: '列表',
    items: [
      { id: 'bulletList', label: '无序列表', icon: 'bulletList', action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive('bulletList') },
      { id: 'orderedList', label: '有序列表', icon: 'orderedList', action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
      { id: 'taskList', label: '任务列表', icon: 'taskList', action: (e) => e.chain().focus().toggleTaskList().run(), isActive: (e) => e.isActive('taskList') },
    ]
  },
  {
    label: '块元素',
    items: [
      { id: 'blockquote', label: '引用', icon: 'blockquote', action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive('blockquote') },
      { id: 'codeBlock', label: '代码块', icon: 'codeBlock', action: (e) => e.chain().focus().toggleCodeBlock().run(), isActive: (e) => e.isActive('codeBlock') },
      { id: 'horizontalRule', label: '分隔线', icon: 'horizontalRule', action: (e) => e.chain().focus().setHorizontalRule().run(), isActive: () => false },
    ]
  },
  {
    label: '编辑',
    items: [
      { id: 'cut', label: '剪切', icon: 'cut', action: () => document.execCommand('cut') },
      { id: 'copy', label: '复制', icon: 'copy', action: () => document.execCommand('copy') },
      { id: 'paste', label: '粘贴', icon: 'paste', action: () => document.execCommand('paste') },
      { id: 'selectAll', label: '全选', icon: 'selectAll', action: (e) => e.commands.selectAll() },
    ]
  },
  {
    label: '表格',
    items: [
      { id: 'insertTable', label: '插表格', icon: 'table', action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { id: 'addRowBefore', label: '上插行', icon: 'addRowBefore', action: (e) => e.chain().focus().addRowBefore().run() },
      { id: 'addRowAfter', label: '下插行', icon: 'addRowAfter', action: (e) => e.chain().focus().addRowAfter().run() },
      { id: 'addColumnBefore', label: '左插列', icon: 'addColumnBefore', action: (e) => e.chain().focus().addColumnBefore().run() },
      { id: 'addColumnAfter', label: '右插列', icon: 'addColumnAfter', action: (e) => e.chain().focus().addColumnAfter().run() },
      { id: 'deleteRow', label: '删行', icon: 'deleteRow', action: (e) => e.chain().focus().deleteRow().run() },
      { id: 'deleteColumn', label: '删列', icon: 'deleteColumn', action: (e) => e.chain().focus().deleteColumn().run() },
      { id: 'deleteTable', label: '删表', icon: 'deleteTable', action: (e) => e.chain().focus().deleteTable().run() },
      { id: 'mergeCells', label: '合并', icon: 'mergeCells', action: (e) => e.chain().focus().mergeCells().run() },
      { id: 'splitCell', label: '拆分', icon: 'splitCell', action: (e) => e.chain().focus().splitCell().run() },
    ]
  },
]

function ContextMenu({ editor, visible, position, onClose }) {
  const menuRef = useRef(null)
  const [adjustedPos, setAdjustedPos] = useState({ x: 0, y: 0 })

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

  const handleItemClick = (item) => {
    if (item.action) {
      item.action(editor)
      onClose()
    }
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
            <div className="context-menu-group-grid">
              {group.items.map((item) => {
                const active = item.isActive && item.isActive(editor)
                return (
                  <div
                    key={item.id}
                    className={`context-menu-item${active ? ' active' : ''}`}
                    onClick={() => handleItemClick(item)}
                    title={item.shortcut ? `${item.label} (${item.shortcut})` : item.label}
                  >
                    <span className="context-menu-item-icon">{ICONS[item.icon]}</span>
                    <span className="context-menu-item-label">{item.label}</span>
                  </div>
                )
              })}
            </div>
          </React.Fragment>
        ))}

      </div>
    </div>
  )
}

export default ContextMenu
