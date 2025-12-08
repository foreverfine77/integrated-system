import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

/**
 * Toast通知组件 (Claude风格)
 * 用于显示成功、错误、警告等消息
 */
function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [duration, onClose])

    const styles = {
        success: {
            bg: 'rgba(127, 140, 84, 0.1)',
            border: 'var(--color-success)',
            text: 'var(--text-primary)',
            icon: <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
        },
        error: {
            bg: 'rgba(139, 69, 19, 0.1)',
            border: 'var(--color-error)',
            text: 'var(--text-primary)',
            icon: <XCircle className="w-5 h-5" style={{ color: 'var(--color-error)' }} />
        },
        warning: {
            bg: 'rgba(184, 134, 11, 0.1)',
            border: 'var(--color-warning)',
            text: 'var(--text-primary)',
            icon: <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
        },
        info: {
            bg: 'rgba(127, 140, 84, 0.1)',
            border: 'var(--color-info)',
            text: 'var(--text-primary)',
            icon: <AlertCircle className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
        }
    }

    const style = styles[type] || styles.info

    return (
        <div className="toast fixed top-4 right-4 z-50 flex items-center gap-3 animate-slide-in-right"
            style={{
                backgroundColor: style.bg,
                borderColor: style.border,
                color: style.text
            }}>
            {style.icon}
            <p className="flex-1" style={{ fontWeight: 'var(--weight-medium)' }}>{message}</p>
            <button onClick={onClose} className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.5)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

export default Toast
