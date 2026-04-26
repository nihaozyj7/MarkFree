# AGENTS.md — Markdown WYSIWYG

## Stack
- Electron 33 + React 18 + Vite 5 (electron-vite 2)
- TipTap 2 (ProseMirror) for rich-text editing
- `tiptap-markdown` for Markdown ↔ WYSIWYG conversion
- `lowlight` for code block syntax highlighting
- Plain CSS (no CSS framework, no CSS-in-JS)

## Commands
| Command | What |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `out/` |
| `npm run preview` | Preview production build |

No lint, typecheck, or test infrastructure exists.

## Project layout

```
src/
  main/index.js          — Electron main process (BrowserWindow, window config)
  preload/index.js       — contextBridge: exposes electronAPI (openFile, saveFile, etc.)
  renderer/
    index.html           — entry HTML
    src/
      main.jsx           — React mount point
      App.jsx            — TipTap editor setup, all extensions, Markdown preview toggle
      components/
        Toolbar.jsx      — formatting toolbar (bold, headings, tables, links, etc.)
      styles/
        index.css        — reset + base
        editor.css       — editor, toolbar, preview, scrollbar styles
```

## Architecture notes
- Import alias `@` = `src/renderer/src` (defined in `electron.vite.config.mjs`)
- All TipTap extensions are registered in `App.jsx` — add new ones there
- Bidirectional Markdown is handled by `tiptap-markdown` via `Markdown` extension
- Preload uses `contextBridge.exposeInMainWorld('electronAPI', ...)` — renderer accesses via `window.electronAPI`
- Editor placeholder text is in Chinese ("开始写作...")
- Editor toolbar groups are defined as a static array in `Toolbar.jsx`
- `sandbox: false` is set in main window `webPreferences` (needed for preload to work with electron-vite)

## Key dependencies
- `@tiptap/pm` — ProseMirror peer packages (bundled by TipTap)
- `@tiptap/starter-kit` — bundles essential extensions (bold, italic, list, heading, etc.), but `codeBlock` is disabled in favor of `@tiptap/extension-code-block-lowlight`
