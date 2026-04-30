import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { CustomImage } from '../extensions/CustomImage'
import { MathInline } from '../extensions/MathInline'
import { MathDisplay } from '../extensions/MathDisplay'
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

export const extensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: { levels: [1, 2, 3, 4, 5, 6] }
  }),
  Underline,
  MathInline,
  MathDisplay,
  CustomImage.configure({ inline: true, allowBase64: true }),
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

export async function loadLanguage(name) {
  await ensureLanguage(name)
}
