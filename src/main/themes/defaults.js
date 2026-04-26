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

  /* ===== 预览面板 ===== */
  --preview-toggle-bg: #533483;  /* 预览切换按钮激活背景 */
}
`;

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

  /* ===== 预览面板 ===== */
  --preview-toggle-bg: #533483;  /* 预览切换按钮激活背景 */
}
`;
