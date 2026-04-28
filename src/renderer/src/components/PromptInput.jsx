import React, { useState, useRef, useEffect, useCallback } from 'react'

function PromptInput({ visible, title, defaultValue, onSubmit, onCancel }) {
  const [value, setValue] = useState(defaultValue || '')
  const inputRef = useRef(null)

  useEffect(() => {
    if (visible) {
      setValue(defaultValue || '')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [visible, defaultValue])

  const handleSubmit = useCallback(() => {
    onSubmit(value.trim())
  }, [value, onSubmit])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSubmit()
    else if (e.key === 'Escape') onCancel()
  }, [handleSubmit, onCancel])

  if (!visible) return null

  return (
    <div className="toolbar-prompt-overlay" onClick={onCancel}>
      <div className="toolbar-prompt" onClick={e => e.stopPropagation()}>
        <span className="toolbar-prompt-title">{title}</span>
        <input
          ref={inputRef}
          className="toolbar-prompt-input"
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={defaultValue || ''}
        />
        <div className="toolbar-prompt-actions">
          <button className="toolbar-btn" onClick={onCancel}>取消</button>
          <button className="toolbar-btn" onClick={handleSubmit}>确定</button>
        </div>
      </div>
    </div>
  )
}

export default PromptInput
