import React, { useState, useEffect, useRef, useCallback, memo } from 'react'
import { BubbleMenu } from '@tiptap/react'

function getSettingsRef() {
  try {
    const raw = localStorage.getItem('editorSettings')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

const LinkBubbleMenu = memo(function LinkBubbleMenu({ editor, onNavigateAnchor }) {
  const [editUrl, setEditUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [currentHref, setCurrentHref] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!editor) return
    const updateHref = () => {
      const href = editor.getAttributes('link').href || ''
      setCurrentHref(href)
    }
    updateHref()
    editor.on('selectionUpdate', updateHref)
    editor.on('transaction', updateHref)
    return () => {
      editor.off('selectionUpdate', updateHref)
      editor.off('transaction', updateHref)
    }
  }, [editor])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = useCallback(() => {
    setEditUrl(currentHref || '')
    setIsEditing(true)
  }, [currentHref])

  const handleSave = useCallback(() => {
    if (editor) {
      if (editUrl) {
        editor.chain().focus().setLink({ href: editUrl }).run()
      } else {
        editor.chain().focus().unsetLink().run()
      }
    }
    setIsEditing(false)
  }, [editUrl, editor])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }, [handleSave])

  const handleRemove = useCallback(() => {
    if (editor) {
      editor.chain().focus().unsetLink().run()
    }
  }, [editor])

  const handleOpen = useCallback(() => {
    if (!currentHref) return
    if (currentHref.startsWith('#')) {
      if (onNavigateAnchor) onNavigateAnchor(currentHref.slice(1))
      return
    }
    const settings = getSettingsRef()
    const linkOpenMode = settings.linkOpenMode || 'defaultBrowser'
    window.electronAPI.openLink(currentHref, linkOpenMode, '').catch(err => {
      console.error('打开链接失败:', err)
    })
  }, [currentHref, onNavigateAnchor])

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state }) => {
        const { from } = state.selection
        if (from === undefined) return false
        try {
          const marks = state.doc.resolve(from).marks()
          return marks.some(m => m.type.name === 'link')
        } catch { return false }
      }}
      tippyOptions={{
        duration: 150,
        maxWidth: 420,
        interactive: true
      }}
    >
      <div className="link-bubble-menu">
        {isEditing ? (
          <div className="link-bubble-edit">
            <input
              ref={inputRef}
              type="text"
              className="link-bubble-input"
              value={editUrl}
              onChange={e => setEditUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入链接 URL"
            />
            <button className="link-bubble-btn link-bubble-btn-save" onClick={handleSave} title="保存">&#10003;</button>
          </div>
        ) : (
          <div className="link-bubble-view">
            <span className="link-bubble-url" title={currentHref} onClick={handleOpen}>
              {currentHref}
            </span>
            <button className="link-bubble-btn" onClick={handleEdit} title="编辑链接">&#9998;</button>
            <button className="link-bubble-btn link-bubble-btn-remove" onClick={handleRemove} title="移除链接">&#10005;</button>
          </div>
        )}
      </div>
    </BubbleMenu>
  )
})

export default LinkBubbleMenu