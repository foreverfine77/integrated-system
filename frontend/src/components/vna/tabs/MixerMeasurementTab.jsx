import { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, CheckSquare, Square } from 'lucide-react'
import Toast from '../../common/Toast'
import { vnaAPI, handleAPIError } from '../../../services/api'
import { useVNA } from '../../../contexts/VNAContext'
import { useApp } from '../../../contexts/AppContext'

/**
 * 混频器测量Tab - SC参数 + 混频器配置
 * 整合自VNAMixerConfig组件
 */
function MixerMeasurementTab() {
    const { addLog } = useApp()
    const {
        mixerConfig,
        setMixerConfig,
        selectedParameters,
        setSelectedParameters,
        isConnected,
        selectedDevice
    } = useVNA()

    const [isLoading, setIsLoading] = useState(false)
    const [toast, setToast] = useState(null)

    // 仅在罗德ZNA26且已连接时显示完整功能
    const isMixerSupported = isConnected && selectedDevice?.id === 'rohde-zna26'

    // SC参数列表
    const scParameters = [
        { id: 'SC11', name: 'Sc11', description: '变频 S11' },
        { id: 'SC12', name: 'Sc12', description: '变频 S12' },
        { id: 'SC21', name: 'Sc21', description: '变频 S21' },
        { id: 'SC22', name: 'Sc22', description: '变频 S22' },
    ]

    // 加载混频器配置
    useEffect(() => {
        if (isMixerSupported) {
            loadConfig()
        }
    }, [isMixerSupported])

    const loadConfig = async () => {
        try {
            const response = await vnaAPI.getMixerConfig()
            if (response.data.success && response.data.config) {
                setMixerConfig(response.data.config)
            }
        } catch (error) {
            // 忽略加载错误，使用默认配置
            console.log('使用默认混频器配置')
        }
    }

    const handleSave = async () => {
        // 验证参数
        const errors = []

        // 检查端口重复
        const ports = [mixerConfig.rfPort, mixerConfig.ifPort, mixerConfig.loPort]
        if (new Set(ports).size !== ports.length) {
            errors.push('RF、IF、LO端口不能重复')
        }

        // 检查LO频率范围
        if (mixerConfig.loFrequency < 10 || mixerConfig.loFrequency > 26500) {
            errors.push('LO频率范围: 10-26500 MHz')
        }

        // 检查LO功率范围
        if (mixerConfig.loPower < -30 || mixerConfig.loPower > 10) {
            errors.push('LO功率范围: -30 至 +10 dBm')
        }

        if (errors.length > 0) {
            setToast({ message: errors.join('; '), type: 'error', duration: 5000 })
            addLog(`混频器配置验证失败: ${errors.join('; ')}`, 'error', 'vna')
            return
        }

        setIsLoading(true)
        try {
            const response = await vnaAPI.setMixerConfig(mixerConfig)

            if (response.data.success) {
                setToast({ message: '混频器配置已保存', type: 'success' })
                addLog('混频器配置已更新', 'success', 'vna')
                addLog(`  LO频率: ${mixerConfig.loFrequency} MHz, LO功率: ${mixerConfig.loPower} dBm`, 'info', 'vna')
            } else {
                const errorMsg = response.data.message || response.data.errors?.join('; ') || '保存失败'
                setToast({ message: errorMsg, type: 'error', duration: 5000 })
                addLog(`混频器配置保存失败: ${errorMsg}`, 'error', 'vna')
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
        setMixerConfig(defaultConfig)
        setToast({ message: '已恢复默认配置', type: 'info' })
        addLog('混频器配置已恢复默认值', 'info', 'vna')
    }

    const toggleParameter = (paramId) => {
        if (selectedParameters.includes(paramId)) {
            setSelectedParameters(selectedParameters.filter(p => p !== paramId))
        } else {
            setSelectedParameters([...selectedParameters, paramId])
        }
    }

    const selectedCount = selectedParameters.filter(p =>
        scParameters.some(sp => sp.id === p)
    ).length

    // 如果设备不支持混频器
    if (!isMixerSupported) {
        return (
            <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>⚠️ 混频器测量仅支持罗德ZNA26</strong>
                        <br />
                        {!isConnected && '请先连接设备'}
                        {isConnected && selectedDevice?.id !== 'rohde-zna26' && '当前设备不支持混频器测量'}
                    </p>
                </div>
            </div>
        )
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

            <div className="space-y-6">
                {/* 混频器配置区域 */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                            混频器配置 (VMIX)
                        </h3>
                    </div>

                    {/* 端口配置 */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
                            端口配置
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-500 mb-1">RF端口</label>
                                <select
                                    value={mixerConfig.rfPort}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, rfPort: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>Port 1</option>
                                    <option value={2}>Port 2</option>
                                    <option value={3}>Port 3</option>
                                    <option value={4}>Port 4</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-500 mb-1">IF端口</label>
                                <select
                                    value={mixerConfig.ifPort}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, ifPort: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>Port 1</option>
                                    <option value={2}>Port 2</option>
                                    <option value={3}>Port 3</option>
                                    <option value={4}>Port 4</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-500 mb-1">LO端口</label>
                                <select
                                    value={mixerConfig.loPort}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, loPort: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
                            LO配置
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-500 mb-1">LO频率 (MHz)</label>
                                <input
                                    type="number"
                                    value={mixerConfig.loFrequency}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, loFrequency: parseFloat(e.target.value) || 0 })}
                                    min="10"
                                    max="26500"
                                    step="0.1"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">范围: 10-26500 MHz</p>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-500 mb-1">LO功率 (dBm)</label>
                                <input
                                    type="number"
                                    value={mixerConfig.loPower}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, loPower: parseFloat(e.target.value) || 0 })}
                                    min="-30"
                                    max="10"
                                    step="0.1"
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">范围: -30 至 +10 dBm</p>
                            </div>
                        </div>
                    </div>

                    {/* 转换模式 */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-600 dark:text-gray-400 mb-2">
                            转换模式
                        </label>
                        <select
                            value={mixerConfig.conversionMode}
                            onChange={(e) => setMixerConfig({ ...mixerConfig, conversionMode: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="DCUP">DC-UP (下变频上边带)</option>
                            <option value="DCDOWN">DC-DOWN (下变频下边带)</option>
                            <option value="UP">UP (上变频上边带)</option>
                            <option value="DOWN">DOWN (上变频下边带)</option>
                        </select>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isLoading ? '保存中...' : '保存配置'}</span>
                        </button>
                        <button
                            onClick={handleReset}
                            disabled={isLoading}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>恢复默认</span>
                        </button>
                    </div>
                </div>

                {/* SC参数选择区域 */}
                <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                            变频参数 (SC)
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-gray-400">
                            已选择 <span className="font-semibold text-emerald-600">{selectedCount}</span> 个
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {scParameters.map((param) => {
                            const isSelected = selectedParameters.includes(param.id)
                            return (
                                <button
                                    key={param.id}
                                    onClick={() => toggleParameter(param.id)}
                                    className={`flex items-center space-x-2 p-3 rounded-md border transition-all ${isSelected
                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-600 shadow-sm'
                                            : 'bg-white dark:bg-gray-700 border-slate-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20'
                                        }`}
                                    title={param.description}
                                >
                                    <div className="flex-shrink-0">
                                        {isSelected ? (
                                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Square className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="font-semibold text-sm text-slate-800 dark:text-gray-200">
                                            {param.name}
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-gray-400 truncate">
                                            {param.description}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 提示信息 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        <strong>提示：</strong>混频器配置将在测量SC参数时生效。请先配置并保存混频器参数，再选择需要测量的SC参数。
                    </p>
                </div>
            </div>
        </>
    )
}

export default MixerMeasurementTab
