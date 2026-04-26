import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
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
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import json from 'highlight.js/lib/languages/json'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'
import sql from 'highlight.js/lib/languages/sql'
import yaml from 'highlight.js/lib/languages/yaml'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import java from 'highlight.js/lib/languages/java'
import { Markdown } from 'tiptap-markdown'
import Toolbar from './components/Toolbar'
import TitleBar from './components/TitleBar'
import StatusBar from './components/StatusBar'
import SettingsDialog from './components/SettingsDialog'
import './styles/editor.css'

const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('xml', xml)
lowlight.register('css', css)
lowlight.register('json', json)
lowlight.register('bash', bash)
lowlight.register('markdown', markdown)
lowlight.register('sql', sql)
lowlight.register('yaml', yaml)
lowlight.register('rust', rust)
lowlight.register('go', go)
lowlight.register('java', java)

function dirname(path) {
  const parts = path.replace(/\\/g, '/').replace(/\/+$/, '').split('/')
  parts.pop()
  return parts.join('/')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function convertToRelativePaths(md, filePath, imageFolder) {
  const fileDir = dirname(filePath)
  const folder = imageFolder.replace(/\\/g, '/').replace(/^\.\//, '')
  const resolvedDir = fileDir + '/' + folder
  const platform = window.electronAPI.platform
  const prefix = platform === 'win32' ? 'file:///' : 'file://'
  const fullPrefix = prefix + resolvedDir

  return md.replace(
    new RegExp('\\]\\(' + escapeRegex(fullPrefix) + '/([^)]+)\\)', 'g'),
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

  return md.replace(
    new RegExp('\\]\\((\\./)?' + escapeRegex(folder) + '/([^)]+)\\)', 'g'),
    (match, dotSlash, filename) => `](${fullPrefix}/${filename})`
  )
}

const DEFAULT_SETTINGS = {
  imageInsertMode: 'base64',
  imageFolder: '.assets',
  spellcheck: true
}

function getSettings() {
  try {
    const saved = localStorage.getItem('editorSettings')
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function App() {
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState(null)
  const tabsRef = useRef([])
  const activeTabIdRef = useRef(null)

  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState('')
  const [modified, setModified] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('appTheme') || 'dark')
  const [spellcheck, setSpellcheck] = useState(() => getSettings().spellcheck !== false)
  const contentRef = useRef('')
  const modifiedRef = useRef(false)
  const filePathRef = useRef('')
  const saveAsFileRef = useRef()
  const editorRef = useRef(null)

  const editor = useEditor({
    extensions: [
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
    ],
    editorProps: {
      attributes: {
        class: 'prose-editor',
        spellcheck: spellcheck ? 'true' : 'false'
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

            const settings = getSettings()
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
    onUpdate: ({ editor }) => {
      const tabId = activeTabIdRef.current
      if (!tabId) return

      let md = editor.storage.markdown.getMarkdown()
      const settings = getSettings()
      const fp = filePathRef.current
      if (settings.imageInsertMode === 'relative' && fp) {
        md = convertToRelativePaths(md, fp, settings.imageFolder)
      }
      setMarkdownContent(md)
      contentRef.current = md

      const currentTab = tabsRef.current.find(t => t.id === tabId)
      if (!currentTab) return

      const isModified = md !== currentTab.savedContent
      tabsRef.current = tabsRef.current.map(t =>
        t.id === tabId ? { ...t, content: md, modified: isModified } : t
      )
      setTabs([...tabsRef.current])

      modifiedRef.current = isModified
      setModified(isModified)
    }
  })

  editorRef.current = editor

  const syncDisplayFromTab = useCallback(() => {
    const tab = tabsRef.current.find(t => t.id === activeTabIdRef.current)
    if (tab) {
      setFileName(tab.fileName)
      setFilePath(tab.filePath)
      filePathRef.current = tab.filePath
      modifiedRef.current = tab.modified
      setModified(tab.modified)
      const prefix = tab.modified ? '* ' : ''
      window.electronAPI.setTitle(`${prefix}${tab.fileName}  - MarkdownPad`)
    } else {
      setFileName('')
      setFilePath('')
      filePathRef.current = ''
      modifiedRef.current = false
      setModified(false)
      window.electronAPI.setTitle('MarkdownPad')
    }
  }, [])

  useEffect(() => {
    syncDisplayFromTab()
  }, [activeTabId, syncDisplayFromTab])

  useEffect(() => {
    if (!editor) return
    const tab = tabsRef.current.find(t => t.id === activeTabIdRef.current)
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
  }, [activeTabId]) // eslint-disable-line

  const switchTab = useCallback((tabId) => {
    if (tabId === activeTabIdRef.current) return

    const prevId = activeTabIdRef.current
    if (prevId && editor) {
      const currentMd = editor.storage.markdown.getMarkdown()
      tabsRef.current = tabsRef.current.map(t =>
        t.id === prevId ? { ...t, content: currentMd } : t
      )
      setTabs([...tabsRef.current])
    }

    activeTabIdRef.current = tabId
    setActiveTabId(tabId)
  }, [editor])

  const closeTab = useCallback((tabId) => {
    const idx = tabsRef.current.findIndex(t => t.id === tabId)
    if (idx === -1) return

    const newTabs = tabsRef.current.filter(t => t.id !== tabId)
    tabsRef.current = newTabs
    setTabs(newTabs)

    if (tabId === activeTabIdRef.current) {
      if (newTabs.length === 0) {
        activeTabIdRef.current = null
        setActiveTabId(null)
      } else {
        const nextIdx = Math.min(idx, newTabs.length - 1)
        activeTabIdRef.current = newTabs[nextIdx].id
        setActiveTabId(newTabs[nextIdx].id)
      }
    }
  }, [])

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
    const settings = getSettings()
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
    tabsRef.current = [...tabsRef.current, newTab]
    setTabs([...tabsRef.current])
    activeTabIdRef.current = id
    setActiveTabId(id)
    return id
  }, [switchTab])

  useEffect(() => {
    if (editor) {
      const md = editor.storage.markdown.getMarkdown()
      setMarkdownContent(md)
      contentRef.current = md
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    window.electronAPI.onFileOpened((data) => {
      addTab(data)
    })
    return () => {
      window.electronAPI.removeFileOpenedListener()
    }
  }, [editor, addTab])

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
        addTab({ content: event.target.result, filePath: droppedPath, fileName: file.name })
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
  }, [editor, addTab])

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
    const tab = tabsRef.current.find(t => t.id === tabId)
    if (!tab) return

    try {
      const currentPath = tab.filePath
      if (!currentPath) {
        return saveAsFileRef.current?.()
      }
      let md = contentRef.current
      const settings = getSettings()
      if (settings.imageInsertMode === 'relative' && currentPath) {
        md = convertToRelativePaths(md, currentPath, settings.imageFolder)
      }
      const result = await window.electronAPI.saveFile(md, currentPath)
      if (result) {
        tabsRef.current = tabsRef.current.map(t =>
          t.id === tabId ? { ...t, filePath: result.filePath, fileName: result.fileName, modified: false, savedContent: t.content } : t
        )
        setTabs([...tabsRef.current])
        modifiedRef.current = false
        setModified(false)
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
      let md = contentRef.current
      const currentPath = tab.filePath
      const settings = getSettings()
      if (settings.imageInsertMode === 'relative' && currentPath) {
        md = convertToRelativePaths(md, currentPath, settings.imageFolder)
      }
      const result = await window.electronAPI.saveAsFile(md)
      if (result) {
        tabsRef.current = tabsRef.current.map(t =>
          t.id === tabId ? { ...t, filePath: result.filePath, fileName: result.fileName, modified: false, savedContent: t.content } : t
        )
        setTabs([...tabsRef.current])
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

      const settings = getSettings()
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

  const handleMenuAction = useCallback((action) => {
    switch (action) {
      case 'open': handleOpenFile(); break
      case 'openFolder': handleOpenFolder(); break
      case 'save': handleSaveFile(); break
      case 'saveAs': handleSaveAsFile(); break
      case 'exportHtml': handleExportHtml(); break
      case 'registerAssociation': handleRegisterAssociation(); break
      case 'unregisterAssociation': handleUnregisterAssociation(); break
      case 'settings': handleOpenSettings(); break
    }
  }, [handleOpenFile, handleOpenFolder, handleSaveFile, handleSaveAsFile, handleExportHtml, handleRegisterAssociation, handleUnregisterAssociation, handleOpenSettings])

  const handleThemeChange = useCallback((themeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem('appTheme', themeName)
  }, [])

  const handleSaveSettings = useCallback((settings) => {
    setSpellcheck(settings.spellcheck !== false)
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
    if (editor?.view?.dom) {
      editor.view.dom.setAttribute('spellcheck', spellcheck ? 'true' : 'false')
    }
  }, [editor, spellcheck])

  useEffect(() => {
    function handleKeyDown(e) {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 'o') {
        e.preventDefault()
        handleOpenFile()
      } else if (mod && e.key === 's') {
        e.preventDefault()
        if (e.shiftKey) handleSaveAsFile()
        else handleSaveFile()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleOpenFile, handleSaveFile, handleSaveAsFile])

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

  if (!editor) return null

  const activeTab = tabs.find(t => t.id === activeTabId)

  return (
    <div className={`app-container${dragOver ? ' drag-over' : ''}`}>
      <TitleBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={switchTab}
        onCloseTab={closeTab}
        onMenuAction={handleMenuAction}
      />
      <Toolbar
        editor={editor}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onCopyMarkdown={handleCopyMarkdown}
        onPasteMarkdown={handlePasteMarkdown}
        onExportHtml={handleExportHtml}
        onInsertImage={handleInsertImage}
      />
      <div className="editor-wrapper">
        <div className={`editor-area ${showPreview ? 'split' : 'full'}`}>
          <EditorContent editor={editor} className="editor-content" />
        </div>
        {showPreview && (
          <div className="preview-area">
            <div className="preview-header">
              <span>Markdown 源码</span>
              <button
                className="preview-copy-btn"
                onClick={() => navigator.clipboard.writeText(markdownContent)}
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
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} currentTheme={currentTheme} onThemeChange={handleThemeChange} onSaveSettings={handleSaveSettings} />}
      <StatusBar filePath={filePath} modified={modified} tabs={tabs} />
    </div>
  )
}

export default App
