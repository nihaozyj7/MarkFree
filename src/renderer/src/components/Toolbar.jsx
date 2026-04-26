import React, { useCallback } from 'react'

const TOOL_GROUPS = [
  [
    { id: 'bold', label: 'B', action: (e) => e.chain().focus().toggleBold().run(), isActive: (e) => e.isActive('bold'), style: { fontWeight: 'bold' } },
    { id: 'italic', label: 'I', action: (e) => e.chain().focus().toggleItalic().run(), isActive: (e) => e.isActive('italic'), style: { fontStyle: 'italic' } },
    { id: 'underline', label: 'U', action: (e) => e.chain().focus().toggleUnderline().run(), isActive: (e) => e.isActive('underline'), style: { textDecoration: 'underline' } },
    { id: 'strike', label: 'S', action: (e) => e.chain().focus().toggleStrike().run(), isActive: (e) => e.isActive('strike'), style: { textDecoration: 'line-through' } },
    { id: 'code', label: '<>', action: (e) => e.chain().focus().toggleCode().run(), isActive: (e) => e.isActive('code') }
  ],
  [
    { id: 'h1', label: 'H1', action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(), isActive: (e) => e.isActive('heading', { level: 1 }) },
    { id: 'h2', label: 'H2', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), isActive: (e) => e.isActive('heading', { level: 2 }) },
    { id: 'h3', label: 'H3', action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(), isActive: (e) => e.isActive('heading', { level: 3 }) }
  ],
  [
    { id: 'bulletList', label: '•', action: (e) => e.chain().focus().toggleBulletList().run(), isActive: (e) => e.isActive('bulletList') },
    { id: 'orderedList', label: '1.', action: (e) => e.chain().focus().toggleOrderedList().run(), isActive: (e) => e.isActive('orderedList') },
    { id: 'taskList', label: '☑', action: (e) => e.chain().focus().toggleTaskList().run(), isActive: (e) => e.isActive('taskList') }
  ],
  [
    { id: 'blockquote', label: '"', action: (e) => e.chain().focus().toggleBlockquote().run(), isActive: (e) => e.isActive('blockquote') },
    { id: 'codeBlock', label: '{}', action: (e) => e.chain().focus().toggleCodeBlock().run(), isActive: (e) => e.isActive('codeBlock') },
    { id: 'horizontalRule', label: '—', action: (e) => e.chain().focus().setHorizontalRule().run(), isActive: () => false }
  ],
  [
    { id: 'table', label: '⊞', action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), isActive: (e) => e.isActive('table') },
    { id: 'addRow', label: '⊞+', action: (e) => e.chain().focus().addRowAfter().run(), isActive: () => false },
    { id: 'addCol', label: '⊞|', action: (e) => e.chain().focus().addColumnAfter().run(), isActive: () => false }
  ],
  [
    { id: 'link', label: '🔗', action: (e) => {
      const url = window.prompt('输入链接 URL:')
      if (url) e.chain().focus().setLink({ href: url }).run()
    }, isActive: (e) => e.isActive('link') },
    { id: 'image', label: '🖼', action: (e) => {
      const url = window.prompt('输入图片 URL:')
      if (url) e.chain().focus().setImage({ src: url }).run()
    }, isActive: () => false }
  ]
]

function Toolbar({ editor, showPreview, onTogglePreview, onCopyMarkdown, onPasteMarkdown, onExportHtml }) {
  const handleUndo = useCallback(() => editor.chain().focus().undo().run(), [editor])
  const handleRedo = useCallback(() => editor.chain().focus().redo().run(), [editor])

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-groups">
          {TOOL_GROUPS.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <div className="toolbar-divider" />}
              <div className="toolbar-group">
                {group.map((item) => (
                  <button
                    key={item.id}
                    className={`toolbar-btn ${item.isActive(editor) ? 'active' : ''}`}
                    onClick={() => item.action(editor)}
                    title={item.id}
                    style={item.style}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="toolbar-right">
        <button className="toolbar-btn" onClick={handleUndo} title="撤销">↩</button>
        <button className="toolbar-btn" onClick={handleRedo} title="重做">↪</button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={onCopyMarkdown} title="复制 Markdown">📋</button>
        <button className="toolbar-btn" onClick={onPasteMarkdown} title="粘贴 Markdown">📥</button>
        <button className="toolbar-btn" onClick={onExportHtml} title="导出 HTML">📄</button>
        <div className="toolbar-divider" />
        <button
          className={`toolbar-btn preview-toggle ${showPreview ? 'active' : ''}`}
          onClick={onTogglePreview}
          title="预览 Markdown 源码"
        >
          {showPreview ? '✕' : '👁'}
        </button>
      </div>
    </div>
  )
}

export default Toolbar
