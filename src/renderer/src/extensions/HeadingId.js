import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const HeadingId = Extension.create({
  name: 'headingId',

  addGlobalAttributes() {
    return [
      {
        types: ['heading'],
        attributes: {
          id: {
            default: null,
            parseHTML: element => element.getAttribute('id'),
            renderHTML: attributes => {
              if (!attributes.id) return {}
              return { id: attributes.id }
            }
          }
        }
      }
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('headingIdPlugin'),
        appendTransaction(transactions, oldState, newState) {
          const tr = newState.tr
          let modified = false
          const usedIds = new Set()

          newState.doc.descendants((node, pos) => {
            if (node.type.name !== 'heading') return
            const text = node.textContent
            const base = slugify(text) || 'heading'
            let id = base
            let counter = 1
            while (usedIds.has(id)) {
              id = `${base}-${counter}`
              counter++
            }
            usedIds.add(id)

            if (node.attrs.id !== id) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, id })
              modified = true
            }
          })

          return modified ? tr : null
        }
      })
    ]
  }
})