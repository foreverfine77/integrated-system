import { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, CheckSquare, Square } from 'lucide-react'
import Toast from '../../common/Toast'
import { vnaAPI, handleAPIError } from '../../../services/api'
import { useVNA } from '../../../contexts/VNAContext'
import { useApp } from '../../../contexts/AppContext'

/**
 * 混频器测量Tab - SC参数 + 混频器配置 (Claude风格)
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
    const isMixerSupported = isConnected && selectedDevice?.id === 'rohde-zna26'

    const scParameters = [
        { id: 'SC11', name: 'Sc11', description: '变频 S11' },
        { id: 'SC12', name: 'Sc12', description: '变频 S12' },
        { id: 'SC21', name: 'Sc21', description: '变频 S21' },
        { id: 'SC22', name: 'Sc22', description: '变频 S22' },
    ]

    useEffect(() => {
        if (isMixerSupported) {
            const loadConfig = async () => {
                try {
                    const response = await vnaAPI.getMixerConfig()
                    if (response.data.success && response.data.config) {
                        setMixerConfig(response.data.config)
                    }
                } catch (error) {
                    console.log('使用默认混频器配置')
                }
            }
            loadConfig()
        }
    }, [isMixerSupported, setMixerConfig])

    const handleSave = async () => {
        const errors = []
        const ports = [mixerConfig.rfPort, mixerConfig.ifPort, mixerConfig.loPort]
        if (new Set(ports).size !== ports.length) errors.push('RF、IF、LO端口不能重复')
        if (mixerConfig.loFrequency < 10 || mixerConfig.loFrequency > 26500) errors.push('LO频率范围: 10-26500 MHz')
        if (mixerConfig.loPower < -30 || mixerConfig.loPower > 10) errors.push('LO功率范围: -30 至 +10 dBm')

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
        setMixerConfig({ rfPort: 1, ifPort: 2, loPort: 3, loFrequency: 300, loPower: 10, conversionMode: 'DCUP' })
        setToast({ message: '已恢复默认配置', type: 'info' })
        addLog('混频器配置已恢复默认值', 'info', 'vna')
    }

    const toggleParameter = (paramId) => {
        setSelectedParameters(prev =>
            prev.includes(paramId) ? prev.filter(p => p !== paramId) : [...prev, paramId]
        )
    }

    const selectedCount = selectedParameters.filter(p => scParameters.some(sp => sp.id === p)).length

    if (!isMixerSupported) {
        return (
            <div className="space-y-4">
                <div style={{
                    backgroundColor: 'rgba(184, 134, 11, 0.08)',
                    borderColor: 'var(--color-warning)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)'
                }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        <strong>⚠️ 混频器测量仅支持罗德ZNA26</strong><br />
                        {!isConnected && '请先连接设备'}
                        {isConnected && selectedDevice?.id !== 'rohde-zna26' && '当前设备不支持混频器测量'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} duration={toast.duration || 3000} onClose={() => setToast(null)} />}

            <div className="space-y-6">
                {/* 混频器配置 */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5" style={{ color: 'var(--vna-primary)' }} />
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>
                            混频器配置 (VMIX)
                        </h3>
                    </div>

                    {/* 端口配置 */}
                    <div className="mb-4">
                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>端口配置</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['RF端口', 'IF端口', 'LO端口'].map((label, idx) => (
                                <div key={label}>
                                    <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</label>
                                    <select
                                        value={idx === 0 ? mixerConfig.rfPort : idx === 1 ? mixerConfig.ifPort : mixerConfig.loPort}
                                        onChange={(e) => setMixerConfig({
                                            ...mixerConfig,
                                            [idx === 0 ? 'rfPort' : idx === 1 ? 'ifPort' : 'loPort']: parseInt(e.target.value)
                                        })}
                                        className="select-gold w-full"
                                    >
                                        <option value={1}>Port 1</option>
                                        <option value={2}>Port 2</option>
                                        <option value={3}>Port 3</option>
                                        <option value={4}>Port 4</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* LO配置 */}
                    <div className="mb-4">
                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>LO配置</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>LO频率 (MHz)</label>
                                <input type="number" value={mixerConfig.loFrequency}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, loFrequency: parseFloat(e.target.value) || 0 })}
                                    min="10" max="26500" step="0.1" className="input-gold" />
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>范围: 10-26500 MHz</p>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>LO功率 (dBm)</label>
                                <input type="number" value={mixerConfig.loPower}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, loPower: parseFloat(e.target.value) || 0 })}
                                    min="-30" max="10" step="0.1" className="input-gold" />
                                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>范围: -30 至 +10 dBm</p>
                            </div>
                        </div>
                    </div>

                    {/* 转换模式 */}
                    <div className="mb-4">
                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>转换模式</label>
                        <select value={mixerConfig.conversionMode}
                            onChange={(e) => setMixerConfig({ ...mixerConfig, conversionMode: e.target.value })}
                            className="select-gold w-full">
                            <option value="DCUP">DC-UP (下变频上边带)</option>
                            <option value="DCDOWN">DC-DOWN (下变频下边带)</option>
                            <option value="UP">UP (上变频上边带)</option>
                            <option value="DOWN">DOWN (上变频下边带)</option>
                        </select>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={isLoading} className="btn-gold flex-1 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" />
                            <span>{isLoading ? '保存中...' : '保存配置'}</span>
                        </button>
                        <button onClick={handleReset} disabled={isLoading} className="btn-brown flex-1 flex items-center justify-center gap-2">
                            <RotateCcw className="w-4 h-4" />
                            <span>恢复默认</span>
                        </button>
                    </div>
                </div>

                {/* SC参数 */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 'var(--spacing-md)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>变频参数 (SC)</h3>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                            已选择 <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--vna-primary)' }}>{selectedCount}</span> 个
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {scParameters.map((param) => {
                            const isSelected = selectedParameters.includes(param.id)
                            return (
                                <button key={param.id} onClick={() => toggleParameter(param.id)}
                                    className="flex items-center space-x-2 p-3 rounded-md border"
                                    style={{
                                        backgroundColor: isSelected ? 'rgba(201, 169, 97, 0.08)' : 'var(--bg-card)',
                                        borderColor: isSelected ? 'var(--vna-primary)' : 'var(--border-medium)',
                                        transition: 'all var(--transition-base)',
                                        cursor: 'pointer',
                                        boxShadow: isSelected ? 'var(--glow-subtle)' : 'var(--shadow-sm)'
                                    }}
                                    title={param.description}>
                                    <div className="flex-shrink-0">
                                        {isSelected ? <CheckSquare className="h-4 w-4" style={{ color: 'var(--vna-primary)' }} /> :
                                            <Square className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{param.name}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }} className="truncate">{param.description}</div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 提示 */}
                <div style={{
                    backgroundColor: 'rgba(127, 140, 84, 0.08)',
                    borderColor: 'var(--color-info)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)'
                }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                        <strong>提示：</strong>混频器配置将在测量SC参数时生效。请先配置并保存混频器参数，再选择需要测量的SC参数。
                    </p>
                </div>
            </div>
        </>
    )
}

export default MixerMeasurementTab
