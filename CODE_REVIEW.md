# Code Review — MarkdownPad

**Overall Severity:** MAJOR

---

## Issues

### #1 [BUG] `regexCache` 无限增长，内存泄漏
- **File:** `src/renderer/src/App.jsx:88-96`
- **Severity:** MEDIUM
- **What:** `regexCache` 对象只写不清理。每次用新的 `imageFolder` 路径调用 `getCachedRegex`，都会新增一条缓存，长期运行后可能累积大量正则对象。
- **Fix:** 加一个 LRU 上限（如 Map + 50 条上限），或用 WeakMap 配合固定大小的缓存。

### #2 [BUG] `dirname()` 不处理根路径边界情况
- **File:** `src/renderer/src/App.jsx:78-82`
- **Severity:** LOW
- **What:** 路径为 `'/'` 或 `'C:\'` 时，`split('/').pop()` 会弹出空字符串，`join('/')` 返回空字符串，`'' + '/' + folder` 会生成类似 `//.assets/img.png` 的错误路径。
- **Fix:** 检查根路径后直接返回。

### #3 [BUG] `buildDirectoryChildren` 阻塞 IPC 线程
- **File:** `src/main/index.js:306-333`
- **Severity:** LOW
- **What:** 在 `for` 循环中同步调用 `readFileSync` 读取每个 .md 文件内容来计算字数，对于大文件夹会阻塞主进程。
- **Fix:** 使用 `fs/promises` 的 `readFile`，并在循环中并发读取（或跳过字数统计，由 renderer 端按需计算）。

### #4 [BUG] `SettingsDialog` 快捷录制闭包可能读到过期 `settings`
- **File:** `src/renderer/src/components/SettingsDialog.jsx:52-73`
- **Severity:** LOW
- **What:** `useEffect` 依赖 `[editingShortcut]`，但 handler 内部引用 `settings.shortcuts` 是在 effect 创建时捕获的闭包。如果用户在录制快捷键的同时有其他地方修改了 settings（不太可能在本项目中），则 handler 中的 `settings.shortcuts` 可能是旧值。实际触发风险极低。
- **Fix:** 使用 ref 存储最新 settings，或使用函数式 `setSettings`。

### #5 [SECURITY] 文件关联注册中 `exePath` 拼接未转义
- **File:** `src/main/index.js:496-504`
- **Severity:** LOW
- **What:** `exePath` 来自 `app.getPath('exe')`，直接拼入注册表命令模板字符串 `` `"${exePath}" "%1"` ``。如果 exe 路径包含双引号字符（极罕见但理论上可能），会导致命令解析异常。
- **Fix:** 用 `JSON.stringify(exePath)` 或转义引号。

### #6 [CODEQUALITY] `App.jsx` 过于庞大（1241 行）
- **File:** `src/renderer/src/App.jsx`
- **Severity:** MEDIUM
- **What:** 单个组件包含：Tab 管理、编辑器配置、拖放、图片处理、Markdown 转换、快捷键、主题、设置同步、UI 渲染。违反单一职责原则。
- **Fix:** 拆分为自定义 hooks：
  - `useTabManager` — tabs/addTab/closeTab/switchTab
  - `useEditorSetup` — TipTap 初始化和 props
  - `useImageHandling` — 图片插入和路径转换
  - `useDragDrop` — 拖放事件
  - `useKeyboardShortcuts` — 全局快捷键
  - `useSettings` — 统一的 settings 管理（见 #7）

### #7 [CODEQUALITY] Settings 逻辑分散在三处
- **File:** `src/renderer/src/App.jsx:130-163`, `src/renderer/src/main.jsx:5`, `src/renderer/src/components/SettingsDialog.jsx:3-19`
- **Severity:** LOW
- **What:** `DEFAULT_SETTINGS` 在 `App.jsx` 和 `SettingsDialog.jsx` 中重复定义，`getSettings()` 和 `updateSettings()` 逻辑也各自实现。要改一个默认值需要同步改两处。
- **Fix:** 将 `DEFAULT_SETTINGS`、`getSettings`、`saveSettings` 抽到独立的 `settings.js` 模块。

### #8 [CODEQUALITY] `MIME_MAP_EXT` 重复定义
- **File:** `src/renderer/src/App.jsx:413-417`, `src/main/index.js:238-243`
- **Severity:** LOW
- **What:** 图片 MIME 类型到扩展名的映射在 main 和 renderer 中分别定义，且 renderer 的映射缺少 `.ico` 项。
- **Fix:** 如果前后端都需要，通过 IPC 暴露一个统一方法；否则在 renderer 中删除重复定义。

### #9 [CODEQUALITY] `compareNodes` 不验证 `sortMode` 格式
- **File:** `src/renderer/src/components/Sidebar.jsx:5`, `src/renderer/src/components/FileTree.jsx:142`
- **Severity:** LOW
- **What:** 直接 `sortMode.split('-')` 获取 `[position, sortBy]`。如果 `sortMode` 是空字符串或其他异常值，`sortBy` 会是 `undefined`，不会匹配任何 case，fallback 到 `localeCompare`，但代码意图不清晰。
- **Fix:** 添加防御性检查：`const [position, sortBy] = (sortMode || 'foldersFirst-createTime').split('-')`

### #10 [SUGGESTION] `window.prompt()` 不适用于 Electron 环境
- **File:** `src/renderer/src/components/Toolbar.jsx:33, 39`
- **Severity:** LOW
- **What:** 链接和图片 URL 输入使用 `window.prompt()`，这是同步阻塞的 API，在某些 Electron 版本中可能行为不一致或被忽略。
- **Fix:** 用自定义的轻量级输入弹窗组件替代。

### #11 [SUGGESTION] Tab 切换时 content 同步依赖 `useEffect` 时序
- **File:** `src/renderer/src/App.jsx:489-503, 505-518`
- **Severity:** LOW
- **What:** `switchTab` 先将旧 tab 的内容保存到 `setTabs`（异步），然后 `setActiveTabId` 触发 `useEffect` 加载新 tab 内容。如果 React 批量更新导致 `useEffect` 在 `setTabs` 生效前触发，可能出现瞬间闪烁（实际中 React 18 的自动批处理应能保证顺序）。
- **Fix:** 使用 `useReducer` 管理 tab 状态，将 save + switch 作为一个原子操作。

### #12 [SUGGESTION] 全局快捷键注册会吞掉 TipTap 内部快捷键
- **File:** `src/renderer/src/App.jsx:1054-1078`
- **Severity:** LOW
- **What:** document 级别的 `keydown` 监听器会在 `Ctrl+S` 时调用 `e.preventDefault()`，即使焦点在编辑器中。但 TipTap 的 `handleKeyDown` 也处理了 `Ctrl+S`（return true）。两层处理会导致 `keyHandlersRef.current.save()` 被调用，同时 TipTap 也 prevent 了默认行为。实际上两层的 `return true` 阻止了浏览器级快捷键，并各自处理——这可能导致重复保存调用（一次来自 TipTap handler，一次来自 document listener）。
- **Fix:** 在编辑模式下，统一走 TipTap 的 handler；全局 listener 只作为 fallback。

### #13 [PERF] `buildDirectoryChildren` 中的同步 read + word count
- **File:** `src/main/index.js:320-333`
- **Severity:** LOW
- **What:** 对每个 .md 文件都调用 `readFileSync` + `split(/\s+/)` 来计算字数。5MB 以内的大文件也会被完整读入并执行 split，造成不必要的磁盘 I/O 和 CPU 开销。
- **Fix:** 将 word count 改为逐块读取计数，或延迟到文件展开时再统计。

### #14 [SUGGESTION] `closeTab` 在没有文件夹打开时关闭最后一个标签页不会提示未保存
- **File:** `src/renderer/src/App.jsx:520-554`
- **Severity:** MEDIUM
- **What:** 当 `closeLastTabAction === 'closeApp'` 或 `'showWelcome'` 时，直接关闭/清空所有 tabs，不检查 `tab.modified` 状态，用户可能丢失未保存内容。
- **Fix:** 关闭前检查是否有修改过的 tab，若有则弹出确认对话框。

### #15 [SUGGESTION] `handlePasteMarkdown` 直接覆盖整个文档
- **File:** `src/renderer/src/App.jsx:846-851`
- **Severity:** MEDIUM
- **What:** `setContent(text)` 替换整个 editor 内容，而不是在光标位置插入。用户可能在意外点击后丢失所有已有内容。没有任何确认提示。
- **Fix:** 在光标位置使用 `insertContent(text)` 或添加确认对话框。

---

## Summary

项目整体架构清晰，功能完整。主要问题集中在：

1. **App.jsx 组件过于庞大**（1241 行），建议拆分为多个自定义 hooks
2. **Settings 逻辑重复定义**在 App.jsx 和 SettingsDialog.jsx 中，应抽到独立模块
3. **关闭最后一个标签页时不检查未保存修改**，容易导致数据丢失
4. **粘贴 Markdown 直接覆写全文**，应改为光标处插入或添加确认

没有发现严重的安全漏洞或会导致崩溃的关键 bug。代码质量整体较高，命名清晰，组件拆分合理（除 App.jsx 外）。

---

## Positive Notes

- 使用 `contextBridge` + `contextIsolation: true` 正确隔离了 renderer 和 main 进程
- `ErrorBoundary` 组件提供了优雅的错误降级
- 使用 `lazy()` + `Suspense` 按需加载对话框组件
- `memo()` 广泛用于减少不必要的重渲染
- StatusBar 使用 `requestAnimationFrame` 节流统计更新
- 拖放区域使用 `dragCounter` 正确处理子元素事件问题
- 主题系统设计完善，内置 10 套主题
- 窗口位置多显示器检测（`ensureWindowVisible`）考虑周到
- 鼠标中键关闭标签页的手势检测实现细致
