import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { matrixAPI, handleAPIError } from '../../services/api'
import { useApp } from '../../contexts/AppContext'
import { useMatrix } from '../../contexts/MatrixContext'

/**
 * 矩阵设备连接组件 (Claude风格 - 琥珀棕倾向)
 */
function DeviceConnection() {
  const { addLog } = useApp()
  const { isConnected, setIsConnected, selectedPort, setSelectedPort, setIsConnecting } = useMatrix()
  const [connectionType, setConnectionType] = useState('network')
  const [availablePorts, setAvailablePorts] = useState([])
  const [loading, setLoading] = useState(false)
  const [baudRate, setBaudRate] = useState('115200')
  const [deviceIP, setDeviceIP] = useState('192.168.2.11')
  const [devicePort, setDevicePort] = useState('5025')

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

  const handleConnect = async () => {
    setLoading(true)
    setIsConnecting(true)
    try {
      if (connectionType === 'network') {
        if (!deviceIP || !devicePort) {
          addLog('请输入设备IP和端口', 'warning')
          setLoading(false)
          return
        }
        const response = await matrixAPI.connect({ type: 'network', ip: deviceIP, port: parseInt(devicePort) })
        if (response.data.success) {
          setIsConnected(true)
          addLog(`成功连接到 ${deviceIP}:${devicePort}`, 'success')
          addLog(`使用TCP/IP网络连接`, 'info')
        } else {
          addLog(`连接失败，请检查设备连接`, 'error')
        }
      } else {
        if (!selectedPort) {
          addLog('请先选择一个端口', 'warning')
          setLoading(false)
          return
        }
        const response = await matrixAPI.connect({ type: 'serial', port: selectedPort, baudrate: parseInt(baudRate) })
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
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setIsConnecting(true)
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
      setIsConnecting(false)
    }
  }

  useEffect(() => {
    fetchPorts()
  }, [])

  return (
    <div className="card-matrix">
      <div className="flex items-center space-x-2 mb-4">
        <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="w-5 h-5" style={{ color: 'var(--matrix-primary)' }} /> :
              <WifiOff className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />}
            设备连接
          </div>
        </h2>
        <button onClick={fetchPorts} disabled={loading} className="p-2 rounded-lg transition-colors"
          style={{ background: loading ? 'transparent' : 'var(--bg-secondary)', opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          title="刷新端口列表">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-tertiary)' }} />
        </button>
      </div>

      {/* 连接方式选择 */}
      <div className="mb-4">
        <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>连接方式</label>
        <div className="grid grid-cols-2 gap-2">
          {['network', 'serial'].map((type) => (
            <button key={type} onClick={() => setConnectionType(type)} disabled={isConnected}
              className="py-2 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: connectionType === type ? 'var(--matrix-primary)' : 'var(--bg-secondary)',
                color: connectionType === type ? '#FFF' : 'var(--text-secondary)',
                opacity: isConnected ? 0.5 : 1,
                cursor: isConnected ? 'not-allowed' : 'pointer'
              }}>
              {type === 'network' ? '网络 (TCP/IP)' : '串口 (COM)'}
            </button>
          ))}
        </div>
      </div>

      {/* 连接配置 */}
      <div className="space-y-4">
        {connectionType === 'network' ? (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>设备IP地址</label>
              <input type="text" value={deviceIP} onChange={(e) => setDeviceIP(e.target.value)} disabled={isConnected || loading}
                className="input-gold font-mono" placeholder="192.168.2.11" />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>默认: 192.168.2.11</p>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>设备端口号</label>
              <input type="number" value={devicePort} onChange={(e) => setDevicePort(e.target.value)} disabled={isConnected || loading}
                className="input-gold font-mono" placeholder="5025" min="1" max="65535" />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>默认: 5025</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>选择串口 (COM Port)</label>
              <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)} disabled={isConnected || loading} className="select-gold w-full">
                <option value="">-- 请选择端口 --</option>
                {availablePorts.map(port => (<option key={port} value={port}>{port}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>波特率 (Baud Rate)</label>
              <select value={baudRate} onChange={(e) => setBaudRate(e.target.value)} disabled={isConnected || loading} className="select-gold w-full">
                {['9600', '19200', '38400', '57600', '115200'].map(rate => (<option key={rate} value={rate}>{rate}</option>))}
              </select>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>建议使用 115200 bps</p>
            </div>
          </>
        )}

        {/* 连接/断开按钮 */}
        <button onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={loading || (!isConnected && connectionType === 'serial' && !selectedPort)}
          className="w-full py-3 rounded-lg font-medium transition-colors"
          style={{
            backgroundColor: isConnected ? 'var(--color-error)' : 'var(--matrix-primary)',
            color: '#FFF',
            opacity: (loading || (!isConnected && connectionType === 'serial' && !selectedPort)) ? 0.5 : 1,
            cursor: (loading || (!isConnected && connectionType === 'serial' && !selectedPort)) ? 'not-allowed' : 'pointer'
          }}>
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
