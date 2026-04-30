import React, { useState, useRef, useEffect, useCallback } from 'react'

function AICommandInput({ visible, selectedText, loading, error, onClose, onSubmit }) {
  const [prompt, setPrompt] = useState('')
  const inputRef = useRef(null)
  const prevLoading = useRef(false)

  useEffect(() => {
    if (visible) {
      setPrompt('')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => inputRef.current?.focus())
      })
    }
  }, [visible])

  useEffect(() => {
    if (prevLoading.current && !loading && !error && visible) {
      onClose()
    }
    prevLoading.current = loading
  }, [loading, error, visible, onClose])

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return
    onSubmit(trimmed)
  }, [prompt, loading, onSubmit])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      if (loading) return
      onClose()
    }
  }, [handleSubmit, loading, onClose])

  if (!visible) return null

  return (
    <div className="ai-command-overlay" onClick={loading ? undefined : onClose}>
      <div className="ai-command-card" onClick={e => e.stopPropagation()}>
        {selectedText ? (
          <div className="ai-command-selection-info">
            {`已选中 ${selectedText.length} 个字符`}
          </div>
        ) : (
          <div className="ai-command-selection-info ai-command-selection-info--muted">
            未选中文本，AI 将在光标处插入内容
          </div>
        )}
        {loading ? (
          <div className="ai-command-loading">
            <span className="ai-command-spinner" />
            <span>AI 处理中...</span>
          </div>
        ) : error ? (
          <div className="ai-command-error">
            <span>{error}</span>
            <div className="ai-command-error-actions">
              <button className="ai-command-btn ai-command-btn-primary" onClick={handleSubmit}>重试</button>
              <button className="ai-command-btn" onClick={onClose}>取消</button>
            </div>
          </div>
        ) : (
          <>
            <input
              ref={inputRef}
              className="ai-command-input"
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你想做什么..."
            />
            <div className="ai-command-hint">
              Enter 提交 · Esc 关闭
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AICommandInput
