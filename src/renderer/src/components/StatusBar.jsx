import React from 'react'

function StatusBar({ filePath, modified, tabs }) {
  return (
    <div className="status-bar">
      <span className="status-bar-left">
        {tabs.length > 0 ? `${tabs.length} 个标签页` : ''}
      </span>
      <span className="status-bar-right">
        {filePath || '未保存'}
        {modified ? ' (已修改)' : ''}
      </span>
    </div>
  )
}

export default StatusBar
