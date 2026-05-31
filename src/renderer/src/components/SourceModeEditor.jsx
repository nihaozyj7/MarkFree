import React, { useEffect, useRef, memo } from 'react'

const SourceModeEditor = memo(function SourceModeEditor({ value, onChange }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleChange = (e) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart, selectionEnd, value: val } = e.target
      const newValue = val.substring(0, selectionStart) + '  ' + val.substring(selectionEnd)
      e.target.value = newValue
      e.target.selectionStart = e.target.selectionEnd = selectionStart + 2
      onChange(newValue)
    }
  }

  return (
    <div className="source-mode-container">
      <textarea
        ref={textareaRef}
        className="source-mode-editor"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  )
})

export default SourceModeEditor