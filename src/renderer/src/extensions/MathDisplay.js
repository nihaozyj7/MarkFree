import { Node, nodeInputRule } from '@tiptap/core'
import katex from 'katex'

export const MathDisplay = Node.create({
  name: 'mathDisplay',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: el => el.getAttribute('data-value'),
        renderHTML: attrs => {
          if (!attrs.value) return {}
          return { 'data-value': attrs.value }
        }
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-math-display]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const value = HTMLAttributes['data-value'] || ''
    const div = document.createElement('div')
    div.setAttribute('data-math-display', '')
    div.setAttribute('data-value', value)
    div.className = 'math-display'
    try {
      katex.render(value, div, { throwOnError: false, displayMode: true })
    } catch {
      div.className = 'math-display math-error'
      div.textContent = value
    }
    return div
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\$\$([^$]+)\$\$$/,
        type: this.type,
        getAttributes: match => ({ value: match[1]?.trim() })
      })
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('$$')
          state.write(node.attrs.value)
          state.write('$$')
          state.closeBlock(node)
        },
        parse: {
          updateDOM(element) {
            const paragraphs = [...element.querySelectorAll('p')]
            for (const p of paragraphs) {
              const text = p.textContent.trim()
              const match = text.match(/^\$\$([\s\S]*?)\$\$$/)
              if (!match) continue
              const value = match[1].trim()
              if (!value) continue
              const div = document.createElement('div')
              div.setAttribute('data-math-display', '')
              div.setAttribute('data-value', value)
              div.textContent = value
              p.parentNode.replaceChild(div, p)
            }
          }
        }
      }
    }
  }
})
