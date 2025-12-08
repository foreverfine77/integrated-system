import { ScrollText, Trash2, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * 日志显示组件 (Claude风格 - 琥珀棕倾向)
 */
function LogDisplay({ logs, onClear }) {
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getLogStyle = (type) => {
    switch (type) {
      case 'success':
        return { bg: 'rgba(127, 140, 84, 0.1)', border: 'var(--color-success)', text: 'var(--color-success)' }
      case 'error':
        return { bg: 'rgba(139, 69, 19, 0.1)', border: 'var(--color-error)', text: 'var(--color-error)' }
      case 'warning':
        return { bg: 'rgba(184, 134, 11, 0.1)', border: 'var(--color-warning)', text: 'var(--color-warning)' }
      default:
        return { bg: 'rgba(127, 140, 84, 0.1)', border: 'var(--color-info)', text: 'var(--color-info)' }
    }
  }

  const getLogIcon = (type) => {
    const iconStyle = { width: '1rem', height: '1rem' }
    switch (type) {
      case 'success':
        return <CheckCircle style={{ ...iconStyle, color: 'var(--color-success)' }} />
      case 'error':
        return <XCircle style={{ ...iconStyle, color: 'var(--color-error)' }} />
      case 'warning':
        return <AlertTriangle style={{ ...iconStyle, color: 'var(--color-warning)' }} />
      default:
        return <MessageSquare style={{ ...iconStyle, color: 'var(--text-tertiary)' }} />
    }
  }

  return (
    <div className="card-matrix">
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5" style={{ color: 'var(--matrix-primary)' }} />
          <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>系统日志</h2>
          <span className="text-xs px-2 py-1 rounded-full" style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-secondary)'
          }}>
            {logs.length}
          </span>
        </div>

        {logs.length > 0 && (
          <button onClick={onClear} className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--color-error)' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(139, 69, 19, 0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            title="清空日志">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 日志显示区域 */}
      <div className="rounded-lg border p-4 h-[600px] overflow-y-auto" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-medium)'
      }}>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--text-tertiary)' }}>
            <ScrollText className="w-12 h-12 mb-2" />
            <p style={{ fontSize: 'var(--text-sm)' }}>暂无日志记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const style = getLogStyle(log.type)
              return (
                <div key={log.id} className="p-3 rounded-lg border" style={{
                  backgroundColor: style.bg,
                  borderColor: style.border
                }}>
                  <div className="flex items-start gap-2">
                    {getLogIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <p className="break-words" style={{ fontSize: 'var(--text-sm)', color: style.text }}>{log.message}</p>
                      <p className="mt-1" style={{ fontSize: 'var(--text-xs)', opacity: 0.7, color: style.text }}>{log.timestamp}</p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {/* 日志统计信息 */}
      {logs.length > 0 && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: '成功', type: 'success', color: 'var(--color-success)' },
              { label: '错误', type: 'error', color: 'var(--color-error)' },
              { label: '警告', type: 'warning', color: 'var(--color-warning)' },
              { label: '信息', type: 'info', color: 'var(--color-info)' }
            ].map(({ label, type, color }) => (
              <div key={type} style={{ fontSize: 'var(--text-xs)' }}>
                <div style={{ color: 'var(--text-tertiary)' }}>{label}</div>
                <div style={{ fontWeight: 'var(--weight-bold)', color }}>
                  {logs.filter(l => l.type === type).length}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LogDisplay
