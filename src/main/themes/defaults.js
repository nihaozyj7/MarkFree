/* ========== 经典主题 1 — Nord ========== */

const NORD_DARK = `:root {
  --bg-primary: #2e3440;
  --bg-secondary: #3b4252;
  --bg-tertiary: #2e3440;
  --bg-hover: #434c5e;
  --bg-code: #1e2229;
  --bg-code-inline: #3b4252;
  --bg-preview: #252933;
  --bg-overlay: rgba(0, 0, 0, 0.6);
  --text-primary: #d8dee9;
  --text-secondary: #81a1c1;
  --text-muted: #4c566a;
  --text-strikethrough: #616e88;
  --text-bold: #eceff4;
  --text-code: #b48ead;
  --text-link: #88c0d0;
  --text-link-hover: #8fbcbb;
  --color-accent: #88c0d0;
  --accent-hover: #81a1c1;
  --heading-h1: #bf616a;
  --heading-h2: #d08770;
  --heading-h3: #ebcb8b;
  --heading-h4: #a3be8c;
  --heading-h5: #b48ead;
  --heading-h6: #88c0d0;
  --border-color: #434c5e;
  --heading-border: #434c5e;
  --hover-bg: rgba(216, 222, 233, 0.06);
  --hover-bg-strong: rgba(216, 222, 233, 0.1);
  --hover-bg-accent: rgba(136, 192, 208, 0.15);
  --accent-bg-subtle: rgba(136, 192, 208, 0.06);
  --selected-bg: rgba(136, 192, 208, 0.1);
  --settings-radio-hover: rgba(216, 222, 233, 0.04);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  --drag-bg: rgba(46, 52, 64, 0.85);
  --drag-border: #88c0d0;
  --drag-text-bg: rgba(136, 192, 208, 0.1);
  --checkbox-accent: #a3be8c;
  --close-btn-bg: #bf616a;
  --scrollbar-track: #2e3440;
  --scrollbar-thumb: #434c5e;
  --scrollbar-thumb-hover: #81a1c1;
  --status-bar-bg: #2e3440;
  --active-bg: rgba(136, 192, 208, 0.15);
  --preview-toggle-bg: #5e81ac;
}`

const NORD_LIGHT = `:root {
  --bg-primary: #f5f7fa;
  --bg-secondary: #eef1f5;
  --bg-tertiary: #e5e9f0;
  --bg-hover: #d8dee9;
  --bg-code: #e5e9f0;
  --bg-code-inline: #eef1f5;
  --bg-preview: #fafbfc;
  --bg-overlay: rgba(0, 0, 0, 0.2);
  --text-primary: #2e3440;
  --text-secondary: #4c566a;
  --text-muted: #81a1c1;
  --text-strikethrough: #81a1c1;
  --text-bold: #2e3440;
  --text-code: #b48ead;
  --text-link: #5e81ac;
  --text-link-hover: #81a1c1;
  --color-accent: #5e81ac;
  --accent-hover: #4c566a;
  --heading-h1: #bf616a;
  --heading-h2: #d08770;
  --heading-h3: #d08770;
  --heading-h4: #a3be8c;
  --heading-h5: #b48ead;
  --heading-h6: #81a1c1;
  --border-color: #d8dee9;
  --heading-border: #d8dee9;
  --hover-bg: rgba(46, 52, 64, 0.04);
  --hover-bg-strong: rgba(46, 52, 64, 0.07);
  --hover-bg-accent: rgba(94, 129, 172, 0.1);
  --accent-bg-subtle: rgba(94, 129, 172, 0.03);
  --selected-bg: rgba(94, 129, 172, 0.08);
  --settings-radio-hover: rgba(46, 52, 64, 0.03);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  --drag-bg: rgba(245, 247, 250, 0.85);
  --drag-border: #5e81ac;
  --drag-text-bg: rgba(94, 129, 172, 0.08);
  --checkbox-accent: #a3be8c;
  --close-btn-bg: #bf616a;
  --scrollbar-track: #eef1f5;
  --scrollbar-thumb: #d8dee9;
  --scrollbar-thumb-hover: #81a1c1;
  --status-bar-bg: #e5e9f0;
  --active-bg: rgba(94, 129, 172, 0.1);
  --preview-toggle-bg: #5e81ac;
}`

/* ========== 经典主题 2 — 暖色 (Warm) ========== */

const WARM_DARK = `:root {
  --bg-primary: #2b1f1a;
  --bg-secondary: #3d2c24;
  --bg-tertiary: #241b16;
  --bg-hover: #3d2c24;
  --bg-code: #1f1612;
  --bg-code-inline: #3d2c24;
  --bg-preview: #221914;
  --bg-overlay: rgba(0, 0, 0, 0.6);
  --text-primary: #e8d5c4;
  --text-secondary: #c4a88a;
  --text-muted: #8a6e58;
  --text-strikethrough: #7a5f4a;
  --text-bold: #f5ebe0;
  --text-code: #e6a88a;
  --text-link: #c49a6a;
  --text-link-hover: #d4b08a;
  --color-accent: #c47a4a;
  --accent-hover: #d48a5a;
  --heading-h1: #d48a5a;
  --heading-h2: #c49a6a;
  --heading-h3: #b4aa7a;
  --heading-h4: #8ab47a;
  --heading-h5: #8aaab4;
  --heading-h6: #b48aaa;
  --border-color: #3d2c24;
  --heading-border: #3d2c24;
  --hover-bg: rgba(232, 213, 196, 0.06);
  --hover-bg-strong: rgba(232, 213, 196, 0.1);
  --hover-bg-accent: rgba(196, 122, 74, 0.15);
  --accent-bg-subtle: rgba(196, 122, 74, 0.06);
  --selected-bg: rgba(196, 122, 74, 0.1);
  --settings-radio-hover: rgba(232, 213, 196, 0.04);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  --drag-bg: rgba(43, 31, 26, 0.85);
  --drag-border: #c47a4a;
  --drag-text-bg: rgba(196, 122, 74, 0.1);
  --checkbox-accent: #8ab47a;
  --close-btn-bg: #c47a4a;
  --scrollbar-track: #2b1f1a;
  --scrollbar-thumb: #3d2c24;
  --scrollbar-thumb-hover: #c47a4a;
  --status-bar-bg: #241b16;
  --active-bg: rgba(196, 122, 74, 0.15);
  --preview-toggle-bg: #8a6e58;
}`

const WARM_LIGHT = `:root {
  --bg-primary: #fdf6ee;
  --bg-secondary: #f5ede3;
  --bg-tertiary: #ede3d6;
  --bg-hover: #e8dccc;
  --bg-code: #f0e8dc;
  --bg-code-inline: #f5ede3;
  --bg-preview: #fefaf5;
  --bg-overlay: rgba(0, 0, 0, 0.15);
  --text-primary: #3d2c24;
  --text-secondary: #6b5340;
  --text-muted: #a0806a;
  --text-strikethrough: #b0907a;
  --text-bold: #2b1f1a;
  --text-code: #b06040;
  --text-link: #7a6a40;
  --text-link-hover: #9a8a5a;
  --color-accent: #b06040;
  --accent-hover: #9a5030;
  --heading-h1: #b06040;
  --heading-h2: #9a7a40;
  --heading-h3: #7a8a40;
  --heading-h4: #4a7a60;
  --heading-h5: #4a6a8a;
  --heading-h6: #7a5a8a;
  --border-color: #e8dccc;
  --heading-border: #e0d0c0;
  --hover-bg: rgba(61, 44, 36, 0.04);
  --hover-bg-strong: rgba(61, 44, 36, 0.07);
  --hover-bg-accent: rgba(176, 96, 64, 0.1);
  --accent-bg-subtle: rgba(176, 96, 64, 0.03);
  --selected-bg: rgba(176, 96, 64, 0.08);
  --settings-radio-hover: rgba(61, 44, 36, 0.03);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  --drag-bg: rgba(253, 246, 238, 0.85);
  --drag-border: #b06040;
  --drag-text-bg: rgba(176, 96, 64, 0.08);
  --checkbox-accent: #6a9a50;
  --close-btn-bg: #b06040;
  --scrollbar-track: #f5ede3;
  --scrollbar-thumb: #e0d0c0;
  --scrollbar-thumb-hover: #b06040;
  --status-bar-bg: #ede3d6;
  --active-bg: rgba(176, 96, 64, 0.1);
  --preview-toggle-bg: #8a6e58;
}`

/* ========== 花哨主题 1 — 霓虹 (Neon) ========== */

const NEON_DARK = `:root {
  --bg-primary: #0d0d1a;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #0d0d1a;
  --bg-hover: #1a1a3e;
  --bg-code: #0a0a14;
  --bg-code-inline: #1a1a30;
  --bg-preview: #0a0a14;
  --bg-overlay: rgba(0, 0, 0, 0.7);
  --text-primary: #e0e0ff;
  --text-secondary: #8888cc;
  --text-muted: #5555aa;
  --text-strikethrough: #6666aa;
  --text-bold: #ffffff;
  --text-code: #ff66cc;
  --text-link: #00ddff;
  --text-link-hover: #66eeff;
  --color-accent: #ff3388;
  --accent-hover: #ff66aa;
  --heading-h1: #ff3388;
  --heading-h2: #ff6633;
  --heading-h3: #ffcc00;
  --heading-h4: #33ff66;
  --heading-h5: #00ddff;
  --heading-h6: #aa66ff;
  --border-color: #2a2a5e;
  --heading-border: #2a2a5e;
  --hover-bg: rgba(224, 224, 255, 0.05);
  --hover-bg-strong: rgba(224, 224, 255, 0.08);
  --hover-bg-accent: rgba(255, 51, 136, 0.15);
  --accent-bg-subtle: rgba(255, 51, 136, 0.05);
  --selected-bg: rgba(255, 51, 136, 0.1);
  --settings-radio-hover: rgba(224, 224, 255, 0.03);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  --drag-bg: rgba(13, 13, 26, 0.85);
  --drag-border: #ff3388;
  --drag-text-bg: rgba(255, 51, 136, 0.1);
  --checkbox-accent: #00ffaa;
  --close-btn-bg: #ff3388;
  --scrollbar-track: #0d0d1a;
  --scrollbar-thumb: #2a2a5e;
  --scrollbar-thumb-hover: #ff3388;
  --status-bar-bg: #0d0d1a;
  --active-bg: rgba(255, 51, 136, 0.15);
  --preview-toggle-bg: #6633cc;
}`

const NEON_LIGHT = `:root {
  --bg-primary: #faf5ff;
  --bg-secondary: #f0e8ff;
  --bg-tertiary: #e8dcf5;
  --bg-hover: #dcccf0;
  --bg-code: #f0e8ff;
  --bg-code-inline: #f5f0ff;
  --bg-preview: #fefcff;
  --bg-overlay: rgba(0, 0, 0, 0.15);
  --text-primary: #1a1a3e;
  --text-secondary: #5555aa;
  --text-muted: #8888cc;
  --text-strikethrough: #9999cc;
  --text-bold: #0d0d2e;
  --text-code: #cc3388;
  --text-link: #3366cc;
  --text-link-hover: #5588ee;
  --color-accent: #cc3388;
  --accent-hover: #aa2266;
  --heading-h1: #cc3388;
  --heading-h2: #dd6633;
  --heading-h3: #ccaa00;
  --heading-h4: #33aa55;
  --heading-h5: #3388cc;
  --heading-h6: #6633cc;
  --border-color: #dcccf0;
  --heading-border: #dcccf0;
  --hover-bg: rgba(26, 26, 62, 0.04);
  --hover-bg-strong: rgba(26, 26, 62, 0.07);
  --hover-bg-accent: rgba(204, 51, 136, 0.1);
  --accent-bg-subtle: rgba(204, 51, 136, 0.03);
  --selected-bg: rgba(204, 51, 136, 0.08);
  --settings-radio-hover: rgba(26, 26, 62, 0.03);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  --drag-bg: rgba(250, 245, 255, 0.85);
  --drag-border: #cc3388;
  --drag-text-bg: rgba(204, 51, 136, 0.08);
  --checkbox-accent: #33aa55;
  --close-btn-bg: #cc3388;
  --scrollbar-track: #f0e8ff;
  --scrollbar-thumb: #dcccf0;
  --scrollbar-thumb-hover: #cc3388;
  --status-bar-bg: #e8dcf5;
  --active-bg: rgba(204, 51, 136, 0.1);
  --preview-toggle-bg: #6633cc;
}`

/* ========== 花哨主题 2 — 极光 (Aurora) ========== */

const AURORA_DARK = `:root {
  --bg-primary: #0f1123;
  --bg-secondary: #1a1d3a;
  --bg-tertiary: #0f1123;
  --bg-hover: #1e2245;
  --bg-code: #0a0c1a;
  --bg-code-inline: #1a1d3a;
  --bg-preview: #0d0f1e;
  --bg-overlay: rgba(0, 0, 0, 0.6);
  --text-primary: #d4d9f0;
  --text-secondary: #8899cc;
  --text-muted: #5566aa;
  --text-strikethrough: #6677aa;
  --text-bold: #eef0ff;
  --text-code: #ff88cc;
  --text-link: #66ccff;
  --text-link-hover: #99ddff;
  --color-accent: #7c5cfc;
  --accent-hover: #9b7eff;
  --heading-h1: #ff6b9d;
  --heading-h2: #ff9a6b;
  --heading-h3: #ffd36b;
  --heading-h4: #6bffb8;
  --heading-h5: #6bb5ff;
  --heading-h6: #c06bff;
  --border-color: #25295a;
  --heading-border: #25295a;
  --hover-bg: rgba(212, 217, 240, 0.05);
  --hover-bg-strong: rgba(212, 217, 240, 0.08);
  --hover-bg-accent: rgba(124, 92, 252, 0.15);
  --accent-bg-subtle: rgba(124, 92, 252, 0.05);
  --selected-bg: rgba(124, 92, 252, 0.1);
  --settings-radio-hover: rgba(212, 217, 240, 0.03);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  --drag-bg: rgba(15, 17, 35, 0.85);
  --drag-border: #7c5cfc;
  --drag-text-bg: rgba(124, 92, 252, 0.1);
  --checkbox-accent: #6bffb8;
  --close-btn-bg: #ff6b9d;
  --scrollbar-track: #0f1123;
  --scrollbar-thumb: #25295a;
  --scrollbar-thumb-hover: #7c5cfc;
  --status-bar-bg: #0f1123;
  --active-bg: rgba(124, 92, 252, 0.15);
  --preview-toggle-bg: #4a3a8a;
}`

const AURORA_LIGHT = `:root {
  --bg-primary: #f5f0ff;
  --bg-secondary: #ece4ff;
  --bg-tertiary: #e4d8f8;
  --bg-hover: #dcccf0;
  --bg-code: #ece4ff;
  --bg-code-inline: #f0e8ff;
  --bg-preview: #faf8ff;
  --bg-overlay: rgba(0, 0, 0, 0.12);
  --text-primary: #1a1a3e;
  --text-secondary: #5555aa;
  --text-muted: #8888cc;
  --text-strikethrough: #9999cc;
  --text-bold: #0d0d2e;
  --text-code: #cc66aa;
  --text-link: #5577cc;
  --text-link-hover: #7799ee;
  --color-accent: #7c5cfc;
  --accent-hover: #6644e0;
  --heading-h1: #e05588;
  --heading-h2: #e08055;
  --heading-h3: #ccaa33;
  --heading-h4: #33aa77;
  --heading-h5: #4488cc;
  --heading-h6: #8844cc;
  --border-color: #dcccf0;
  --heading-border: #dcccf0;
  --hover-bg: rgba(26, 26, 62, 0.04);
  --hover-bg-strong: rgba(26, 26, 62, 0.07);
  --hover-bg-accent: rgba(124, 92, 252, 0.1);
  --accent-bg-subtle: rgba(124, 92, 252, 0.03);
  --selected-bg: rgba(124, 92, 252, 0.08);
  --settings-radio-hover: rgba(26, 26, 62, 0.03);
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  --drag-bg: rgba(245, 240, 255, 0.85);
  --drag-border: #7c5cfc;
  --drag-text-bg: rgba(124, 92, 252, 0.08);
  --checkbox-accent: #33aa77;
  --close-btn-bg: #e05588;
  --scrollbar-track: #ece4ff;
  --scrollbar-thumb: #dcccf0;
  --scrollbar-thumb-hover: #7c5cfc;
  --status-bar-bg: #e4d8f8;
  --active-bg: rgba(124, 92, 252, 0.1);
  --preview-toggle-bg: #7c5cfc;
}`

/* ========== 原默认主题（向后兼容） ========== */

export const DARK_THEME = `/* ===== 深色主题 (Dark Theme) ===== */
/* 所有可自定义的 CSS 变量列在此处，每个变量都附有说明。 */
/* 您可以复制此文件并修改其中的值来创建自己的主题。    */
:root {
  /* ===== 背景色 ===== */
  --bg-primary: #1a1a2e;         /* 主背景 */
  --bg-secondary: #16213e;        /* 次要背景（工具栏、标题菜单、设置对话框等） */
  --bg-tertiary: #0f1a2e;        /* 标题栏背景 */
  --bg-hover: #1a1a40;           /* 悬停背景 */
  --bg-code: #1e1e3a;            /* 代码块背景 */
  --bg-code-inline: #2d2d4e;     /* 行内代码背景 */
  --bg-preview: #12121e;         /* 预览面板背景 */
  --bg-overlay: rgba(0, 0, 0, 0.6); /* 遮罩层背景 */

  /* ===== 文字色 ===== */
  --text-primary: #e0e0e0;       /* 主要文字 */
  --text-secondary: #a8b2d1;     /* 次要文字 */
  --text-muted: #555;            /* 弱化文字（占位符、快捷提示等） */
  --text-strikethrough: #888;    /* 删除线文字 */
  --text-bold: #ffffff;          /* 加粗文字 */
  --text-code: #ff79c6;          /* 行内代码文字 */
  --text-link: #4d96ff;          /* 链接文字 */
  --text-link-hover: #6bb5ff;    /* 链接悬停文字 */
  --color-accent: #e94560;       /* 强调色（标题、按钮、边框等） */
  --accent-hover: #d63851;       /* 强调色悬停 */

  /* ===== 标题颜色 ===== */
  --heading-h1: #e94560;         /* 一级标题 */
  --heading-h2: #ff6b6b;         /* 二级标题 */
  --heading-h3: #ffa07a;         /* 三级标题 */
  --heading-h4: #ffd93d;         /* 四级标题 */
  --heading-h5: #6bcb77;         /* 五级标题 */
  --heading-h6: #4d96ff;         /* 六级标题 */

  /* ===== 边框色 ===== */
  --border-color: #0f3460;       /* 通用边框 */
  --heading-border: #0f3460;     /* 标题底部边框 */

  /* ===== 交互状态 ===== */
  --hover-bg: rgba(168, 178, 209, 0.1);         /* 悬停背景（轻微） */
  --hover-bg-strong: rgba(168, 178, 209, 0.15); /* 悬停背景（较强） */
  --hover-bg-accent: rgba(233, 69, 96, 0.15);   /* 强调悬停背景 */
  --accent-bg-subtle: rgba(233, 69, 96, 0.05);  /* 强调背景（极淡） */
  --selected-bg: rgba(233, 69, 96, 0.1);         /* 选中单元格背景 */
  --settings-radio-hover: rgba(168, 178, 209, 0.08); /* 设置项悬停 */

  /* ===== 阴影 ===== */
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);         /* 菜单阴影 */
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);    /* 对话框阴影 */

  /* ===== 拖放叠加层 ===== */
  --drag-bg: rgba(26, 26, 46, 0.85);  /* 拖放遮罩背景 */
  --drag-border: #e94560;              /* 拖放遮罩边框 */
  --drag-text-bg: rgba(233, 69, 96, 0.1); /* 拖放文字背景 */

  /* ===== 复选框 ===== */
  --checkbox-accent: #6bcb77;     /* 复选框强调色 */

  /* ===== 关闭按钮 ===== */
  --close-btn-bg: #e81123;       /* 关闭按钮悬停背景 */

  /* ===== 滚动条 ===== */
  --scrollbar-track: #1a1a2e;    /* 滚动条轨道 */
  --scrollbar-thumb: #0f3460;    /* 滚动条滑块 */
  --scrollbar-thumb-hover: #e94560; /* 滚动条滑块悬停 */

  /* ===== 状态栏 ===== */
  --status-bar-bg: #0f1a2e;      /* 状态栏背景 */

  /* ===== 侧边栏 ===== */
  --active-bg: rgba(233, 69, 96, 0.15); /* 侧边栏选中项背景 */

  /* ===== 预览面板 ===== */
  --preview-toggle-bg: #533483;  /* 预览切换按钮激活背景 */
}
`

export const LIGHT_THEME = `/* ===== 浅色主题 (Light Theme) ===== */
/* 所有可自定义的 CSS 变量列在此处，每个变量都附有说明。 */
/* 您可以复制此文件并修改其中的值来创建自己的主题。    */
:root {
  /* ===== 背景色 ===== */
  --bg-primary: #ffffff;           /* 主背景 */
  --bg-secondary: #f5f5f5;        /* 次要背景（工具栏、标题菜单、设置对话框等） */
  --bg-tertiary: #e8e8e8;         /* 标题栏背景 */
  --bg-hover: #e0e0e0;            /* 悬停背景 */
  --bg-code: #f4f4f4;             /* 代码块背景 */
  --bg-code-inline: #f5f5f5;      /* 行内代码背景 */
  --bg-preview: #fafafa;          /* 预览面板背景 */
  --bg-overlay: rgba(0, 0, 0, 0.3); /* 遮罩层背景 */

  /* ===== 文字色 ===== */
  --text-primary: #333333;         /* 主要文字 */
  --text-secondary: #666666;       /* 次要文字 */
  --text-muted: #999999;           /* 弱化文字（占位符、快捷提示等） */
  --text-strikethrough: #aaaaaa;   /* 删除线文字 */
  --text-bold: #000000;            /* 加粗文字 */
  --text-code: #c7254e;            /* 行内代码文字 */
  --text-link: #1a73e8;            /* 链接文字 */
  --text-link-hover: #1557b0;      /* 链接悬停文字 */
  --color-accent: #e94560;         /* 强调色（标题、按钮、边框等） */
  --accent-hover: #d63851;         /* 强调色悬停 */

  /* ===== 标题颜色 ===== */
  --heading-h1: #e94560;           /* 一级标题 */
  --heading-h2: #e65555;           /* 二级标题 */
  --heading-h3: #e68a55;           /* 三级标题 */
  --heading-h4: #c8960e;           /* 四级标题 */
  --heading-h5: #4a9e5a;           /* 五级标题 */
  --heading-h6: #3a7bd5;           /* 六级标题 */

  /* ===== 边框色 ===== */
  --border-color: #dddddd;         /* 通用边框 */
  --heading-border: #dddddd;       /* 标题底部边框 */

  /* ===== 交互状态 ===== */
  --hover-bg: rgba(0, 0, 0, 0.05);         /* 悬停背景（轻微） */
  --hover-bg-strong: rgba(0, 0, 0, 0.08);  /* 悬停背景（较强） */
  --hover-bg-accent: rgba(233, 69, 96, 0.1); /* 强调悬停背景 */
  --accent-bg-subtle: rgba(233, 69, 96, 0.03); /* 强调背景（极淡） */
  --selected-bg: rgba(233, 69, 96, 0.08);      /* 选中单元格背景 */
  --settings-radio-hover: rgba(0, 0, 0, 0.03); /* 设置项悬停 */

  /* ===== 阴影 ===== */
  --menu-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);         /* 菜单阴影 */
  --settings-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);   /* 对话框阴影 */

  /* ===== 拖放叠加层 ===== */
  --drag-bg: rgba(255, 255, 255, 0.85); /* 拖放遮罩背景 */
  --drag-border: #e94560;               /* 拖放遮罩边框 */
  --drag-text-bg: rgba(233, 69, 96, 0.08); /* 拖放文字背景 */

  /* ===== 复选框 ===== */
  --checkbox-accent: #4a9e5a;       /* 复选框强调色 */

  /* ===== 关闭按钮 ===== */
  --close-btn-bg: #e81123;          /* 关闭按钮悬停背景 */

  /* ===== 滚动条 ===== */
  --scrollbar-track: #f0f0f0;       /* 滚动条轨道 */
  --scrollbar-thumb: #cccccc;       /* 滚动条滑块 */
  --scrollbar-thumb-hover: #999999; /* 滚动条滑块悬停 */

  /* ===== 状态栏 ===== */
  --status-bar-bg: #e8e8e8;        /* 状态栏背景 */

  /* ===== 侧边栏 ===== */
  --active-bg: rgba(233, 69, 96, 0.12); /* 侧边栏选中项背景 */

  /* ===== 预览面板 ===== */
  --preview-toggle-bg: #533483;  /* 预览切换按钮激活背景 */
}
`

/* ========== 主题注册表 ========== */

export const THEMES = [
  { name: 'dark', label: '深色主题', css: DARK_THEME, builtin: true },
  { name: 'light', label: '浅色主题', css: LIGHT_THEME, builtin: true },
  { name: 'nord-dark', label: 'Nord 深色', css: NORD_DARK, builtin: true },
  { name: 'nord-light', label: 'Nord 浅色', css: NORD_LIGHT, builtin: true },
  { name: 'warm-dark', label: '暖色 深色', css: WARM_DARK, builtin: true },
  { name: 'warm-light', label: '暖色 浅色', css: WARM_LIGHT, builtin: true },
  { name: 'neon-dark', label: '霓虹 深色', css: NEON_DARK, builtin: true },
  { name: 'neon-light', label: '霓虹 浅色', css: NEON_LIGHT, builtin: true },
  { name: 'aurora-dark', label: '极光 深色', css: AURORA_DARK, builtin: true },
  { name: 'aurora-light', label: '极光 浅色', css: AURORA_LIGHT, builtin: true },
]
