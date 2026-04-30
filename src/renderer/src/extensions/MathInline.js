import { Node, nodeInputRule } from '@tiptap/core'
import katex from 'katex'

function isInsideCodeOrPre(node) {
  let el = node.parentElement
  while (el) {
    if (el.tagName === 'PRE' || el.tagName === 'CODE') return true
    el = el.parentElement
  }
  return false
}

export const MathInline = Node.create({
  name: 'mathInline',
  inline: true,
  group: 'inline',
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
    return [{ tag: 'span[data-math-inline]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const value = HTMLAttributes['data-value'] || ''
    const span = document.createElement('span')
    span.setAttribute('data-math-inline', '')
    span.setAttribute('data-value', value)
    span.className = 'math-inline'
    try {
      katex.render(value, span, { throwOnError: false, displayMode: false })
    } catch {
      span.className = 'math-inline math-error'
      span.textContent = value
    }
    return span
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /(?<!\$)\$([^\$]+)\$(?!\$)$/,
        type: this.type,
        getAttributes: match => ({ value: match[1]?.trim() })
      })
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('$')
          state.write(node.attrs.value)
          state.write('$')
        },
        parse: {
          updateDOM(element) {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false)
            const textNodes = []
            while (walker.nextNode()) {
              textNodes.push(walker.currentNode)
            }
            for (const textNode of textNodes) {
              if (isInsideCodeOrPre(textNode)) continue
              const text = textNode.textContent
              const regex = /(?<!\$)\$([^\$]+)\$(?!\$)/g
              const parts = []
              let lastIndex = 0
              let match
              let hasMatch = false
              while ((match = regex.exec(text)) !== null) {
                if (match[0].startsWith('$$')) continue
                hasMatch = true
                parts.push(text.slice(lastIndex, match.index))
                const value = match[1].trim()
                const encoded = value.replace(/"/g, '&quot;')
                parts.push(`<span data-math-inline data-value="${encoded}">${value}</span>`)
                lastIndex = match.index + match[0].length
              }
              if (hasMatch) {
                parts.push(text.slice(lastIndex))
                const temp = document.createElement('span')
                temp.innerHTML = parts.join('')
                const parent = textNode.parentNode
                while (temp.firstChild) {
                  parent.insertBefore(temp.firstChild, textNode)
                }
                parent.removeChild(textNode)
              }
            }
          }
        }
      }
    }
  }
})
