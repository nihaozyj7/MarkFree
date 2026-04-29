import { useCallback } from 'react'

export function useFolderActions({
  currentFolderPath,
  setCurrentFolderPath,
  setFolderTree,
  setSidebarVisible,
  setRenameTargetPath,
  setRenameTargetValue,
  setFolderSortMode,
  addTab
}) {
  const handleSelectFolder = useCallback(async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder()
      if (!folderPath) return
      setCurrentFolderPath(folderPath)
      const tree = await window.electronAPI.getFolderTree(folderPath)
      setFolderTree(tree)
      setSidebarVisible(true)
    } catch (err) {
      console.error('选择文件夹失败:', err)
    }
  }, [setCurrentFolderPath, setFolderTree, setSidebarVisible])

  const refreshFolderTree = useCallback(async () => {
    if (currentFolderPath) {
      const tree = await window.electronAPI.getFolderTree(currentFolderPath)
      setFolderTree(tree)
    }
  }, [currentFolderPath, setFolderTree])

  const handleCreateFileInFolder = useCallback(async () => {
    if (!currentFolderPath) return
    const result = await window.electronAPI.createFile(currentFolderPath)
    if (result.success) {
      await refreshFolderTree()
      setRenameTargetPath(result.path)
      setRenameTargetValue(result.name)
    } else {
      alert('创建文件失败: ' + result.error)
    }
  }, [currentFolderPath, refreshFolderTree, setRenameTargetPath, setRenameTargetValue])

  const handleCreateFolderInFolder = useCallback(async () => {
    if (!currentFolderPath) return
    const result = await window.electronAPI.createFolder(currentFolderPath)
    if (result.success) {
      await refreshFolderTree()
      setRenameTargetPath(result.path)
      setRenameTargetValue(result.name)
    } else {
      alert('创建文件夹失败: ' + result.error)
    }
  }, [currentFolderPath, refreshFolderTree, setRenameTargetPath, setRenameTargetValue])

  const handleFolderSortModeChange = useCallback((mode) => {
    setFolderSortMode(mode)
    try {
      const settings = JSON.parse(localStorage.getItem('editorSettings') || '{}')
      settings.folderSortMode = mode
      localStorage.setItem('editorSettings', JSON.stringify(settings))
    } catch {}
  }, [setFolderSortMode])

  const handleOpenFolderFile = useCallback(async (filePath) => {
    const result = await window.electronAPI.openFileByPath(filePath)
    if (result) addTab(result)
  }, [addTab])

  return {
    handleSelectFolder,
    refreshFolderTree,
    handleCreateFileInFolder,
    handleCreateFolderInFolder,
    handleFolderSortModeChange,
    handleOpenFolderFile
  }
}
