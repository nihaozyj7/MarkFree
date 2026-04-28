import { useEffect, useRef } from 'react'
import { getSettings } from '../settings'
import { matchesShortcut } from '../utils'
import { DEFAULT_SETTINGS } from '../settings'

export function useKeyboardShortcuts({ handleNewFile, handleOpenFile, handleSaveFile, handleSaveAsFile, setSidebarVisible }) {
  const keyHandlersRef = useRef({})

  keyHandlersRef.current = {
    newFile: handleNewFile,
    open: handleOpenFile,
    save: handleSaveFile,
    saveAs: handleSaveAsFile
  }

  useEffect(() => {
    const settings = getSettings()
    const shortcuts = settings.shortcuts || DEFAULT_SETTINGS.shortcuts

    function handleKeyDown(e) {
      if (matchesShortcut(e, shortcuts.newFile)) {
        e.preventDefault()
        keyHandlersRef.current.newFile()
      } else if (matchesShortcut(e, shortcuts.open)) {
        e.preventDefault()
        keyHandlersRef.current.open()
      } else if (matchesShortcut(e, shortcuts.save)) {
        e.preventDefault()
        keyHandlersRef.current.save()
      } else if (matchesShortcut(e, shortcuts.saveAs)) {
        e.preventDefault()
        keyHandlersRef.current.saveAs()
      } else if (matchesShortcut(e, shortcuts.sidebarToggle || 'Ctrl+B')) {
        e.preventDefault()
        setSidebarVisible(v => !v)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setSidebarVisible])
}
