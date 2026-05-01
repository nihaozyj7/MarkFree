import React, { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import { setImageFileDir } from './extensions/CustomImage'
import { extensions } from './config/editor'
import Toolbar from './components/Toolbar'
import TitleBar from './components/TitleBar'
import StatusBar from './components/StatusBar'
import Sidebar from './components/Sidebar'
import WelcomePage from './components/WelcomePage'
import MarkdownPreview from './components/MarkdownPreview'
import ErrorBoundary from './components/ErrorBoundary'
import { DEFAULT_SETTINGS, getSettings, saveSettings, applyFontSettings } from './settings'
import { dirname } from './utils'
import { readImageFromFile, insertImageToEditor } from './utils/imageHandler'
import { useTabManager } from './hooks/useTabManager'
import { useDragDrop } from './hooks/useDragDrop'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useFolderActions } from './hooks/useFolderActions'

const SettingsDialog = lazy(() => import('./components/SettingsDialog'))
const AboutDialog = lazy(() => import('./components/AboutDialog'))
const ContextMenu = lazy(() => import('./components/ContextMenu'))
const AICommandInput = lazy(() => import('./components/AICommandInput'))

import 'katex/dist/katex.min.css'
import './styles/editor.css'

function App() {
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('appTheme') || 'dark')
  const [hwAccel, setHwAccel] = useState('auto')
  const [defaultOpenPath, setDefaultOpenPath] = useState('')
  const [windowMode, setWindowMode] = useState('center')
  const [windowBounds, setWindowBounds] = useState({ x: 0, y: 0, width: 1200, height: 800 })
  const [spellcheck, setSpellcheck] = useState(() => getSettings().spellcheck !== false)
  const [showToolbar, setShowToolbar] = useState(() => getSettings().showToolbar !== false)
  const [showOpenFilesModule, setShowOpenFilesModule] = useState(() => getSettings().showOpenFilesModule !== false)
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [folderTree, setFolderTree] = useState(null)
  const [currentFolderPath, setCurrentFolderPath] = useState('')
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })
  const [showAbout, setShowAbout] = useState(false)
  const [compactMode, setCompactMode] = useState(() => getSettings().compactMode === true)
  const [sidebarWidth, setSidebarWidth] = useState(() => getSettings().sidebarWidth || 220)
  const [fileTreeMode, setFileTreeMode] = useState(() => getSettings().fileTreeMode || 'loose')
  const [folderSortMode, setFolderSortMode] = useState(() => getSettings().folderSortMode || 'foldersFirst-createTime')
  const [renameTargetPath, setRenameTargetPath] = useState(null)
  const [renameTargetValue, setRenameTargetValue] = useState('')
  const [aiInputVisible, setAIInputVisible] = useState(false)
  const [aiSelectedText, setAISelectedText] = useState('')
  const [aiInsertPos, setAIInsertPos] = useState(null)
  const [aiLoading, setAILoading] = useState(false)
  const [aiError, setAIError] = useState(null)
  const settingsRef = useRef(getSettings())
  const contentRef = useRef('')
  const filePathRef = useRef('')
  const saveAsFileRef = useRef()
  const editorRef = useRef(null)
  const debounceRef = useRef(null)
  const skipAppCloseConfirmRef = useRef(false)

  const {
    tabs, setTabs,
    activeTabId, setActiveTabId,
    activeTabIdRef, tabsRef,
    activeTab, fileName, filePath, modified,
    addTab, addTabRef, closeTab, switchTab
  } = useTabManager(settingsRef, contentRef, editorRef, currentFolderPath, skipAppCloseConfirmRef)

  useEffect(() => {
    filePathRef.current = filePath
    setImageFileDir(filePath ? dirname(filePath) : '')
  }, [filePath])

  const onUpdate = useCallback(({ editor }) => {
    const tabId = activeTabIdRef.current
    if (!tabId) return

    let md = editor.storage.markdown.getMarkdown()
    contentRef.current = md

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (activeTabIdRef.current !== tabId) return
      setMarkdownContent(md)
      setTabs(prev => {
        const currentTab = prev.find(t => t.id === tabId)
        if (!currentTab) return prev
        const isModified = md !== currentTab.savedContent
        return prev.map(t =>
          t.id === tabId ? { ...t, content: md, modified: isModified } : t
        )
      })
    }, 150)
  }, [])

  const editor = useEditor({
    extensions,
    editorProps: {
      scrollThreshold: { bottom: 150 },
      scrollMargin: { bottom: 300 },
      attributes: {
        class: 'prose-editor',
        spellcheck: spellcheck ? 'true' : 'false'
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          const { state, dispatch } = view
          const { selection, schema } = state
          const { $from } = selection
          const pos = $from.after($from.depth)
          const paragraph = schema.nodes.paragraph.create()
          const tr = state.tr.insert(pos, paragraph)
          tr.setSelection(TextSelection.create(tr.doc, pos + 1))
          dispatch(tr)
          return true
        }

        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          const { state } = view
          const { selection } = state
          if (selection.empty) {
            const marks = selection.$from.marks()
            if (marks.length > 0) {
              const node = selection.$from.parent
              if (node.isTextblock && node.content.size === 0) {
                event.preventDefault()
                let tr = state.tr
                marks.forEach(m => { tr = tr.removeStoredMark(m) })
                view.dispatch(tr)
                return true
              }
            }
          }
        }

        if (event.ctrlKey || event.metaKey) {
          const key = event.key.toLowerCase()
          if (key === 'n' && !event.shiftKey) return true
          if (key === 'o' && !event.shiftKey) return true
          if (key === 's') return true
          if (key === 'b' && !event.shiftKey) return true
          if (key === 'k' && !event.shiftKey) {
            event.preventDefault()
            const { state } = view
            const { selection } = state
            const { from, to } = selection
            const text = selection.empty ? '' : state.doc.textBetween(from, to)
            setAISelectedText(text)
            setAIInsertPos(selection.empty ? from : { from, to })
            setAIInputVisible(true)
            setAIError(null)
            return true
          }
          return false
        }
        return false
      },
      handleClick: (view, pos, event) => {
        const { doc, schema } = view.state
        const docEnd = doc.content.size
        if (pos === docEnd) {
          const lastChild = doc.lastChild
          if (lastChild && !lastChild.isTextblock) {
            const tr = view.state.tr
            const paragraph = schema.nodes.paragraph.create()
            tr.insert(docEnd, paragraph)
            tr.setSelection(TextSelection.create(tr.doc, docEnd + 1))
            view.dispatch(tr)
            return true
          }
        }
        return false
      },
      handleDOMEvents: {
        click: (view, event) => {
          if (!event.ctrlKey && !event.metaKey) return false
          const target = event.target.closest('a')
          if (!target) return false
          const href = target.getAttribute('href')
          if (!href) return false
          event.preventDefault()
          event.stopPropagation()
          const linkOpenMode = settingsRef.current.linkOpenMode || 'defaultBrowser'
          const baseDir = filePathRef.current ? dirname(filePathRef.current) : ''
          window.electronAPI.openLink(href, linkOpenMode, baseDir).catch(err => {
            console.error('打开链接失败:', err)
          })
          return true
        },
        mousedown: (view, event) => {
          if (event.target === view.dom) {
            const { doc, schema } = view.state
            const firstChild = doc.firstChild
            if (firstChild && !firstChild.isTextblock) {
              const coords = view.coordsAtPos(0)
              if (coords && event.clientY < coords.top) {
                const tr = view.state.tr
                tr.insert(0, schema.nodes.paragraph.create())
                tr.setSelection(TextSelection.create(tr.doc, 1))
                view.dispatch(tr)
                return true
              }
            }
          }
          return false
        }
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        const imageItems = []
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (!item.type.startsWith('image/')) continue
          const file = item.getAsFile()
          if (file) imageItems.push(file)
        }
        if (imageItems.length === 0) return false

        event.preventDefault()
        for (const file of imageItems) {
          readImageFromFile(file).then(({ base64Data, mime, ext }) => {
            const ed = editorRef.current
            if (!ed) return
            insertImageToEditor(ed, {
              base64Data, mime, ext,
              settings: settingsRef.current,
              filePath: filePathRef.current
            })
          })
        }
        return true
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const imageFiles = [...files].filter(f => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false

        event.preventDefault()
        for (const file of imageFiles) {
          readImageFromFile(file).then(({ base64Data, mime, ext }) => {
            const ed = editorRef.current
            if (!ed) return
            insertImageToEditor(ed, {
              base64Data, mime, ext,
              settings: settingsRef.current,
              filePath: filePathRef.current
            })
          })
        }
        return true
      }
    },
    onUpdate
  })

  editorRef.current = editor

  const dragOver = useDragDrop(editor, addTabRef)

  const syncRef = useCallback(() => {
    if (editor) {
      const md = editor.storage.markdown.getMarkdown()
      setMarkdownContent(md)
      contentRef.current = md
    }
  }, [editor])

  useEffect(() => {
    syncRef()
  }, [syncRef])

  useEffect(() => {
    window.electronAPI.setTitle(
      `${modified ? '* ' : ''}${fileName || tabs[0]?.fileName || 'MarkFree'}  - MarkFree`
    )
  }, [fileName, modified, tabs])

  useEffect(() => {
    if (!editor) return
    const currentTabs = tabsRef.current
    const tab = currentTabs.find(t => t.id === activeTabId)
    if (!tab) {
      contentRef.current = ''
      setMarkdownContent('')
      editor.commands.setContent('')
      return
    }
    const md = tab.content || ''
    contentRef.current = md
    setMarkdownContent(md)
    editor.commands.setContent(md || '')
    editor.commands.focus()
  }, [activeTabId, editor])

  useEffect(() => {
    if (!editor) return
    window.electronAPI.onFileOpened((data) => {
      addTabRef.current(data)
    })
    window.electronAPI.onFolderOpened(async (data) => {
      try {
        const { folderPath } = data
        setCurrentFolderPath(folderPath)
        const tree = await window.electronAPI.getFolderTree(folderPath)
        setFolderTree(tree)
        setSidebarVisible(true)
      } catch (err) {
        console.error('打开文件夹失败:', err)
      }
    })
    return () => {
      window.electronAPI.removeFileOpenedListener()
      window.electronAPI.removeFolderOpenedListener()
    }
  }, [editor])

  useEffect(() => {
    window.electronAPI.onBeforeAppClose(() => {
      if (skipAppCloseConfirmRef.current) {
        skipAppCloseConfirmRef.current = false
        window.electronAPI.confirmAppClose()
        return
      }

      const allTabs = tabsRef.current
      const unsavedTabs = allTabs.filter(t => t.modified)

      if (unsavedTabs.length === 0) {
        window.electronAPI.confirmAppClose()
        return
      }

      const currentSettings = settingsRef.current
      if (currentSettings.confirmBeforeCloseApp !== false) {
        if (confirm('有未保存的更改，确定关闭应用吗？')) {
          window.electronAPI.confirmAppClose()
        } else {
          window.electronAPI.cancelAppClose()
        }
        return
      }

      try {
        localStorage.setItem('cachedTabs', JSON.stringify(unsavedTabs))
      } catch (e) { console.error('缓存标签页失败:', e) }
      window.electronAPI.confirmAppClose()
    })
    return () => {
      window.electronAPI.removeBeforeAppCloseListener()
    }
  }, [])

  const handleOpenFile = useCallback(async () => {
    if (!editor) return
    const result = await window.electronAPI.openFile()
    if (result) addTab(result)
  }, [editor, addTab])

  const handleOpenMultipleFiles = useCallback(async () => {
    const results = await window.electronAPI.openMultipleFiles()
    if (results && results.length > 0) {
      for (const r of results) addTab(r)
    }
  }, [addTab])

  const handleOpenFolder = useCallback(async () => {
    try {
      const folderPath = await window.electronAPI.openFolder()
      if (!folderPath) return
      setCurrentFolderPath(folderPath)
      const tree = await window.electronAPI.getFolderTree(folderPath)
      setFolderTree(tree)
      setSidebarVisible(true)
    } catch (err) {
      console.error('打开文件夹失败:', err)
    }
  }, [])

  const handleSaveFile = useCallback(async () => {
    if (!editor) return
    const tabId = activeTabIdRef.current
    const tab = tabsRef.current.find(t => t.id === tabId)
    if (!tab) return

    try {
      const currentPath = tab.filePath
      if (!currentPath) {
        return saveAsFileRef.current?.()
      }
      const md = contentRef.current
      const result = await window.electronAPI.saveFile(md, currentPath)
      if (result) {
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, filePath: result.filePath, fileName: result.fileName, content: md, modified: false, savedContent: md } : t
        ))
      }
    } catch (err) {
      alert('保存失败: ' + (err.message || err))
    }
  }, [editor])

  const handleSaveAsFile = useCallback(async () => {
    if (!editor) return
    const tabId = activeTabIdRef.current
    const tab = tabsRef.current.find(t => t.id === tabId)
    if (!tab) return

    try {
      const md = contentRef.current
      const result = await window.electronAPI.saveAsFile(md)
      if (result) {
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, filePath: result.filePath, fileName: result.fileName, content: md, modified: false, savedContent: md } : t
        ))
      }
    } catch (err) {
      alert('另存失败: ' + (err.message || err))
    }
  }, [editor])

  saveAsFileRef.current = handleSaveAsFile

  const handleInsertImage = useCallback(async () => {
    if (!editor) return
    try {
      const result = await window.electronAPI.selectImageFile()
      if (!result) return
      if (result.error) {
        alert('选择图片失败: ' + result.error)
        return
      }

      await insertImageToEditor(editor, {
        base64Data: result.base64,
        mime: result.mime,
        ext: result.ext,
        settings: settingsRef.current,
        filePath: filePathRef.current
      })
    } catch (err) {
      alert('插入图片失败: ' + (err.message || err))
    }
  }, [editor])

  const handleExportHtml = useCallback(() => {
    if (editor) {
      const blob = new Blob([editor.getHTML()], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'export.html'
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [editor])

  const handleOpenSettings = useCallback(() => {
    setShowSettings(true)
  }, [])

  const handleNewFile = useCallback(() => {
    addTab({ content: '', filePath: '', fileName: '未命名' })
  }, [addTab])

  const handleCopyMarkdown = useCallback(() => {
    if (editor) {
      const md = editor.storage.markdown.getMarkdown()
      navigator.clipboard.writeText(md)
    }
  }, [editor])

  const handlePasteMarkdown = useCallback(async () => {
    if (editor) {
      const text = await navigator.clipboard.readText()
      if (text) editor.chain().focus().insertContent(text).run()
    }
  }, [editor])

  const menuActionRefs = useRef({})
  menuActionRefs.current = {
    handleNewFile, handleOpenFile, handleOpenFolder, handleSaveFile, handleSaveAsFile,
    handleExportHtml, handleCopyMarkdown, handlePasteMarkdown,
    handleOpenSettings
  }
  const handleMenuAction = useCallback((action) => {
    switch (action) {
      case 'newFile': menuActionRefs.current.handleNewFile(); break
      case 'open': menuActionRefs.current.handleOpenFile(); break
      case 'openFolder': menuActionRefs.current.handleOpenFolder(); break
      case 'save': menuActionRefs.current.handleSaveFile(); break
      case 'saveAs': menuActionRefs.current.handleSaveAsFile(); break
      case 'exportHtml': menuActionRefs.current.handleExportHtml(); break
      case 'copyMarkdown': menuActionRefs.current.handleCopyMarkdown(); break
      case 'pasteMarkdown': menuActionRefs.current.handlePasteMarkdown(); break
      case 'settings': menuActionRefs.current.handleOpenSettings(); break
      case 'about': setShowAbout(true); break
    }
  }, [])

  const handleToggleSidebar = useCallback(() => {
    setSidebarVisible(v => !v)
  }, [])

  const handleToggleCompactMode = useCallback(() => {
    setCompactMode(prev => {
      const next = !prev
      try {
        const merged = saveSettings({ compactMode: next })
        settingsRef.current.compactMode = next
      } catch (e) { console.error('保存紧凑模式设置失败:', e) }
      return next
    })
  }, [])

  const handleAICommand = useCallback(() => {
    const ed = editorRef.current
    if (!ed) return
    const { state } = ed
    const { selection } = state
    const { from, to } = selection
    const text = selection.empty ? '' : state.doc.textBetween(from, to)
    setAISelectedText(text)
    setAIInsertPos(selection.empty ? from : { from, to })
    setAIInputVisible(true)
    setAIError(null)
  }, [])

  const handleSidebarWidthChange = useCallback((width) => {
    setSidebarWidth(width)
    try {
      saveSettings({ sidebarWidth: width })
      settingsRef.current.sidebarWidth = width
    } catch (e) { console.error('保存侧边栏宽度失败:', e) }
  }, [])

  const {
    handleSelectFolder,
    refreshFolderTree,
    handleCreateFileInFolder,
    handleCreateFolderInFolder,
    handleFolderSortModeChange,
    handleOpenFolderFile
  } = useFolderActions({
    currentFolderPath,
    setCurrentFolderPath,
    setFolderTree,
    setSidebarVisible,
    setRenameTargetPath,
    setRenameTargetValue,
    setFolderSortMode,
    addTab
  })

  const handleThemeChange = useCallback((themeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem('appTheme', themeName)
  }, [])

  const handleSaveSettings = useCallback((settings) => {
    setSpellcheck(settings.spellcheck !== false)
    setShowToolbar(settings.showToolbar !== false)
    setShowOpenFilesModule(settings.showOpenFilesModule !== false)
    setFileTreeMode(settings.fileTreeMode || 'loose')
    settingsRef.current = {
      ...settingsRef.current,
      spellcheck: settings.spellcheck,
      showToolbar: settings.showToolbar,
      showOpenFilesModule: settings.showOpenFilesModule,
      imageInsertMode: settings.imageInsertMode ?? settingsRef.current.imageInsertMode,
      imageFolder: settings.imageFolder ?? settingsRef.current.imageFolder,
      closeLastTabAction: settings.closeLastTabAction ?? settingsRef.current.closeLastTabAction,
      fontFamily: settings.fontFamily ?? settingsRef.current.fontFamily,
      fontSize: settings.fontSize ?? settingsRef.current.fontSize,
      compactMode: settings.compactMode ?? settingsRef.current.compactMode,
      fileTreeMode: settings.fileTreeMode ?? settingsRef.current.fileTreeMode,
      sidebarWidth: settings.sidebarWidth ?? settingsRef.current.sidebarWidth,
      startupBehavior: settings.startupBehavior ?? settingsRef.current.startupBehavior,
      shortcuts: settings.shortcuts ?? settingsRef.current.shortcuts,
      folderSortMode: settings.folderSortMode ?? settingsRef.current.folderSortMode,
      confirmBeforeCloseTab: settings.confirmBeforeCloseTab ?? settingsRef.current.confirmBeforeCloseTab,
      confirmBeforeCloseApp: settings.confirmBeforeCloseApp ?? settingsRef.current.confirmBeforeCloseApp,
      linkOpenMode: settings.linkOpenMode ?? settingsRef.current.linkOpenMode
    }
    applyFontSettings(settings)
  }, [])

  const handleHwAccelChange = useCallback((value) => {
    setHwAccel(value)
    window.electronAPI.saveAppSettings({ hardwareAcceleration: value }).catch(() => {})
  }, [])

  const handleDefaultOpenPathChange = useCallback((value) => {
    setDefaultOpenPath(value)
    window.electronAPI.saveAppSettings({ defaultOpenPath: value }).catch(() => {})
  }, [])

  const handleWindowModeChange = useCallback((value) => {
    setWindowMode(value)
    window.electronAPI.saveAppSettings({ windowMode: value }).catch(() => {})
  }, [])

  const handleWindowBoundsChange = useCallback((bounds) => {
    setWindowBounds(bounds)
    window.electronAPI.saveAppSettings({ windowBounds: bounds }).catch(() => {})
  }, [])

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const result = await window.electronAPI.loadTheme(currentTheme)
        if (result && result.css) {
          let el = document.getElementById('app-theme')
          if (!el) {
            el = document.createElement('style')
            el.id = 'app-theme'
            document.head.appendChild(el)
          }
          el.textContent = result.css
        }
      } catch (e) { console.error('加载主题失败:', e) }
    }
    loadTheme()
  }, [currentTheme])

  useEffect(() => {
    window.electronAPI.getAppSettings().then(s => {
      if (s && s.hardwareAcceleration) setHwAccel(s.hardwareAcceleration)
      if (s && s.defaultOpenPath) setDefaultOpenPath(s.defaultOpenPath)
      if (s && s.windowMode) setWindowMode(s.windowMode)
      if (s && s.windowBounds) setWindowBounds(s.windowBounds)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (editor?.view?.dom) {
      editor.view.dom.setAttribute('spellcheck', spellcheck ? 'true' : 'false')
    }
  }, [editor, spellcheck])

  useEffect(() => {
    const settings = getSettings()
    settingsRef.current = settings
    applyFontSettings(settings)
  }, [])

  useKeyboardShortcuts({ handleNewFile, handleOpenFile, handleSaveFile, handleSaveAsFile, setSidebarVisible })

  useEffect(() => {
    try {
      const cached = localStorage.getItem('cachedTabs')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTabs(prev => {
            if (prev.length === 1 && !prev[0].filePath && !prev[0].content && !prev[0].modified) {
              return parsed
            }
            return [...prev, ...parsed]
          })
          const lastTab = parsed[parsed.length - 1]
          if (lastTab) {
            activeTabIdRef.current = lastTab.id
            setActiveTabId(lastTab.id)
          }
        }
        localStorage.removeItem('cachedTabs')
      }
    } catch (e) { console.error('恢复缓存标签页失败:', e) }
  }, [])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY })
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0 })
  }, [])

  const handleTogglePreview = useCallback(() => {
    setShowPreview(prev => !prev)
  }, [])

  const handleAIClose = useCallback(() => {
    if (aiLoading) return
    setAIInputVisible(false)
    setAIError(null)
  }, [aiLoading])

  const handleAISubmit = useCallback(async (prompt) => {
    if (!editorRef.current) return
    const editor = editorRef.current
    setAILoading(true)
    setAIError(null)
    try {
      const result = await window.electronAPI.aiChat({
        prompt,
        selectedText: aiSelectedText || undefined
      })
      if (result.error) {
        setAIError(result.error)
        return
      }
      const content = result.content
      if (!content) {
        setAIError('AI 未返回内容')
        return
      }
      editor.chain().focus().insertContentAt(
        aiInsertPos || editor.state.selection.from,
        content
      ).run()
      setAIInputVisible(false)
      setAIError(null)
    } catch (err) {
      setAIError(err.message || 'AI 请求失败')
    } finally {
      setAILoading(false)
    }
  }, [aiSelectedText, aiInsertPos])

  const handleCopyPreview = useCallback(() => {
    navigator.clipboard.writeText(markdownContent)
  }, [markdownContent])

  const contextMenuPosition = useMemo(
    () => ({ x: contextMenu.x, y: contextMenu.y }),
    [contextMenu.x, contextMenu.y]
  )

  if (!editor) return null

  return (
    <ErrorBoundary>
    <Suspense fallback={null}>
    <div className={`app-container${dragOver ? ' drag-over' : ''}${compactMode ? ' compact' : ''}`}>
      <TitleBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onCloseTab={closeTab}
        onMenuAction={handleMenuAction}
        onAddTab={handleNewFile}
      />
      {tabs.length > 0 && showToolbar && (
        <Toolbar
          editor={editor}
          showPreview={showPreview}
          onTogglePreview={handleTogglePreview}
          onCopyMarkdown={handleCopyMarkdown}
          onPasteMarkdown={handlePasteMarkdown}
          onExportHtml={handleExportHtml}
          onInsertImage={handleInsertImage}
        />
      )}
      <div className="editor-wrapper">
        {sidebarVisible && (
          <Sidebar
            tabs={tabs}
            activeTabId={activeTabId}
            onSwitchTab={switchTab}
            folderTree={folderTree}
            folderPath={currentFolderPath}
            onOpenFolderFile={handleOpenFolderFile}
            onRefreshFolderTree={refreshFolderTree}
            showOpenFilesModule={showOpenFilesModule}
            activeFilePath={filePath}
            width={sidebarWidth}
            onWidthChange={handleSidebarWidthChange}
            onCreateFile={handleCreateFileInFolder}
            onCreateFolder={handleCreateFolderInFolder}
            renameTargetPath={renameTargetPath}
            renameTargetValue={renameTargetValue}
            onClearRenameTarget={() => setRenameTargetPath(null)}
            sortMode={folderSortMode}
            fileTreeMode={fileTreeMode}
          /> 
        )}
        {tabs.length > 0 ? (
          <>
            <div className={`editor-area ${showPreview ? 'split' : 'full'}`} onContextMenu={handleContextMenu}>
              <EditorContent editor={editor} className="editor-content" />
            </div>
            {showPreview && (
              <MarkdownPreview content={markdownContent} onCopy={handleCopyPreview} />
            )}
          </>
        ) : (
          <WelcomePage
            onNewFile={handleNewFile}
            onOpenFile={handleOpenFile}
            onOpenFolder={handleOpenFolder}
            onContextMenu={handleContextMenu}
          />
        )}
      </div>
      {dragOver && <div className="drag-overlay"><span>释放以打开 .md 文件</span></div>}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} currentTheme={currentTheme} onThemeChange={handleThemeChange} onSaveSettings={handleSaveSettings} hwAccel={hwAccel} onHwAccelChange={handleHwAccelChange} defaultOpenPath={defaultOpenPath} onDefaultOpenPathChange={handleDefaultOpenPathChange} windowMode={windowMode} windowBounds={windowBounds} onWindowModeChange={handleWindowModeChange} onWindowBoundsChange={handleWindowBoundsChange} folderSortMode={folderSortMode} onFolderSortModeChange={handleFolderSortModeChange} />}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
      {aiInputVisible && (
        <AICommandInput
          visible={aiInputVisible}
          selectedText={aiSelectedText}
          loading={aiLoading}
          error={aiError}
          onClose={handleAIClose}
          onSubmit={handleAISubmit}
        />
      )}
      <ContextMenu
        editor={editor}
        visible={contextMenu.visible}
        position={contextMenuPosition}
        onClose={closeContextMenu}
      />
      <StatusBar
        editor={editor}
        filePath={filePath}
        modified={modified}
        tabs={tabs}
        onToggleSidebar={handleToggleSidebar}
        sidebarVisible={sidebarVisible}
        compactMode={compactMode}
        onToggleCompactMode={handleToggleCompactMode}
        onAICommand={handleAICommand}
      />
    </div>
    </Suspense>
    </ErrorBoundary>
  )
}

export default App
