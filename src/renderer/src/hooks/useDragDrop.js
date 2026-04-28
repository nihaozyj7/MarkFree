import { useState, useEffect } from 'react'

export function useDragDrop(editor, addTabRef) {
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!editor) return

    let dragCounter = 0

    const handleDragEnter = (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter++
      if (dragCounter === 1) setDragOver(true)
    }

    const handleDragOver = (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'
    }

    const handleDragLeave = (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter--
      if (dragCounter === 0) setDragOver(false)
    }

    const handleDrop = async (e) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter = 0
      setDragOver(false)

      const file = e.dataTransfer.files[0]
      if (!file || !/\.md$|\.markdown$/i.test(file.name)) return

      const droppedPath = window.electronAPI.getPendingDropPath() || file.path || ''

      const reader = new FileReader()
      reader.onload = (event) => {
        addTabRef.current?.({ content: event.target.result, filePath: droppedPath, fileName: file.name })
      }
      reader.readAsText(file)
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [editor, addTabRef])

  return dragOver
}
