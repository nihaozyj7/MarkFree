import { useState, useCallback, useRef, useMemo } from 'react'
import { getSettings } from '../settings'
import { convertToAbsolutePaths } from '../utils'

export function useTabManager(settingsRef, contentRef, editorRef, currentFolderPath) {
  const defaultTabId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

  const [tabs, setTabs] = useState(() => {
    const settings = getSettings()
    if (settings.startupBehavior === 'welcome') return []
    return [{
      id: defaultTabId,
      fileName: '未命名',
      filePath: '',
      content: '',
      modified: false,
      savedContent: ''
    }]
  })
  const [activeTabId, setActiveTabId] = useState(() => {
    const settings = getSettings()
    return settings.startupBehavior === 'welcome' ? '' : defaultTabId
  })
  const activeTabIdRef = useRef(activeTabId)
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const activeTab = useMemo(
    () => tabs.find(t => t.id === activeTabId),
    [tabs, activeTabId]
  )
  const fileName = activeTab?.fileName ?? ''
  const filePath = activeTab?.filePath ?? ''
  const modified = activeTab?.modified ?? false

  const switchTab = useCallback((tabId) => {
    if (tabId === activeTabIdRef.current) return

    const prevId = activeTabIdRef.current
    if (prevId && editorRef.current) {
      const currentMd = contentRef.current
      setTabs(prev => prev.map(t =>
        t.id === prevId ? { ...t, content: currentMd } : t
      ))
    }

    activeTabIdRef.current = tabId
    setActiveTabId(tabId)
  }, [contentRef, editorRef])

  const closeTab = useCallback((tabId) => {
    const allTabs = tabsRef.current
    const idx = allTabs.findIndex(t => t.id === tabId)
    if (idx === -1) return
    const closingTab = allTabs[idx]
    const wouldBeEmpty = allTabs.length === 1

    const tabsWithUnsaved = allTabs.filter(t => t.modified)
    const hasUnsaved = closingTab.modified || (wouldBeEmpty && tabsWithUnsaved.length > 1)

    if (wouldBeEmpty) {
      if (currentFolderPath) {
        if (hasUnsaved && !confirm('有未保存的更改，确定关闭吗？')) return
        setTabs([])
        activeTabIdRef.current = ''
        setActiveTabId('')
        return
      }
      const settings = settingsRef.current
      if (settings.closeLastTabAction === 'closeApp') {
        if (closingTab.modified && !confirm('有未保存的更改，确定关闭应用吗？')) return
        window.electronAPI.closeWindow()
        return
      }
      if (closingTab.modified && !confirm('有未保存的更改，确定关闭标签页吗？')) return
      setTabs([])
      activeTabIdRef.current = ''
      setActiveTabId('')
      return
    }

    if (closingTab.modified && !confirm('有未保存的更改，确定关闭标签页吗？')) return

    const newTabs = allTabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    if (tabId === activeTabIdRef.current) {
      const nextIdx = Math.min(idx, newTabs.length - 1)
      activeTabIdRef.current = newTabs[nextIdx].id
      setActiveTabId(newTabs[nextIdx].id)
    }
  }, [settingsRef, currentFolderPath])

  const addTabRef = useRef()
  const addTab = useCallback((fileData) => {
    if (!fileData) return null

    const { content, filePath: fp, fileName: fn } = fileData

    if (fp) {
      const existing = tabsRef.current.find(t => t.filePath === fp)
      if (existing) {
        switchTab(existing.id)
        return existing.id
      }
    }

    let processedContent = content || ''
    const settings = settingsRef.current
    if (settings.imageInsertMode === 'relative' && fp) {
      processedContent = convertToAbsolutePaths(processedContent, fp, settings.imageFolder)
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const newTab = {
      id,
      fileName: fn || '未命名',
      filePath: fp || '',
      content: processedContent,
      modified: false,
      savedContent: processedContent
    }

    setTabs(prev => {
      const onlyTab = prev.length === 1 ? prev[0] : null
      if (onlyTab && !onlyTab.filePath && !onlyTab.content && !onlyTab.modified) {
        return [newTab]
      }
      return [...prev, newTab]
    })
    activeTabIdRef.current = id
    setActiveTabId(id)
    return id
  }, [settingsRef, switchTab])

  addTabRef.current = addTab

  return {
    tabs, setTabs,
    activeTabId, setActiveTabId,
    activeTabIdRef, tabsRef,
    activeTab, fileName, filePath, modified,
    addTab, addTabRef, closeTab, switchTab
  }
}
