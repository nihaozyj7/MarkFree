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
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import Toolbar from './components/Toolbar'
import TitleBar from './components/TitleBar'
import SettingsDialog from './components/SettingsDialog'
import './styles/editor.css'

const lowlight = createLowlight(common)

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
  imageFolder: '.assets'
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
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState('')
  const [modified, setModified] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('appTheme') || 'dark')
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
        class: 'prose-editor'
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
      let md = editor.storage.markdown.getMarkdown()
      const settings = getSettings()
      if (settings.imageInsertMode === 'relative' && filePathRef.current) {
        md = convertToRelativePaths(md, filePathRef.current, settings.imageFolder)
      }
      setMarkdownContent(md)
      contentRef.current = md
      if (!modifiedRef.current) {
        modifiedRef.current = true
        setModified(true)
      }
    }
  })

  editorRef.current = editor

  const loadContent = useCallback(({ content, filePath: fp, fileName: fn }) => {
    let processedContent = content
    const settings = getSettings()
    if (settings.imageInsertMode === 'relative' && fp) {
      processedContent = convertToAbsolutePaths(content, fp, settings.imageFolder)
    }
    setFileName(fn)
    setFilePath(fp)
    filePathRef.current = fp
    contentRef.current = processedContent
    if (editor) {
      try {
        editor.commands.setContent(processedContent)
      } catch (err) {
        console.error('设置编辑器内容失败:', err)
      }
      editor.commands.focus()
    }
    modifiedRef.current = false
    setModified(false)
    window.electronAPI.setTitle(`${fn}  - MarkdownPad`)
  }, [editor])

  useEffect(() => {
    if (editor) {
      const md = editor.storage.markdown.getMarkdown()
      setMarkdownContent(md)
      contentRef.current = md
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    window.electronAPI.onFileOpened(loadContent)
    return () => {
      window.electronAPI.removeFileOpenedListener()
    }
  }, [editor, loadContent])

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

      const filePath = window.electronAPI.getPendingDropPath() || file.path || ''

      const reader = new FileReader()
      reader.onload = (event) => {
        loadContent({ content: event.target.result, filePath, fileName: file.name })
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
  }, [editor, loadContent])

  const handleOpenFile = useCallback(async () => {
    if (!editor) return
    const result = await window.electronAPI.openFile()
    if (result) loadContent(result)
  }, [editor, loadContent])

  const handleSaveFile = useCallback(async () => {
    if (!editor) return
    try {
      const currentPath = filePathRef.current
      if (!currentPath) {
        return saveAsFileRef.current?.()
      }
      let content = contentRef.current
      const settings = getSettings()
      if (settings.imageInsertMode === 'relative' && currentPath) {
        content = convertToRelativePaths(content, currentPath, settings.imageFolder)
      }
      const result = await window.electronAPI.saveFile(content, currentPath)
      if (result) {
        filePathRef.current = result.filePath
        setFileName(result.fileName)
        setFilePath(result.filePath)
        modifiedRef.current = false
        setModified(false)
        window.electronAPI.setTitle(`${result.fileName}  - MarkdownPad`)
      }
    } catch (err) {
      alert('保存失败: ' + (err.message || err))
    }
  }, [editor])

  const handleSaveAsFile = useCallback(async () => {
    if (!editor) return
    try {
      const currentPath = filePathRef.current
      let content = contentRef.current
      const settings = getSettings()
      if (settings.imageInsertMode === 'relative' && currentPath) {
        content = convertToRelativePaths(content, currentPath, settings.imageFolder)
      }
      const result = await window.electronAPI.saveAsFile(content)
      if (result) {
        filePathRef.current = result.filePath
        setFileName(result.fileName)
        setFilePath(result.filePath)
        modifiedRef.current = false
        setModified(false)
        window.electronAPI.setTitle(`${result.fileName}  - MarkdownPad`)
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
      case 'save': handleSaveFile(); break
      case 'saveAs': handleSaveAsFile(); break
      case 'exportHtml': handleExportHtml(); break
      case 'registerAssociation': handleRegisterAssociation(); break
      case 'unregisterAssociation': handleUnregisterAssociation(); break
      case 'settings': handleOpenSettings(); break
    }
  }, [handleOpenFile, handleSaveFile, handleSaveAsFile, handleExportHtml, handleRegisterAssociation, handleUnregisterAssociation, handleOpenSettings])

  const handleThemeChange = useCallback((themeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem('appTheme', themeName)
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

  const displayName = modified && fileName ? `* ${fileName}` : fileName

  return (
    <div className={`app-container${dragOver ? ' drag-over' : ''}`}>
      <TitleBar fileName={displayName} onMenuAction={handleMenuAction} />
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
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} currentTheme={currentTheme} onThemeChange={handleThemeChange} />}
    </div>
  )
}

export default App
