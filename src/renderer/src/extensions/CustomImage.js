import Image from '@tiptap/extension-image'

let currentFileDir = ''

export function setImageFileDir(dir) {
  currentFileDir = dir
}

function resolveImageSrc(src) {
  if (!src) return src
  if (/^(data:|https?:\/\/)/.test(src)) return src

  let filePath = src

  if (filePath.startsWith('file:///')) {
    filePath = filePath.slice(7)
  } else if (filePath.startsWith('file://')) {
    filePath = filePath.slice(7)
  }

  const isAbsolute = filePath.startsWith('/') || /^[a-zA-Z]:/.test(filePath)

  if (!isAbsolute && currentFileDir) {
    const cleanSrc = filePath.replace(/^\.?[\/\\]/, '')
    filePath = currentFileDir + '/' + cleanSrc
  }

  filePath = filePath.replace(/\\/g, '/')

  return 'local-file:///' + filePath
}

export const CustomImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    const displaySrc = resolveImageSrc(HTMLAttributes.src)
    return ['img', { ...HTMLAttributes, src: displaySrc }]
  }
})
