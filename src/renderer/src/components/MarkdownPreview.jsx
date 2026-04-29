import React, { memo } from 'react'

const MarkdownPreview = memo(function MarkdownPreview({ content, onCopy }) {
  return (
    <div className="preview-area">
      <div className="preview-header">
        <span>Markdown 源码</span>
        <button
          className="preview-copy-btn"
          onClick={onCopy}
          title="复制 Markdown"
        >
          📋
        </button>
      </div>
      <pre className="preview-content">
        <code>{content}</code>
      </pre>
    </div>
  )
})

export default MarkdownPreview
