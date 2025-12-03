import { useState, useEffect } from 'react'
import { Settings, RefreshCw, Save, RotateCcw } from 'lucide-react'
import Toast from '../common/Toast'
import { vnaAPI, handleAPIError } from '../../services/api'

/**
 * VNA混频器配置组件（仅用于罗德ZNA26）
 * 允许用户配置VMIX混频器测量参数
 */
function VNAMixerConfig({ isConnected, deviceType, addLog }) {
    // 仅在ZNA26且已连接时显示
    if (!isConnected || deviceType !== 'rohde-zna26') {
        return null
    }

    const [config, setConfig] = useState({
        rfPort: 1,
        ifPort: 2,
        loPort: 3,
        loFrequency: 300,  // MHz
        loPower: 10,       // dBm
        conversionMode: 'DCUP'
    })

    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState(null)

    // 加载配置
    useEffect(() => {
        if (isConnected && deviceType === 'rohde-zna26') {
            loadConfig()
        }
    }, [isConnected, deviceType])

    const loadConfig = async () => {
        try {
            const response = await vnaAPI.getMixerConfig()
            if (response.data.success) {
                setConfig(response.data.config)
            }
        } catch (error) {
            // 忽略错误，使用默认配置
        }
    }

    const handleSave = async () => {
        // 验证参数
        const errors = []

        // 检查端口重复
        const ports = [config.rfPort, config.ifPort, config.loPort]
        if (new Set(ports).size !== ports.length) {
            errors.push('RF、IF、LO端口不能重复')
        }

        // 检查LO频率范围
        if (config.loFrequency < 10 || config.loFrequency > 26500) {
            errors.push('LO频率范围: 10-26500 MHz')
        }

        // 检查LO功率范围
        if (config.loPower < -30 || config.loPower > 10) {
            errors.push('LO功率范围: -30 至 +10 dBm')
        }

        if (errors.length > 0) {
            setToast({ message: errors.join('; '), type: 'error', duration: 5000 })
            addLog(`混频器配置验证失败: ${errors.join('; ')}`, 'error', 'vna')
            return
        }

        setIsLoading(true)
        try {
            const response = await vnaAPI.setMixerConfig(config)
            if (response.data.success) {
                setToast({ message: '混频器配置已保存', type: 'success' })
                addLog('混频器配置已更新', 'success', 'vna')
                addLog(`  LO频率: ${config.loFrequency} MHz, LO功率: ${config.loPower} dBm`, 'info', 'vna')
            } else {
                setToast({ message: response.data.message || '保存失败', type: 'error' })
                addLog('混频器配置保存失败', 'error', 'vna')
            }
        } catch (error) {
            handleAPIError(error, addLog, 'vna')
            setToast({ message: '保存配置失败', type: 'error' })
        } finally {
            setIsLoading(false)
        }
    }

    const handleReset = () => {
        const defaultConfig = {
            rfPort: 1,
            ifPort: 2,
            loPort: 3,
            loFrequency: 300,
            loPower: 10,
            conversionMode: 'DCUP'
        }
        setConfig(defaultConfig)
        setToast({ message: '已恢复默认配置', type: 'info' })
        addLog('混频器配置已恢复默认值', 'info', 'vna')
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5 mt-4">
                {/* 标题栏 */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between text-left"
                >
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">混频器配置 (VMIX)</h2>
                    </div>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>

                {/* 配置内容（可折叠） */}
                {isExpanded && (
                    <div className="mt-4 space-y-4">
                        {/* 端口配置 */}
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">端口配置</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        RF端口
                                    </label>
                                    <select
                                        value={config.rfPort}
                                        onChange={(e) => setConfig({ ...config, rfPort: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value={1}>Port 1</option>
                                        <option value={2}>Port 2</option>
                                        <option value={3}>Port 3</option>
                                        <option value={4}>Port 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        IF端口
                                    </label>
                                    <select
                                        value={config.ifPort}
                                        onChange={(e) => setConfig({ ...config, ifPort: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value={1}>Port 1</option>
                                        <option value={2}>Port 2</option>
                                        <option value={3}>Port 3</option>
                                        <option value={4}>Port 4</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        LO端口
                                    </label>
                                    <select
                                        value={config.loPort}
                                        onChange={(e) => setConfig({ ...config, loPort: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value={1}>Port 1</option>
                                        <option value={2}>Port 2</option>
                                        <option value={3}>Port 3</option>
                                        <option value={4}>Port 4</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* LO配置 */}
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">LO配置</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        LO频率 (MHz)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.loFrequency}
                                        onChange={(e) => setConfig({ ...config, loFrequency: parseFloat(e.target.value) || 0 })}
                                        min="10"
                                        max="26500"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="300"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">范围: 10-26500 MHz</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">
                                        LO功率 (dBm)
                                    </label>
                                    <input
                                        type="number"
                                        value={config.loPower}
                                        onChange={(e) => setConfig({ ...config, loPower: parseFloat(e.target.value) || 0 })}
                                        min="-30"
                                        max="10"
                                        step="0.1"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">范围: -30 至 +10 dBm</p>
                                </div>
                            </div>
                        </div>

                        {/* 转换模式 */}
                        <div className="border-t pt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">转换模式</h3>
                            <select
                                value={config.conversionMode}
                                onChange={(e) => setConfig({ ...config, conversionMode: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="DCUP">DC-UP (下变频上边带)</option>
                                <option value="DCDOWN">DC-DOWN (下变频下边带)</option>
                                <option value="UP">UP (上变频上边带)</option>
                                <option value="DOWN">DOWN (上变频下边带)</option>
                            </select>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{isLoading ? '保存中...' : '保存配置'}</span>
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={isLoading}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>恢复默认</span>
                            </button>
                        </div>

                        {/* 说明 */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
                            <p className="text-xs text-blue-800">
                                <strong>注意：</strong>配置仅在测量SC参数（Sc11/Sc12/Sc21/Sc22）时生效。
                                修改配置后，下次测量SC参数时将使用新配置。
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default VNAMixerConfig
