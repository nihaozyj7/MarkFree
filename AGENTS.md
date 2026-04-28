# AGENTS.md

## Commands

```bash
npm install                # install dependencies
npm run generate-icon      # SVG -> PNG icon (required before packaging; NOT auto-chained by pack:*)
npm run dev                # dev server with HMR
npm run build              # production build -> out/
npm run preview            # preview built app
npm run pack               # build + package all platforms
npm run pack:win           # build + package Windows (NSIS + portable)
npm run pack:mac           # build + package macOS (dmg)
npm run pack:linux         # build + package Linux (AppImage)
npm run pack:dir           # generate-icon + build + electron-builder --win --x64 --dir
```

No lint, format, typecheck, or test scripts exist. Do not guess `npm run lint` / `npm run test`.

## Architecture

Three-process Electron app built with **electron-vite**:

| Process | Entry | Purpose |
|---|---|---|
| Main | `src/main/index.js` | Window, IPC handlers, themes, file association, single-instance lock |
| Preload | `src/preload/index.js` | `contextBridge` — all renderer-to-main IPC goes through `window.electronAPI` |
| Renderer | `src/renderer/index.html` → `src/renderer/src/main.jsx` → `App.jsx` | React 18 + TipTap editor UI |

Renderer uses a `@` Vite alias → `src/renderer/src/`.

## Renderer ↔ Main bridge

All IPC is exposed through `window.electronAPI` (defined in `src/preload/index.js:15`). The renderer never imports `electron` directly. Add new IPC methods there only.

## Settings (two separate stores)

- **Main process** (`src/main/index.js:11-31`): reads/writes `userData/settings.json` for `hardwareAcceleration`, `windowMode`, `windowBounds`, `lastWindowBounds`.
- **Renderer** (`src/renderer/src/settings.js`): reads/writes `localStorage` key `editorSettings`. Default values in `DEFAULT_SETTINGS`.

Theme preference is stored separately: `localStorage` key `appTheme`. Built-in theme CSS lives in `src/main/themes/defaults.js` (exported as `THEMES`, `DARK_THEME`). Custom themes are loaded from `userData/themes/`.

Note: `closeLastTabAction: 'newTab'` is silently migrated to `'showWelcome'` in `getSettings()`.

## TipTap extensions

All extensions are registered in `App.jsx`. Markdown ↔ WYSIWYG conversion uses `tiptap-markdown`. Code blocks use lazy-loaded highlight.js language grammars (defined in `LANGUAGE_LOADERS` map). Syntax highlighting framework is `lowlight` (NOT highlight.js API directly).

## Build output

- `out/` — electron-vite build output (referenced by `package.json` `main` field)
- `dist/` — electron-builder packaged installers

## Code splitting

Vite `manualChunks` in `electron.vite.config.mjs` splits node_modules into:
- `vendor-react`
- `vendor-tiptap` (includes prosemirror, tiptap-markdown)
- `vendor-highlight` (includes lowlight)
- `vendor` (everything else)

## Security model

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: false` (sandbox disabled so preload can use Node APIs like `fs`, `path` for the drop event handler). All renderer code runs sandboxed; do not add `nodeIntegration: true`.

## Platform

Windows x64 is the primary target. macOS and Linux packaging configs exist in `package.json` → `build` but are untested on those platforms.
