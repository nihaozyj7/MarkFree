import { MIME_MAP_EXT, dirname } from '../utils'

function getExtFromMime(mime) {
  return MIME_MAP_EXT[mime] || '.png'
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function readImageFromFile(file) {
  const dataUrl = await readFileAsDataURL(file)
  const base64Data = dataUrl.split(',')[1]
  return {
    base64Data,
    mime: file.type,
    ext: file.type ? getExtFromMime(file.type) : '.png'
  }
}

export async function insertImageToEditor(editor, { base64Data, mime, ext, settings, filePath }) {
  const { imageInsertMode, imageFolder } = settings

  if (imageInsertMode === 'base64') {
    editor.chain().focus().setImage({ src: `data:${mime};base64,${base64Data}` }).run()
    return
  }

  if (imageInsertMode === 'relative') {
    if (!filePath) {
      alert('请先保存文件再插入相对路径图片')
      return
    }
    const saveResult = await window.electronAPI.saveImageToDisk({
      base64Data, ext, folderPath: imageFolder, fileDir: dirname(filePath)
    })
    if (!saveResult || saveResult.error) return
    editor.chain().focus().setImage({ src: saveResult.relativePath }).run()
    return
  }

  if (imageInsertMode === 'absolute') {
    const saveResult = await window.electronAPI.saveImageToDisk({
      base64Data,
      ext,
      folderPath: imageFolder,
      fileDir: filePath ? dirname(filePath) : ''
    })
    if (!saveResult || saveResult.error) return
    editor.chain().focus().setImage({ src: saveResult.absolutePath }).run()
    return
  }

  const saveResult = await window.electronAPI.saveImageToDisk({
    base64Data,
    ext,
    folderPath: imageFolder,
    fileDir: filePath ? dirname(filePath) : ''
  })
  if (!saveResult || saveResult.error) return
  editor.chain().focus().setImage({ src: saveResult.absolutePath }).run()
}
