import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Power, Check, Clock, X } from 'lucide-react'
import Toast from '../common/Toast'
import { vnaAPI, handleAPIError } from '../../services/api'

/**
 * VNA设备连接组件
 * 负责VNA设备的连接管理
 */
function VNAConnection({ selectedDevice, onDeviceSelect, onConnectionChange, addLog }) {
    const [devices, setDevices] = useState([])
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // 连接配置
    const [ipAddress, setIpAddress] = useState('192.168.1.100')
    const [port, setPort] = useState('5025')
    const [selectedDeviceType, setSelectedDeviceType] = useState('siyi-3674l')

    // 历史IP地址管理
    const [ipHistory, setIpHistory] = useState([])
    const [showIpHistory, setShowIpHistory] = useState(false)

    // Toast通知状态
    const [toast, setToast] = useState(null)

    // 获取可用设备列表
    const fetchDevices = async () => {
        try {
            const response = await vnaAPI.getDevices()
            setDevices(response.data)
        } catch (error) {
            handleAPIError(error, addLog, 'vna')
        }
    }

    // 从 localStorage 加载历史IP地址
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

    // 当设备列表加载完成后，确保选中的设备类型有效
    useEffect(() => {
        if (devices.length > 0 && !devices.find(d => d.id === selectedDeviceType)) {
            // 如果当前选中的设备类型不在列表中，选择第一个
            setSelectedDeviceType(devices[0].id)
        }
    }, [devices])

    // 保存IP到历史记录
    const saveIpToHistory = (ip, portNum) => {
        const entry = {
            ip,
            port: portNum,
            timestamp: new Date().toLocaleString('zh-CN'),
            deviceType: selectedDeviceType
        }

        // 去重并限制数量（最多保存10条）
        const newHistory = [
            entry,
            ...ipHistory.filter(item => item.ip !== ip || item.port !== portNum)
        ].slice(0, 10)

        setIpHistory(newHistory)
        localStorage.setItem('vna_ip_history', JSON.stringify(newHistory))
    }

    // 从历史记录中选择IP
    const selectFromHistory = (item) => {
        setIpAddress(item.ip)
        setPort(String(item.port))
        setSelectedDeviceType(item.deviceType)
        setShowIpHistory(false)
    }

    // 删除历史记录
    const removeFromHistory = (ip, portNum) => {
        const newHistory = ipHistory.filter(
            item => !(item.ip === ip && item.port === portNum)
        )
        setIpHistory(newHistory)
        localStorage.setItem('vna_ip_history', JSON.stringify(newHistory))
    }

    // 连接设备
    const handleConnect = async () => {
        setIsLoading(true)
        try {
            const portNum = parseInt(port)
            const response = await vnaAPI.connect({
                device_type: selectedDeviceType,
                ip_address: ipAddress,
                port: portNum
            })

            const data = response.data

            if (data.success) {
                setIsConnected(true)
                if (onConnectionChange) {
                    onConnectionChange(true)
                }
                onDeviceSelect({
                    id: selectedDeviceType,
                    ipAddress: ipAddress,
                    port: portNum
                })
                saveIpToHistory(ipAddress, portNum)
                addLog(`成功连接到 ${ipAddress}:${portNum}`, 'success', 'vna')
                addLog(`设备类型: ${selectedDeviceType}`, 'info', 'vna')
                setToast({ message: '设备连接成功！', type: 'success' })
            } else {
                const shortMsg = data.message?.split('，')[0] || data.message?.split('。')[0] || data.message
                addLog(`连接失败: ${shortMsg}`, 'error', 'vna')
                setToast({ message: `连接失败: ${shortMsg}`, type: 'error', duration: 5000 })
            }
        } catch (error) {
            addLog('连接错误，请检查网络或设备状态', 'error', 'vna')
            setToast({ message: '连接错误，请检查网络或设备状态', type: 'error', duration: 5000 })
        } finally {
            setIsLoading(false)
        }
    }

    // 断开连接
    const handleDisconnect = async () => {
        try {
            const response = await vnaAPI.disconnect()
            const data = response.data

            if (data.success) {
                setIsConnected(false)
                if (onConnectionChange) {
                    onConnectionChange(false)
                }
                onDeviceSelect(null)
                addLog('已断开设备连接', 'info', 'vna')
            }
        } catch (error) {
            console.error('断开连接失败:', error)
            addLog('断开连接失败', 'error', 'vna')
        }
    }

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration || 3000}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
                <div className="flex items-center space-x-2 mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {isConnected ? <Wifi className="w-5 h-5 text-emerald-600" /> : <WifiOff className="w-5 h-5 text-gray-400" />}
                        设备连接
                    </h2>
                    <button
                        onClick={fetchDevices}
                        disabled={isLoading}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="刷新设备列表"
                    >
                        <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* 设备类型选择 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        设备类型
                    </label>
                    <select
                        value={selectedDeviceType}
                        onChange={(e) => setSelectedDeviceType(e.target.value)}
                        disabled={isConnected}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    >
                        {devices.map((device) => (
                            <option key={device.id} value={device.id}>
                                {device.name} ({device.model})
                            </option>
                        ))}
                    </select>
                </div>

                {/* IP地址 */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium text-slate-700">
                            IP地址
                        </label>
                        {ipHistory.length > 0 && !isConnected && (
                            <button
                                onClick={() => setShowIpHistory(!showIpHistory)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                                <Clock className="h-3 w-3" />
                                历史记录
                            </button>
                        )}
                    </div>
                    <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        disabled={isConnected}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                        placeholder="192.168.1.100"
                    />

                    {/* 历史IP下拉列表 */}
                    {showIpHistory && ipHistory.length > 0 && (
                        <div className="mt-2 border border-slate-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto">
                            {ipHistory.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-b border-slate-100 dark:border-gray-700 last:border-b-0"
                                >
                                    <button
                                        onClick={() => selectFromHistory(item)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="text-sm font-medium text-slate-800 dark:text-gray-200">
                                            {item.ip}:{item.port}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-gray-400">
                                            {item.timestamp}
                                        </div>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            removeFromHistory(item.ip, item.port)
                                        }}
                                        className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                                        title="删除"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 端口号 */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        端口号
                    </label>
                    <input
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        disabled={isConnected}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                        placeholder="5025"
                    />
                </div>

                {/* 连接按钮 */}
                <div>
                    {!isConnected ? (
                        <button
                            onClick={handleConnect}
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <Power className="h-4 w-4" />
                            <span>{isLoading ? '连接中...' : '连接设备'}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleDisconnect}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                        >
                            <Power className="h-4 w-4" />
                            <span>断开连接</span>
                        </button>
                    )}
                </div>

                {/* 设备信息提示 */}
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700">
                    {selectedDeviceType && (
                        <>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-mono font-semibold">
                                <strong>频率范围：</strong>
                                {selectedDeviceType === 'siyi-3674l' && '10MHz ~ 67GHz'}
                                {selectedDeviceType === 'rohde-zna26' && '10MHz ~ 26.5GHz'}
                                {selectedDeviceType === 'keysight-e5071c' && '100kHz ~ 8.5GHz'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {selectedDeviceType === 'siyi-3674l' && '思仪 3674L 矢量网络分析仪'}
                                {selectedDeviceType === 'rohde-zna26' && '罗德施瓦茨 ZNA26 网络分析仪'}
                                {selectedDeviceType === 'keysight-e5071c' && '是德科技 E5071C 网络分析仪'}
                            </p>
                        </>
                    )}
                    {!selectedDeviceType && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">正在加载设备信息...</p>
                    )}
                </div>
            </div>
        </>
    )
}

export default VNAConnection
