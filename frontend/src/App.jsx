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
 * 主应用内容组件 (Claude风格)
 */
function AppContent() {
  const { addLog } = useApp()
  const [activeTab, setActiveTab] = useState('matrix')

  return (
    <ErrorBoundary addLog={addLog}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* 顶部标题栏 */}
        <header style={{
          backgroundColor: 'var(--bg-card)',
          boxShadow: 'var(--shadow-md)',
          borderBottom: '1px solid var(--border-light)'
        }}>
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SeparatorHorizontal className="h-9 w-9" style={{ color: 'var(--accent-gold)' }} />
                <div>
                  <h1 className="font-heading" style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--text-primary)'
                  }}>
                    多通道系统测试软件
                  </h1>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-tertiary)'
                  }}>Multichannel Test System</p>
                </div>
              </div>

              <div className="flex items-center space-x-2" style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-tertiary)'
              }}>
                <ThemeToggle />
                <div style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)'
                }}>v1.0.1</div>
              </div>
            </div>
          </div>
        </header>

        {/* 标签页导航 */}
        <div className="tab-nav" style={{
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div className="container mx-auto px-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('matrix')}
                className={`tab-item ${activeTab === 'matrix' ? 'tab-item-active' : ''}`}
                style={{
                  color: activeTab === 'matrix' ? 'var(--matrix-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center space-x-2">
                  <Shuffle className="h-5 w-5" />
                  <span>矩阵开关控制</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('vna')}
                className={`tab-item ${activeTab === 'vna' ? 'tab-item-active' : ''}`}
                style={{
                  color: activeTab === 'vna' ? 'var(--vna-primary)' : 'var(--text-secondary)'
                }}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>矢量网络分析仪</span>
                </div>
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
        <footer style={{
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-light)',
          marginTop: '2rem'
        }}>
          <div className="container mx-auto px-6 py-3 text-center" style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-tertiary)'
          }}>
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
