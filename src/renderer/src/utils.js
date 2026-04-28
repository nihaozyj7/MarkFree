export function dirname(path) {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '')
  if (normalized === '' || normalized.endsWith(':')) return normalized || path
  const parts = normalized.split('/')
  parts.pop()
  const result = parts.join('/')
  return result || (normalized.startsWith('/') ? '/' : normalized)
}

export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const REGEX_CACHE_MAX = 50
export const regexCache = new Map()

export function getCachedRegex(pattern, key) {
  const entry = regexCache.get(key)
  if (entry && entry.pattern === pattern) return entry.regex
  if (regexCache.size >= REGEX_CACHE_MAX) {
    const firstKey = regexCache.keys().next().value
    regexCache.delete(firstKey)
  }
  const regex = new RegExp(pattern, 'g')
  regexCache.set(key, { pattern, regex })
  return regex
}

export function convertToRelativePaths(md, filePath, imageFolder) {
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

export function convertToAbsolutePaths(md, filePath, imageFolder) {
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

export const MIME_MAP_EXT = {
  'image/png': '.png', 'image/jpeg': '.jpg',
  'image/gif': '.gif', 'image/webp': '.webp',
  'image/bmp': '.bmp', 'image/svg+xml': '.svg',
  'image/x-icon': '.ico'
}

export function parseShortcut(shortcut) {
  const parts = shortcut.split('+')
  return {
    ctrl: parts.includes('Ctrl'),
    shift: parts.includes('Shift'),
    alt: parts.includes('Alt'),
    key: parts[parts.length - 1]?.toLowerCase()
  }
}

export function matchesShortcut(e, shortcut) {
  const s = parseShortcut(shortcut)
  return (e.ctrlKey || e.metaKey) === s.ctrl
    && e.shiftKey === s.shift
    && e.altKey === s.alt
    && e.key.toLowerCase() === s.key
}
