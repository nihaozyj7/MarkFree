import React, { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import Toolbar from './components/Toolbar'
import TitleBar from './components/TitleBar'
import StatusBar from './components/StatusBar'
import Sidebar from './components/Sidebar'

const SettingsDialog = lazy(() => import('./components/SettingsDialog'))
const AboutDialog = lazy(() => import('./components/AboutDialog'))
const ContextMenu = lazy(() => import('./components/ContextMenu'))

import './styles/editor.css'

const lowlight = createLowlight()

const LANGUAGE_LOADERS = {
  javascript: () => import('highlight.js/lib/languages/javascript'),
  typescript: () => import('highlight.js/lib/languages/typescript'),
  python: () => import('highlight.js/lib/languages/python'),
  xml: () => import('highlight.js/lib/languages/xml'),
  css: () => import('highlight.js/lib/languages/css'),
  json: () => import('highlight.js/lib/languages/json'),
  bash: () => import('highlight.js/lib/languages/bash'),
  markdown: () => import('highlight.js/lib/languages/markdown'),
  sql: () => import('highlight.js/lib/languages/sql'),
  yaml: () => import('highlight.js/lib/languages/yaml'),
  rust: () => import('highlight.js/lib/languages/rust'),
  go: () => import('highlight.js/lib/languages/go'),
  java: () => import('highlight.js/lib/languages/java')
}

const languageCache = {}
let languageInitDone = false

async function ensureLanguage(name) {
  if (languageCache[name]) return
  const loader = LANGUAGE_LOADERS[name]
  if (!loader) return
  try {
    const mod = await loader()
    languageCache[name] = true
    lowlight.register(name, mod.default)
  } catch {}
}

function initLanguages() {
  if (languageInitDone) return
  languageInitDone = true
  ensureLanguage('javascript')
  ensureLanguage('typescript')
  ensureLanguage('python')
  ensureLanguage('css')
  ensureLanguage('json')
  ensureLanguage('bash')
  ensureLanguage('xml')
  ensureLanguage('markdown')
  ensureLanguage('sql')
}

initLanguages()

function dirname(path) {
  const parts = path.replace(/\\/g, '/').replace(/\/+$/, '').split('/')
  parts.pop()
  return parts.join('/')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const regexCache = {}

function getCachedRegex(pattern, key) {
  const entry = regexCache[key]
  if (entry && entry.pattern === pattern) return entry.regex
  const regex = new RegExp(pattern, 'g')
  regexCache[key] = { pattern, regex }
  return regex
}

function convertToRelativePaths(md, filePath, imageFolder) {
  const fileDir = dirname(filePath)
  const folder = imageFolder.replace(/\\/g, '/').replace(/^\.\//, '')
  const resolvedDir = fileDir + '/' + folder
  const platform = window.electronAPI.platform
  const prefix = platform === 'win32' ? 'file:///' : 'file://'
  const fullPrefix = prefix + resolvedDir
  const escaped = escapeRegex(fullPrefix)
  const cacheKey = `rel:${escaped}`

  return md.replace(
    getCachedRegex('\\]\\(' + escaped + '/([^)]+)\\)', cacheKey),
    (match, filename) => `](./${folder}/${filename})`
  )
}

function convertToAbsolutePaths(md, filePath, imageFolder) {
  const fileDir = dirname(filePath)
  const folder = imageFolder.replace(/\\/g, '/').replace(/^\.\//, '')
  const resolvedDir = fileDir + '/' + folder
  const platform = window.electronAPI.platform
  const prefix = platform === 'win32' ? 'file:///' : 'file://'
  const fullPrefix = prefix + resolvedDir
  const escaped = escapeRegex(folder)
  const cacheKey = `abs:${escaped}`

  return md.replace(
    getCachedRegex('\\]\\((\\./)?' + escaped + '/([^)]+)\\)', cacheKey),
    (match, dotSlash, filename) => `](${fullPrefix}/${filename})`
  )
}

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets',
  spellcheck: true,
  closeLastTabAction: 'closeApp',
  showToolbar: true,
  showOpenFilesModule: true,
  fontFamily: 'default',
  fontSize: 16,
  compactMode: false,
  sidebarWidth: 220,
  shortcuts: {
    newFile: 'Ctrl+N',
    open: 'Ctrl+O',
    save: 'Ctrl+S',
    saveAs: 'Ctrl+Shift+S',
    sidebarToggle: 'Ctrl+B'
  }
}

function getSettings() {
  try {
    const saved = localStorage.getItem('editorSettings')
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function applyFontSettings(settings) {
  const fontFamily = settings.fontFamily && settings.fontFamily !== 'default'
    ? settings.fontFamily
    : 'inherit'
  const fontSize = settings.fontSize || 16
  let el = document.getElementById('editor-font')
  if (!el) {
    el = document.createElement('style')
    el.id = 'editor-font'
    document.head.appendChild(el)
  }
  el.textContent = `.ProseMirror { font-family: ${fontFamily} !important; font-size: ${fontSize}px !important; }`
}

const extensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [1, 2, 3, 4, 5, 6] }
  }),
  Underline,
  Image.configure({ inline: true, allowBase64: true }),
  Link.configure({ openOnClick: false }),
  Placeholder.configure({ placeholder: '开始写作...' }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({ resizable: true }),
  TableRow,
  TableCell,
  TableHeader,
  CodeBlockLowlight.configure({ lowlight }),
  Markdown.configure({
    html: true,
    transformPastedText: true,
    transformCopiedText: true
  })
]

function parseShortcut(shortcut) {
  const parts = shortcut.split('+')
  return {
    ctrl: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
    key: parts[parts.length - 1]?.toLowerCase()
  }
}

function matchesShortcut(e, shortcut) {
  const s = parseShortcut(shortcut)
  return (e.ctrlKey || e.metaKey) === s.ctrl
    && e.shiftKey === s.shift
    && e.altKey === s.alt
    && e.key.toLowerCase() === s.key
}

function App() {
  const defaultTabId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

  const [tabs, setTabs] = useState(() => [{
    id: defaultTabId,
    fileName: '未命名',
    filePath: '',
    content: '',
    modified: false,
    savedContent: ''
  }])
  const [activeTabId, setActiveTabId] = useState(defaultTabId)
  const activeTabIdRef = useRef(activeTabId)

  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [dragOver, setDragOver] = useState(false)
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
  const [folderFiles, setFolderFiles] = useState([])
  const [currentFolderPath, setCurrentFolderPath] = useState('')
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })
  const [showAbout, setShowAbout] = useState(false)
  const [compactMode, setCompactMode] = useState(() => getSettings().compactMode === true)
  const [sidebarWidth, setSidebarWidth] = useState(() => getSettings().sidebarWidth || 220)
  const settingsRef = useRef(getSettings())
  const contentRef = useRef('')
  const filePathRef = useRef('')
  const saveAsFileRef = useRef()
  const editorRef = useRef(null)
  const debounceRef = useRef(null)

  const activeTab = useMemo(
    () => tabs.find(t => t.id === activeTabId),
    [tabs, activeTabId]
  )
  const fileName = activeTab?.fileName ?? ''
  const filePath = activeTab?.filePath ?? ''
  const modified = activeTab?.modified ?? false

  useEffect(() => {
    filePathRef.current = filePath
  }, [filePath])

  const onUpdate = useCallback(({ editor }) => {
    const tabId = activeTabIdRef.current
    if (!tabId) return

    let md = editor.storage.markdown.getMarkdown()
    const settings = settingsRef.current
    const fp = filePathRef.current
    if (settings.imageInsertMode === 'relative' && fp) {
      md = convertToRelativePaths(md, fp, settings.imageFolder)
    }
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
          return false
        }
        return false
      },
      handleClick: (view, pos, event) => {
        const { doc, schema } = view.state
        const docEnd = doc.content.size
        if (pos >= docEnd - 1) {
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

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (!item.type.startsWith('image/')) continue

          event.preventDefault()
          const file = item.getAsFile()
          if (!file) return true

          const reader = new FileReader()
          reader.onload = async (e) => {
            const result = e.target.result
            const base64Data = result.split(',')[1]

            const MIME_MAP_EXT = {
              'image/png': '.png', 'image/jpeg': '.jpg',
              'image/gif': '.gif', 'image/webp': '.webp',
              'image/bmp': '.bmp', 'image/svg+xml': '.svg'
            }
            const ext = MIME_MAP_EXT[file.type] || '.png'

            const settings = settingsRef.current
            const { imageInsertMode, imageFolder } = settings

            const ed = editorRef.current
            if (!ed) return

            if (imageInsertMode === 'base64') {
              const src = `data:${file.type};base64,${base64Data}`
              ed.chain().focus().setImage({ src }).run()
              return
            }

            if (imageInsertMode === 'relative') {
              const fp = filePathRef.current
              if (!fp) {
                alert('请先保存文件再插入相对路径图片')
                return
              }
              const saveResult = await window.electronAPI.saveImageToDisk({
                base64Data, ext, folderPath: imageFolder, fileDir: dirname(fp)
              })
              if (!saveResult || saveResult.error) return

              const platform = window.electronAPI.platform
              const prefix = platform === 'win32' ? 'file:///' : 'file://'
              const src = prefix + saveResult.absolutePath.replace(/\\/g, '/')
              ed.chain().focus().setImage({ src }).run()
              return
            }

            const fp = filePathRef.current
            const saveResult = await window.electronAPI.saveImageToDisk({
              base64Data, ext, folderPath: imageFolder, fileDir: fp ? dirname(fp) : ''
            })
            if (!saveResult || saveResult.error) return
            const platform = window.electronAPI.platform
            const prefix = platform === 'win32' ? 'file:///' : 'file://'
            const src = prefix + saveResult.absolutePath.replace(/\\/g, '/')
            ed.chain().focus().setImage({ src }).run()
          }
          reader.readAsDataURL(file)
          return true
        }
        return false
      }
    },
    onUpdate
  })

  editorRef.current = editor

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
      `${modified ? '* ' : ''}${fileName || tabs[0]?.fileName || 'MarkdownPad'}  - MarkdownPad`
    )
  }, [fileName, modified])

  useEffect(() => {
    if (!editor) return
    const tab = tabs.find(t => t.id === activeTabId)
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

  const switchTab = useCallback((tabId) => {
    if (tabId === activeTabIdRef.current) return

    const prevId = activeTabIdRef.current
    if (prevId && editor) {
      const currentMd = contentRef.current
      setTabs(prev => prev.map(t =>
        t.id === prevId ? { ...t, content: currentMd } : t
      ))
    }

    activeTabIdRef.current = tabId
    setActiveTabId(tabId)
  }, [editor])

  const closeTab = useCallback((tabId) => {
    const allTabs = tabs
    const idx = allTabs.findIndex(t => t.id === tabId)
    if (idx === -1) return
    const wouldBeEmpty = allTabs.length === 1

    if (wouldBeEmpty) {
      const settings = settingsRef.current
      if (settings.closeLastTabAction === 'closeApp') {
        window.electronAPI.closeWindow()
        return
      }
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
      const newTab = { id, fileName: '未命名', filePath: '', content: '', modified: false, savedContent: '' }
      setTabs([newTab])
      activeTabIdRef.current = id
      setActiveTabId(id)
      return
    }

    const newTabs = allTabs.filter(t => t.id !== tabId)
    setTabs(newTabs)

    if (tabId === activeTabIdRef.current) {
      const nextIdx = Math.min(idx, newTabs.length - 1)
      activeTabIdRef.current = newTabs[nextIdx].id
      setActiveTabId(newTabs[nextIdx].id)
    }
  }, [tabs])

  const addTabRef = useRef()
  const addTab = useCallback((fileData) => {
    if (!fileData) return null

    const { content, filePath: fp, fileName: fn } = fileData

    if (fp) {
      const existing = tabs.find(t => t.filePath === fp)
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
  }, [tabs, switchTab])

  addTabRef.current = addTab

  useEffect(() => {
    if (!editor) return
    window.electronAPI.onFileOpened((data) => {
      addTabRef.current(data)
    })
    window.electronAPI.onFolderOpened((data) => {
      const { folderPath, files } = data
      setCurrentFolderPath(folderPath)
      setFolderFiles(files)
      setSidebarVisible(true)
    })
    return () => {
      window.electronAPI.removeFileOpenedListener()
      window.electronAPI.removeFolderOpenedListener()
    }
  }, [editor])

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
        addTabRef.current({ content: event.target.result, filePath: droppedPath, fileName: file.name })
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
  }, [editor])

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
    const results = await window.electronAPI.openFolder()
    if (results && results.length > 0) {
      for (const r of results) addTab(r)
    }
  }, [addTab])

  const handleSaveFile = useCallback(async () => {
    if (!editor) return
    const tabId = activeTabIdRef.current
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return

    try {
      const currentPath = tab.filePath
      if (!currentPath) {
        return saveAsFileRef.current?.()
      }
      let md = contentRef.current
      const settings = settingsRef.current
      if (settings.imageInsertMode === 'relative' && currentPath) {
        md = convertToRelativePaths(md, currentPath, settings.imageFolder)
      }
      const result = await window.electronAPI.saveFile(md, currentPath)
      if (result) {
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, filePath: result.filePath, fileName: result.fileName, content: md, modified: false, savedContent: md } : t
        ))
      }
    } catch (err) {
      alert('保存失败: ' + (err.message || err))
    }
  }, [editor, tabs])

  const handleSaveAsFile = useCallback(async () => {
    if (!editor) return
    const tabId = activeTabIdRef.current
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return

    try {
      let md = contentRef.current
      const currentPath = tab.filePath
      const settings = settingsRef.current
      if (settings.imageInsertMode === 'relative' && currentPath) {
        md = convertToRelativePaths(md, currentPath, settings.imageFolder)
      }
      const result = await window.electronAPI.saveAsFile(md)
      if (result) {
        setTabs(prev => prev.map(t =>
          t.id === tabId ? { ...t, filePath: result.filePath, fileName: result.fileName, content: md, modified: false, savedContent: md } : t
        ))
      }
    } catch (err) {
      alert('另存失败: ' + (err.message || err))
    }
  }, [editor, tabs])

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

      const settings = settingsRef.current
      const { imageInsertMode, imageFolder } = settings

      if (imageInsertMode === 'base64') {
        const src = `data:${result.mime};base64,${result.base64}`
        editor.chain().focus().setImage({ src }).run()
        return
      }

      if (imageInsertMode === 'relative') {
        const fp = filePathRef.current
        if (!fp) {
          alert('请先保存文件再插入相对路径图片')
          return
        }
        const saveResult = await window.electronAPI.saveImageToDisk({
          base64Data: result.base64,
          ext: result.ext,
          folderPath: imageFolder,
          fileDir: dirname(fp)
        })
        if (!saveResult) return
        if (saveResult.error) {
          alert('保存图片失败: ' + saveResult.error)
          return
        }
        const platform = window.electronAPI.platform
        const prefix = platform === 'win32' ? 'file:///' : 'file://'
        const src = prefix + saveResult.absolutePath.replace(/\\/g, '/')
        editor.chain().focus().setImage({ src }).run()
        return
      }

      const platform = window.electronAPI.platform
      const prefix = platform === 'win32' ? 'file:///' : 'file://'
      const src = prefix + result.filePath.replace(/\\/g, '/')
      editor.chain().focus().setImage({ src }).run()
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

  const handleRegisterAssociation = useCallback(async () => {
    const result = await window.electronAPI.registerAssociation()
    alert(result.message)
  }, [])

  const handleUnregisterAssociation = useCallback(async () => {
    const result = await window.electronAPI.unregisterAssociation()
    alert(result.message)
  }, [])

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
      editor.commands.setContent(text)
    }
  }, [editor])

  const menuActionRefs = useRef({})
  menuActionRefs.current = {
    handleNewFile, handleOpenFile, handleOpenFolder, handleSaveFile, handleSaveAsFile,
    handleExportHtml, handleCopyMarkdown, handlePasteMarkdown,
    handleRegisterAssociation, handleUnregisterAssociation, handleOpenSettings
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
      case 'registerAssociation': menuActionRefs.current.handleRegisterAssociation(); break
      case 'unregisterAssociation': menuActionRefs.current.handleUnregisterAssociation(); break
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
        const settings = JSON.parse(localStorage.getItem('editorSettings') || '{}')
        settings.compactMode = next
        localStorage.setItem('editorSettings', JSON.stringify(settings))
      } catch {}
      return next
    })
  }, [])

  const handleSidebarWidthChange = useCallback((width) => {
    setSidebarWidth(width)
    try {
      const settings = JSON.parse(localStorage.getItem('editorSettings') || '{}')
      settings.sidebarWidth = width
      localStorage.setItem('editorSettings', JSON.stringify(settings))
    } catch {}
  }, [])

  const handleSelectFolder = useCallback(async () => {
    const folderPath = await window.electronAPI.selectFolder()
    if (!folderPath) return
    setCurrentFolderPath(folderPath)
    const files = await window.electronAPI.listMdFiles(folderPath)
    setFolderFiles(files)
    setSidebarVisible(true)
  }, [])

  const handleOpenFolderFile = useCallback(async (filePath) => {
    const result = await window.electronAPI.openFileByPath(filePath)
    if (result) addTab(result)
  }, [addTab])

  const handleThemeChange = useCallback((themeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem('appTheme', themeName)
  }, [])

  const handleSaveSettings = useCallback((settings) => {
    setSpellcheck(settings.spellcheck !== false)
    setShowToolbar(settings.showToolbar !== false)
    setShowOpenFilesModule(settings.showOpenFilesModule !== false)
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
      sidebarWidth: settings.sidebarWidth ?? settingsRef.current.sidebarWidth,
      shortcuts: settings.shortcuts ?? settingsRef.current.shortcuts
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
      } catch (_) {}
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

  const handleCopyPreview = useCallback(() => {
    navigator.clipboard.writeText(markdownContent)
  }, [markdownContent])

  const contextMenuPosition = useMemo(
    () => ({ x: contextMenu.x, y: contextMenu.y }),
    [contextMenu.x, contextMenu.y]
  )

  if (!editor) return null

  return (
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
      {showToolbar && (
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
            folderFiles={folderFiles}
            folderPath={currentFolderPath}
            onOpenFolder={handleSelectFolder}
            onOpenFolderFile={handleOpenFolderFile}
            showOpenFilesModule={showOpenFilesModule}
            width={sidebarWidth}
            onWidthChange={handleSidebarWidthChange}
          />
        )}
        <div className={`editor-area ${showPreview ? 'split' : 'full'}`} onContextMenu={handleContextMenu}>
          <EditorContent editor={editor} className="editor-content" />
        </div>
        {showPreview && (
          <div className="preview-area">
            <div className="preview-header">
              <span>Markdown 源码</span>
              <button
                className="preview-copy-btn"
                onClick={handleCopyPreview}
                title="复制 Markdown"
              >
                📋
              </button>
            </div>
            <pre className="preview-content">
              <code>{markdownContent}</code>
            </pre>
          </div>
        )}
      </div>
      {dragOver && <div className="drag-overlay"><span>释放以打开 .md 文件</span></div>}
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} currentTheme={currentTheme} onThemeChange={handleThemeChange} onSaveSettings={handleSaveSettings} hwAccel={hwAccel} onHwAccelChange={handleHwAccelChange} defaultOpenPath={defaultOpenPath} onDefaultOpenPathChange={handleDefaultOpenPathChange} windowMode={windowMode} windowBounds={windowBounds} onWindowModeChange={handleWindowModeChange} onWindowBoundsChange={handleWindowBoundsChange} />}
      {showAbout && <AboutDialog onClose={() => setShowAbout(false)} />}
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
      />
    </div>
    </Suspense>
  )
}

export default App
