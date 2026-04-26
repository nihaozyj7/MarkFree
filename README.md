# Markdown WYSIWYG Editor

一个基于 Electron + React + TipTap 的所见即所得 Markdown 编辑器。

## 功能

- **所见即所得编辑** — 基于 TipTap (ProseMirror) 的富文本编辑器，实时渲染 Markdown
- **双向 Markdown** — 支持在 WYSIWYG 和 Markdown 源码之间切换
- **工具栏** — 粗体、斜体、下划线、标题、列表、引用、代码块、表格、链接、图片等
- **代码高亮** — 使用 lowlight 实现代码块语法高亮
- **文件管理** — 打开、保存、另存为 Markdown 文件
- **导出 HTML** — 将编辑内容导出为 HTML 文件
- **图片插入** — 支持 base64 嵌入和相对路径两种模式
- **拖拽打开** — 拖拽 .md 文件到窗口即可打开
- **命令行打开** — 支持通过命令行直接打开文件

## 命令行用法

安装后，可以直接通过命令行打开 Markdown 文件：

```bash
Markdown\ WYSIWYG.exe example.md
Markdown\ WYSIWYG.exe document.markdown
```

支持同时传入多个文件（仅打开第一个匹配的 .md 文件）。

### 文件关联

在应用菜单中点击「注册 .md 文件关联」，即可让 `.md` 文件默认使用本编辑器打开。双击 `.md` 文件即可自动打开编辑。

## 开发

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
npm install
```

### 生成图标

```bash
npm run generate-icon
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 打包为 Windows 安装程序

```bash
npm run pack
```

打包后的安装程序位于 `release/` 目录。

## 技术栈

| 技术 | 用途 |
|---|---|
| Electron 33 | 桌面应用框架 |
| React 18 | UI 框架 |
| Vite 5 | 构建工具 |
| TipTap 2 | 富文本编辑器引擎 |
| ProseMirror | 编辑器内核 |
| tiptap-markdown | Markdown ↔ WYSIWYG 互转 |
| lowlight | 代码语法高亮 |

## 项目结构

```
src/
  main/index.js          — Electron 主进程
  preload/index.js       — 预加载脚本 (contextBridge)
  renderer/
    index.html           — 入口 HTML
    src/
      main.jsx           — React 入口
      App.jsx            — 编辑器主体
      components/
        Toolbar.jsx      — 格式工具栏
        TitleBar.jsx     — 自定义标题栏
        SettingsDialog.jsx — 设置对话框
      styles/
        index.css        — 全局样式
        editor.css       — 编辑器样式
```

## 构建说明

```bash
# 完整打包流程
npm run pack
```

打包产物在 `release/` 目录，包含 NSIS 安装程序（.exe）。

## 许可

MIT
