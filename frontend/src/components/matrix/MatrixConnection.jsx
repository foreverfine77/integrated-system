import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { matrixAPI, handleAPIError } from '../../services/api'
import { useApp } from '../../contexts/AppContext'
import { useMatrix } from '../../contexts/MatrixContext'

/**
 * 设备连接组件
 * 负责管理与硬件设备的串口连接
 * 
 * @param {boolean} isConnected - 连接状态
 * @param {function} setIsConnected - 更新连接状态的函数
 * @param {string} selectedPort - 当前选择的端口
 * @param {function} setSelectedPort - 更新选择端口的函数
 * @param {function} addLog - 添加日志的函数
 */
function DeviceConnection() {
  const { addLog } = useApp()
  const { isConnected, setIsConnected, selectedPort, setSelectedPort, setIsConnecting } = useMatrix()
  // 连接类型：'network' 网络连接, 'serial' 串口连接
  const [connectionType, setConnectionType] = useState('network')
  // 可用端口列表
  const [availablePorts, setAvailablePorts] = useState([])
  // 加载状态
  const [loading, setLoading] = useState(false)
  // 波特率设置
  const [baudRate, setBaudRate] = useState('115200')
  // 网络连接配置
  const [deviceIP, setDeviceIP] = useState('192.168.2.11')
  const [devicePort, setDevicePort] = useState('5025')

  /**
   * 获取可用的串口列表
   * 从后端API获取系统中所有可用的COM端口
   */
  const fetchPorts = async () => {
    setLoading(true)
    try {
      const response = await matrixAPI.getPorts()
      setAvailablePorts(response.data.ports)
      addLog(`发现 ${response.data.ports.length} 个可用端口`, 'success')
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 连接到设备（支持网络和串口两种方式）
   */
  const handleConnect = async () => {
    setLoading(true)
    setIsConnecting(true) // 标记开始连接
    try {
      if (connectionType === 'network') {
        // ========== 网络连接 ==========
        if (!deviceIP || !devicePort) {
          addLog('请输入设备IP和端口', 'warning')
          setLoading(false)
          return
        }

        const response = await matrixAPI.connect({
          type: 'network',
          ip: deviceIP,
          port: parseInt(devicePort)
        })

        if (response.data.success) {
          setIsConnected(true)
          addLog(`成功连接到 ${deviceIP}:${devicePort}`, 'success')
          addLog(`使用TCP/IP网络连接`, 'info')
        } else {
          addLog(`连接失败，请检查设备连接`, 'error')

        }
      } else {
        // ========== 串口连接 ==========
        if (!selectedPort) {
          addLog('请先选择一个端口', 'warning')
          setLoading(false)
          return
        }

        const response = await matrixAPI.connect({
          type: 'serial',
          port: selectedPort,
          baudrate: parseInt(baudRate)
        })

        if (response.data.success) {
          setIsConnected(true)
          addLog(`成功连接到 ${selectedPort}`, 'success')
          addLog(`使用串口连接`, 'info')
        } else {
          addLog(`连接失败，请检查设备连接`, 'error')

        }
      }
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setLoading(false)
      setIsConnecting(false) // 连接操作完成
    }
  }

  /**
   * 断开串口连接
   */
  const handleDisconnect = async () => {
    setLoading(true)
    setIsConnecting(true) // 标记开始断开
    try {
      const response = await matrixAPI.disconnect()
      if (response.data.success) {
        setIsConnected(false)
        addLog(`已断开连接`, 'info')
      }
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setLoading(false)
      setIsConnecting(false) // 断开操作完成
    }
  }

  // 组件加载时自动获取端口列表
  useEffect(() => {
    fetchPorts()
  }, [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
      <div className="flex items-center space-x-2 mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {isConnected ? <Wifi className="w-5 h-5 text-blue-600" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
          设备连接
        </h2>
        <button
          onClick={fetchPorts}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="刷新端口列表"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>


      {/* 连接方式选择 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          连接方式
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setConnectionType('network')}
            disabled={isConnected}
            className={`py-2 px-4 rounded-lg font-medium transition-colors ${connectionType === 'network'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            网络 (TCP/IP)
          </button>
          <button
            onClick={() => setConnectionType('serial')}
            disabled={isConnected}
            className={`py-2 px-4 rounded-lg font-medium transition-colors ${connectionType === 'serial'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } ${isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            串口 (COM)
          </button>
        </div>
      </div>

      {/* 连接配置 */}
      <div className="space-y-4">
        {connectionType === 'network' ? (
          // ========== 网络连接配置 ==========
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备IP地址
              </label>
              <input
                type="text"
                value={deviceIP}
                onChange={(e) => setDeviceIP(e.target.value)}
                disabled={isConnected || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono"
                placeholder="192.168.2.11"
              />
              <p className="text-xs text-gray-500 mt-1">默认: 192.168.2.11</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备端口号
              </label>
              <input
                type="number"
                value={devicePort}
                onChange={(e) => setDevicePort(e.target.value)}
                disabled={isConnected || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 font-mono"
                placeholder="5025"
                min="1"
                max="65535"
              />
              <p className="text-xs text-gray-500 mt-1">默认: 5025</p>
            </div>
          </>
        ) : (
          // ========== 串口连接配置 ==========
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择串口 (COM Port)
              </label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={isConnected || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">-- 请选择端口 --</option>
                {availablePorts.map(port => (
                  <option key={port} value={port}>{port}</option>
                ))}
              </select>
            </div>

            {/* 波特率选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                波特率 (Baud Rate)
              </label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                disabled={isConnected || loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="9600">9600</option>
                <option value="19200">19200</option>
                <option value="38400">38400</option>
                <option value="57600">57600</option>
                <option value="115200">115200</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">建议使用 115200 bps</p>
            </div>
          </>
        )}

        {/* 连接/断开按钮 */}
        <button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={loading || (!isConnected && connectionType === 'serial' && !selectedPort)}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${isConnected
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-blue-600 hover:bg-gray-800 text-white disabled:opacity-50'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              处理中...
            </span>
          ) : (
            isConnected ? '断开连接' : '连接设备'
          )}
        </button>
      </div>
    </div>
  )
}

export default DeviceConnection

