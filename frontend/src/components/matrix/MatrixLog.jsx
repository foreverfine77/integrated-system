import { ScrollText, Trash2, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * 日志显示组件
 * 实时显示系统日志和操作记录
 * 
 * @param {Array} logs - 日志数组
 * @param {function} onClear - 清空日志的回调函数
 */
function LogDisplay({ logs, onClear }) {
  // 用于自动滚动到最新日志
  const logEndRef = useRef(null)

  /**
   * 自动滚动到最底部
   * 当有新日志添加时，自动滚动显示最新内容
   */
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  /**
   * 根据日志类型返回对应的样式类
   */
  const getLogStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
    }
  }

  /**
   * 根据日志类型返回图标
   */
  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
      <div className="flex items-center space-x-2 mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">系统日志</h2>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
            {logs.length}
          </span>
        </div>

        {/* 清空日志按钮 */}
        {logs.length > 0 && (
          <button
            onClick={onClear}
            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
            title="清空日志"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 日志显示区域 */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          // 空状态提示
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ScrollText className="w-12 h-12 mb-2" />
            <p className="text-sm">暂无日志记录</p>
          </div>
        ) : (
          // 日志列表
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border ${getLogStyle(log.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getLogIcon(log.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm break-words">{log.message}</p>
                    <p className="text-xs opacity-70 mt-1">{log.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* 用于自动滚动的锚点 */}
            <div ref={logEndRef} />
          </div>
        )}
      </div>

      {/* 日志统计信息 */}
      {logs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="text-xs">
              <div className="text-gray-500">成功</div>
              <div className="font-bold text-green-600">
                {logs.filter(l => l.type === 'success').length}
              </div>
            </div>
            <div className="text-xs">
              <div className="text-gray-500">错误</div>
              <div className="font-bold text-red-600">
                {logs.filter(l => l.type === 'error').length}
              </div>
            </div>
            <div className="text-xs">
              <div className="text-gray-500">警告</div>
              <div className="font-bold text-yellow-600">
                {logs.filter(l => l.type === 'warning').length}
              </div>
            </div>
            <div className="text-xs">
              <div className="text-gray-500">信息</div>
              <div className="font-bold text-blue-600">
                {logs.filter(l => l.type === 'info').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogDisplay

