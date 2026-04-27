import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'

const savedTheme = localStorage.getItem('appTheme') || 'dark'
window.electronAPI.loadTheme(savedTheme).then(result => {
  if (result && result.css) {
    const el = document.createElement('style')
    el.id = 'app-theme'
    el.textContent = result.css
    document.head.appendChild(el)
  }
}).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
