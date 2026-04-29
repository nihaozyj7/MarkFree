import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'

const AboutDialog = memo(function AboutDialog({ onClose }) {
  const [closing, setClosing] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setOpen(true))
  }, [])

  const startClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onClose(), 200)
  }, [onClose])

  const chromeVersion = useMemo(() => navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || '—', [])
  const electronVersion = useMemo(() => navigator.userAgent.match(/Electron\/(\S+)/)?.[1] || '—', [])

  return (
    <div className={`settings-overlay${open ? ' open' : ''}${closing ? ' closing' : ''}`} onClick={startClose}>
      <div className={`settings-dialog about-dialog${open ? ' open' : ''}${closing ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <span>关于 MarkFree</span>
          <button className="settings-close-btn" onClick={startClose}>✕</button>
        </div>
        <div className="settings-body about-body">
          <div className="about-logo">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <h2 className="about-app-name">MarkFree</h2>
          <p className="about-version">版本 1.3.0</p>
          <p className="about-desc">
            一个基于 Electron、React 和 TipTap 的<br />所见即所得 Markdown 编辑器。
          </p>

          <div className="about-divider" />

          <a className="about-link" href="https://github.com/nihaozyj7/MarkFree" onClick={e => {
            e.preventDefault()
            window.open('https://github.com/nihaozyj7/MarkFree', '_blank')
          }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>

          <div className="about-divider" />

          <div className="about-tech">
            <h3 className="about-section-title">技术栈</h3>
            <div className="about-tech-grid">
              <div className="about-tech-item">
                <span className="about-tech-label">Electron</span>
                <span className="about-tech-value">33</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">React</span>
                <span className="about-tech-value">18</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">TipTap</span>
                <span className="about-tech-value">2</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">Vite</span>
                <span className="about-tech-value">5</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">ProseMirror</span>
                <span className="about-tech-value">—</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">lowlight</span>
                <span className="about-tech-value">—</span>
              </div>
            </div>
          </div>

          <div className="about-divider" />

          <div className="about-runtime">
            <h3 className="about-section-title">运行环境</h3>
            <div className="about-tech-grid">
              <div className="about-tech-item">
                <span className="about-tech-label">Chrome</span>
                <span className="about-tech-value">{chromeVersion}</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">Node.js</span>
                <span className="about-tech-value">{electronVersion}</span>
              </div>
              <div className="about-tech-item">
                <span className="about-tech-label">平台</span>
                <span className="about-tech-value">{window.electronAPI?.platform === 'win32' ? 'Windows' : window.electronAPI?.platform === 'darwin' ? 'macOS' : 'Linux'}</span>
              </div>
            </div>
          </div>

          <div className="about-divider" />

          <div className="about-features">
            <h3 className="about-section-title">主要功能</h3>
            <ul className="about-feature-list">
              <li>Markdown 实时预览</li>
              <li>多标签页编辑</li>
              <li>语法高亮代码块（支持 11 种语言）</li>
              <li>图片插入（Base64 / 相对路径 / 绝对路径）</li>
              <li>表格编辑</li>
              <li>任务列表</li>
              <li>自定义主题（深色 / 浅色）</li>
              <li>可自定义快捷键</li>
              <li>.md 文件关联（Windows）</li>
              <li>导出 HTML</li>
            </ul>
          </div>

          <div className="about-divider" />

          <p className="about-copyright">© 2026 MarkFree</p>
        </div>
      </div>
    </div>
  )
})

export default AboutDialog
