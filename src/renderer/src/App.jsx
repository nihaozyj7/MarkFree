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

function App() {
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [filePath, setFilePath] = useState('')
  const [modified, setModified] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const contentRef = useRef('')

  const loadContent = useCallback(({ content, filePath: fp, fileName: fn }) => {
    setFileName(fn)
    setFilePath(fp)
    contentRef.current = content
    if (editor) {
      editor.commands.setContent(content)
    }
    setModified(false)
    window.electronAPI.setTitle(`${fn} - Markdown WYSIWYG Editor`)
  }, [])

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
      }
    },
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown.getMarkdown()
      setMarkdownContent(md)
      contentRef.current = md
      if (!modified) setModified(true)
    }
  })

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

      if (file.path) {
        const result = await window.electronAPI.openFileByPath(file.path)
        if (result) loadContent(result)
      } else {
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target.result
          const fn = file.name
          setFileName(fn)
          setFilePath('')
          contentRef.current = content
          editor.commands.setContent(content)
          setModified(false)
          window.electronAPI.setTitle(`${fn} - Markdown WYSIWYG Editor`)
        }
        reader.readAsText(file)
      }
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
    const result = await window.electronAPI.saveFile(contentRef.current, filePath)
    if (result) {
      setFileName(result.fileName)
      setFilePath(result.filePath)
      setModified(false)
      window.electronAPI.setTitle(`${result.fileName} - Markdown WYSIWYG Editor`)
    }
  }, [filePath, editor])

  const handleSaveAsFile = useCallback(async () => {
    if (!editor) return
    const result = await window.electronAPI.saveAsFile(contentRef.current)
    if (result) {
      setFileName(result.fileName)
      setFilePath(result.filePath)
      setModified(false)
      window.electronAPI.setTitle(`${result.fileName} - Markdown WYSIWYG Editor`)
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
      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
