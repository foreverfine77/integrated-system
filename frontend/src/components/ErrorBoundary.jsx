import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * 错误边界组件
 * 捕获React组件树中的错误，防止整个应用崩溃
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true }
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo)

        this.setState({
            error,
            errorInfo,
        })

        // 如果有addLog函数，记录到系统日志
        if (this.props.addLog) {
            this.props.addLog(
                `应用错误: ${error.message}`,
                'error',
                'system'
            )
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8 max-w-2xl w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                            <h1 className="text-2xl font-bold text-slate-800">
                                应用程序出错了
                            </h1>
                        </div>

                        <div className="mb-6">
                            <p className="text-slate-600 mb-2">
                                抱歉，应用程序遇到了一个意外错误。
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                                <p className="text-sm font-mono text-red-800">
                                    {this.state.error && this.state.error.toString()}
                                </p>
                            </div>
                        </div>

                        {/* 详细错误信息（折叠） */}
                        {this.state.errorInfo && (
                            <details className="mb-6">
                                <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
                                    查看详细错误信息
                                </summary>
                                <pre className="mt-2 bg-slate-100 p-4 rounded text-xs overflow-auto max-h-64">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                尝试恢复
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md transition-colors"
                            >
                                刷新页面
                            </button>
                        </div>

                        <div className="mt-6 p-4 bg-slate-50 rounded-md border border-slate-200">
                            <p className="text-xs text-slate-600">
                                <strong>建议操作：</strong>
                            </p>
                            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
                                <li>点击"尝试恢复"返回应用</li>
                                <li>如果问题持续，尝试"刷新页面"</li>
                                <li>检查控制台(F12)查看更多错误信息</li>
                                <li>如仍无法解决，请联系技术支持</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
