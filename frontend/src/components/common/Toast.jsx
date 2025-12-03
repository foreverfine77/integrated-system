import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

/**
 * Toast通知组件
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
            bg: 'bg-emerald-50',
            border: 'border-emerald-200',
            text: 'text-emerald-800',
            icon: <CheckCircle className="w-5 h-5 text-emerald-600" />
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-800',
            icon: <XCircle className="w-5 h-5 text-red-600" />
        },
        warning: {
            bg: 'bg-amber-50',
            border: 'border-amber-200',
            text: 'text-amber-800',
            icon: <AlertCircle className="w-5 h-5 text-amber-600" />
        }
    }

    const style = styles[type] || styles.info

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${style.bg} ${style.border} ${style.text} max-w-md animate-slide-in-right`}>
            {style.icon}
            <p className="flex-1 font-medium">{message}</p>
            <button
                onClick={onClose}
                className="p-1 hover:bg-white/50 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

export default Toast
