import { useEffect } from 'react'
import MatrixConnection from './matrix/MatrixConnection'
import MatrixPanel from './matrix/MatrixPanel'
import MatrixCommand from './matrix/MatrixCommand'
import MatrixLog from './matrix/MatrixLog'
import { matrixAPI, handleAPIError } from '../services/api'
import { useApp } from '../contexts/AppContext'
import { useMatrix } from '../contexts/MatrixContext'

/**
 * 矩阵开关控制模块
 * 整合连接管理、控制面板、命令输入和日志显示
 */
function MatrixModule() {
  const { logs, addLog, clearLogs } = useApp()
  const { isConnected, setIsConnected, selectedPort, setSelectedPort, isConnecting, setIsConnecting } = useMatrix()

  useEffect(() => {
    const syncConnectionStatus = async () => {
      // 如果正在进行连接操作，跳过同步（避免状态冲突）
      if (isConnecting) {
        return
      }

      try {
        const response = await matrixAPI.getStatus()
        if (response.data.connected) {
          setIsConnected(true)
          // 如果后端已连接，同步端口信息
          if (response.data.port) {
            setSelectedPort(response.data.port)
          }
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        setIsConnected(false)
      }
    }

    // 立即同步一次
    syncConnectionStatus()

    // 每5秒同步一次（防止状态不同步）
    const interval = setInterval(syncConnectionStatus, 5000)

    return () => clearInterval(interval)
  }, [isConnecting]) // 依赖isConnecting，连接状态变化时重新设置定时器



  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：连接和命令面板 */}
      <div className="lg:col-span-1 space-y-6">
        <MatrixConnection />

        <MatrixCommand />
      </div>

      {/* 中间：矩阵控制面板 */}
      <div className="lg:col-span-1">
        <MatrixPanel />
      </div>

      {/* 右侧：日志显示 */}
      <div className="lg:col-span-1">
        <MatrixLog
          logs={logs}
          onClear={clearLogs}
        />
      </div>
    </div>
  )
}

export default MatrixModule

