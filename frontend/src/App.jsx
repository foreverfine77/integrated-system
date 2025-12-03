import { AppProvider } from './contexts/AppContext'
import { MatrixProvider } from './contexts/MatrixContext'
import { VNAProvider } from './contexts/VNAContext'
import { useState } from 'react'
import { Activity, Shuffle, SeparatorHorizontal } from 'lucide-react'
import MatrixModule from './components/MatrixModule'
import VNAModule from './components/VNAModule'
import ErrorBoundary from './components/ErrorBoundary'
import ThemeToggle from './components/ThemeToggle'
import { useApp } from './contexts/AppContext'

/**
 * 主应用内容组件
 */
function AppContent() {
  const { addLog } = useApp()
  const [activeTab, setActiveTab] = useState('matrix')

  return (
    <ErrorBoundary addLog={addLog}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        {/* 顶部标题栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-md border-b border-slate-200 dark:border-gray-700">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SeparatorHorizontal className="h-9 w-9 text-slate-700 dark:text-gray-300" />
                <div>
                  <h1 className="text-2xl font-semibold text-slate-800 dark:text-gray-100">
                    多通道系统测试软件
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-gray-400">Multichannel Test System</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-gray-400">
                <ThemeToggle />
                <div className="px-3 py-1 bg-slate-100 dark:bg-gray-700 dark:text-gray-300 rounded-md">v1.0.1</div>
              </div>
            </div>
          </div>
        </header>

        {/* 标签页导航 */}
        <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="container mx-auto px-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`
                  flex items-center space-x-2 px-6 py-3 font-medium transition-all
                  ${activeTab === 'matrix'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Shuffle className="h-5 w-5" />
                <span>矩阵开关控制</span>
              </button>

              <button
                onClick={() => setActiveTab('vna')}
                className={`
                  flex items-center space-x-2 px-6 py-3 font-medium transition-all
                  ${activeTab === 'vna'
                    ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Activity className="h-5 w-5" />
                <span>矢量网络分析仪</span>
              </button>
            </div>
          </div>
        </div>

        {/* 主要内容区域 */}
        <main className="container mx-auto px-6 py-6">
          <div className={activeTab === 'matrix' ? '' : 'hidden'}>
            <MatrixModule />
          </div>
          <div className={activeTab === 'vna' ? '' : 'hidden'}>
            <VNAModule />
          </div>
        </main>

        {/* 底部信息栏 */}
        <footer className="bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700 mt-8">
          <div className="container mx-auto px-6 py-3 text-center text-sm text-slate-500 dark:text-gray-400">
            多通道系统测试软件 © 2025 - 矩阵开关控制 & 矢量网络分析仪测量
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

/**
 * 主应用组件 - 多通道系统测试软件
 * 使用Context API管理全局状态
 */
function App() {
  return (
    <AppProvider>
      <MatrixProvider>
        <VNAProvider>
          <AppContent />
        </VNAProvider>
      </MatrixProvider>
    </AppProvider>
  )
}

export default App
