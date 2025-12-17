import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Power, Clock, X } from 'lucide-react'
import Toast from '../common/Toast'
import { vnaAPI } from '../../services/api'
import { useAPICall } from '../../hooks/useAPICall'
import { callAPI } from '../../services/apiWrapper'

/**
 * VNA设备连接组件 (Claude风格)
 */
function VNAConnection({ selectedDevice, onDeviceSelect, onConnectionChange, addLog }) {
    const [devices, setDevices] = useState([])
    const [isConnected, setIsConnected] = useState(false)

    // 使用useAPICall自动管理loading状态
    const { isLoading, execute } = useAPICall()

    const [ipAddress, setIpAddress] = useState('169.254.143.122')
    const [port, setPort] = useState('5025')
    const [selectedDeviceType, setSelectedDeviceType] = useState('rohde-zna26')
    const [ipHistory, setIpHistory] = useState([])
    const [showIpHistory, setShowIpHistory] = useState(false)
    const [toast, setToast] = useState(null)

    const fetchDevices = async () => {
        try {
            await execute(
                () => vnaAPI.getDevices(),
                {
                    addLog,
                    source: 'vna',
                    validateResponse: false,
                    onSuccess: (data) => setDevices(data)
                }
            )
        } catch {
            // 错误已处理
        }
    }

    useEffect(() => {
        fetchDevices()
        const savedIpHistory = localStorage.getItem('vna_ip_history')
        if (savedIpHistory) {
            try {
                setIpHistory(JSON.parse(savedIpHistory))
            } catch (error) {
                console.error('加载历史IP失败:', error)
            }
        }
    }, [])

    useEffect(() => {
        if (devices.length > 0 && !devices.find(d => d.id === selectedDeviceType)) {
            setSelectedDeviceType(devices[0].id)
        }
    }, [devices, selectedDeviceType])

    const saveIpToHistory = (ip, portNum) => {
        const entry = { ip, port: portNum, timestamp: new Date().toLocaleString('zh-CN'), deviceType: selectedDeviceType }
        const newHistory = [entry, ...ipHistory.filter(item => item.ip !== ip || item.port !== portNum)].slice(0, 10)
        setIpHistory(newHistory)
        localStorage.setItem('vna_ip_history', JSON.stringify(newHistory))
    }

    const selectFromHistory = (item) => {
        setIpAddress(item.ip)
        setPort(String(item.port))
        setSelectedDeviceType(item.deviceType)
        setShowIpHistory(false)
    }

    const removeFromHistory = (ip, portNum) => {
        const newHistory = ipHistory.filter(item => !(item.ip === ip && item.port === portNum))
        setIpHistory(newHistory)
        localStorage.setItem('vna_ip_history', JSON.stringify(newHistory))
    }

    const handleConnect = async () => {
        const portNum = parseInt(port)

        try {
            await execute(
                () => vnaAPI.connect({ device_type: selectedDeviceType, ip_address: ipAddress, port: portNum }),
                {
                    successMessage: '设备连接成功！',
                    addLog,
                    source: 'vna',
                    showToast: setToast,
                    onSuccess: () => {
                        setIsConnected(true)
                        onConnectionChange?.(true)
                        onDeviceSelect({ id: selectedDeviceType, ipAddress, port: portNum })
                        saveIpToHistory(ipAddress, portNum)
                    }
                }
            )
        } catch {
            // 错误已由execute处理
        }
    }

    const handleDisconnect = async () => {
        try {
            await callAPI(
                () => vnaAPI.disconnect(),
                {
                    successMessage: '已断开设备连接',
                    addLog,
                    source: 'vna',
                    showToast: setToast,
                    onSuccess: () => {
                        setIsConnected(false)
                        onConnectionChange?.(false)
                        onDeviceSelect(null)
                    }
                }
            )
        } catch {
            // 错误已处理
        }
    }

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} duration={toast.duration || 3000} onClose={() => setToast(null)} />}

            <div className="card-vna">
                <div className="flex items-center space-x-2 mb-4">
                    <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        <div className="flex items-center gap-2">
                            {isConnected ? <Wifi className="w-5 h-5" style={{ color: 'var(--vna-primary)' }} /> :
                                <WifiOff className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />}
                            设备连接
                        </div>
                    </h2>
                    <button onClick={fetchDevices} disabled={isLoading}
                        className="p-2 rounded-lg transition-colors"
                        style={{
                            background: isLoading ? 'transparent' : 'var(--bg-secondary)',
                            opacity: isLoading ? 0.5 : 1,
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                        title="刷新设备列表">
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                </div>

                <div className="mb-4">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>设备类型</label>
                    <select value={selectedDeviceType} onChange={(e) => setSelectedDeviceType(e.target.value)} disabled={isConnected} className="select-gold w-full">
                        {devices.map((device) => (<option key={device.id} value={device.id}>{device.name} ({device.model})</option>))}
                    </select>
                </div>

                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>IP地址</label>
                        {ipHistory.length > 0 && !isConnected && (
                            <button onClick={() => setShowIpHistory(!showIpHistory)}
                                style={{ fontSize: 'var(--text-xs)', color: 'var(--vna-primary)' }}
                                className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />历史记录
                            </button>
                        )}
                    </div>
                    <input type="text" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} disabled={isConnected}
                        className="input-gold" placeholder="169.254.143.122" />

                    {showIpHistory && ipHistory.length > 0 && (
                        <div className="mt-2 border rounded-md shadow-lg max-h-48 overflow-y-auto"
                            style={{ borderColor: 'var(--border-medium)', backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
                            {ipHistory.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 border-b last:border-b-0"
                                    style={{ borderColor: 'var(--border-light)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(201, 169, 97, 0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <button onClick={() => selectFromHistory(item)} className="flex-1 text-left">
                                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
                                            {item.ip}:{item.port}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.timestamp}</div>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); removeFromHistory(item.ip, item.port); }}
                                        className="ml-2 p-1 rounded" style={{ color: 'var(--color-error)' }} title="删除">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-4">
                    <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>端口号</label>
                    <input type="text" value={port} onChange={(e) => setPort(e.target.value)} disabled={isConnected}
                        className="input-gold" placeholder="5025" />
                </div>

                <div>
                    {!isConnected ? (
                        <button onClick={handleConnect} disabled={isLoading}
                            className="btn-gold w-full flex items-center justify-center space-x-2"
                            style={{ opacity: isLoading ? 0.5 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                            <Power className="h-4 w-4" />
                            <span>{isLoading ? '连接中...' : '连接设备'}</span>
                        </button>
                    ) : (
                        <button onClick={handleDisconnect} className="w-full flex items-center justify-center space-x-2 btn-brown"
                            style={{ background: 'linear-gradient(135deg, #CD5C5C, #8B4513)' }}>
                            <Power className="h-4 w-4" />
                            <span>断开连接</span>
                        </button>
                    )}
                </div>

                <div className="mt-4 p-3 rounded-md border" style={{
                    backgroundColor: 'rgba(127, 140, 84, 0.08)',
                    borderColor: 'var(--color-info)'
                }}>
                    {selectedDeviceType && (
                        <>
                            <p className="font-mono font-semibold" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)' }}>
                                <strong>频率范围：</strong>
                                {selectedDeviceType === 'siyi-3674l' && '10MHz ~ 67GHz'}
                                {selectedDeviceType === 'rohde-zna26' && '10MHz ~ 26.5GHz'}
                                {selectedDeviceType === 'keysight-e5071c' && '100kHz ~ 8.5GHz'}
                            </p>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                                {selectedDeviceType === 'siyi-3674l' && '思仪 3674L 矢量网络分析仪'}
                                {selectedDeviceType === 'rohde-zna26' && '罗德施瓦茨 ZNA26 网络分析仪'}
                                {selectedDeviceType === 'keysight-e5071c' && '是德科技 E5071C 网络分析仪'}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default VNAConnection
