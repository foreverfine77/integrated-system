import { useState, useEffect } from 'react'
import { Settings, Save, RotateCcw, CheckSquare, Square } from 'lucide-react'
import Toast from '../../common/Toast'
import { vnaAPI } from '../../../services/api'
import { useAPICall } from '../../../hooks/useAPICall'
import { showSuccess, showError } from '../../../utils/toast'
import { useVNA } from '../../../contexts/VNAContext'
import { useApp } from '../../../contexts/AppContext'

/**
 * 混频器测量Tab - SC参数 + 混频器配置 (Claude风格)
 * 根据C代码参考重新设计界面
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

    // 使用useAPICall自动管理loading状态
    const { isLoading, execute } = useAPICall()

    const [toast, setToast] = useState(null)
    const isSiyiMixer = isConnected && selectedDevice?.id === 'siyi-3674l'
    const isRohdeMixer = isConnected && selectedDevice?.id === 'rohde-zna26'
    const isMixerSupported = isSiyiMixer || isRohdeMixer

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

        if (isRohdeMixer) {
            // 罗德ZNA26验证
            const ports = [mixerConfig.rfPort, mixerConfig.ifPort, mixerConfig.loPort]
            if (new Set(ports).size !== ports.length) errors.push('RF、IF、LO端口不能重复')
            if (mixerConfig.loFrequency < 10 || mixerConfig.loFrequency > 26500) errors.push('LO频率范围: 10-26500 MHz')
            if (mixerConfig.loPower < -30 || mixerConfig.loPower > 10) errors.push('LO功率范围: -30 至 +10 dBm')
        } else if (isSiyiMixer) {
            // 思仪3674L验证
            const ports = [mixerConfig.input_port || 1, mixerConfig.output_port || 2, mixerConfig.lo_port || 3]
            if (new Set(ports).size !== ports.length) errors.push('RF、IF、LO端口不能重复')
            if (mixerConfig.lo_freq < 10 || mixerConfig.lo_freq > 25500) errors.push('LO频率范围: 10-25500 MHz')
            if (mixerConfig.lo_power < -30 || mixerConfig.lo_power > 10) errors.push('LO功率范围: -30 至 +10 dBm')
        }

        if (errors.length > 0) {
            showError(setToast, errors.join('; '))
            addLog(`混频器配置验证失败: ${errors.join('; ')}`, 'error', 'vna')
            return
        }

        // 为思仪设备转换单位：MHz → Hz
        const configToSend = isSiyiMixer ? {
            ...mixerConfig,
            lo_freq: mixerConfig.lo_freq * 1e6
        } : mixerConfig

        try {
            await execute(
                () => vnaAPI.setMixerConfig(configToSend),
                {
                    successMessage: '混频器配置已保存',
                    addLog,
                    source: 'vna',
                    showToast: setToast
                }
            )
        } catch {
            // 错误已由execute处理
        }
    }

    const handleReset = () => {
        if (isRohdeMixer) {
            setMixerConfig({ ...mixerConfig, rfPort: 1, ifPort: 2, loPort: 3, loFrequency: 300, loPower: 10, conversionMode: 'DCUP' })
        } else if (isSiyiMixer) {
            setMixerConfig({ ...mixerConfig, input_port: 1, output_port: 2, lo_port: 3, lo_freq: 300, lo_power: 10, sideband: 'LOW' })
        }
        showSuccess(setToast, '已恢复默认配置', 3000)
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
                        <strong>⚠️ 混频器测量仅支持罗德ZNA26和思仪3674L</strong><br />
                        {!isConnected && '请先连接设备'}
                        {isConnected && !isMixerSupported && '当前设备不支持混频器测量'}
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
                            混频器配置 {isRohdeMixer ? '(VMIX)' : isSiyiMixer ? '(Scalar Mixer)' : ''}
                        </h3>
                    </div>

                    {/* 罗德ZNA26配置 */}
                    {isRohdeMixer && (
                        <>
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
                        </>
                    )}

                    {/* 思仪3674L配置 - 根据截图重新设计 */}
                    {isSiyiMixer && (
                        <>
                            {/* 端口配置 */}
                            <div className="mb-4">
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>端口配置</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>RF端口</label>
                                        <select value={mixerConfig.input_port || 1}
                                            onChange={(e) => setMixerConfig({ ...mixerConfig, input_port: parseInt(e.target.value) })}
                                            className="select-gold w-full">
                                            <option value={1}>Port 1</option>
                                            <option value={2}>Port 2</option>
                                            <option value={3}>Port 3</option>
                                            <option value={4}>Port 4</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>IF端口</label>
                                        <select value={mixerConfig.output_port || 2}
                                            onChange={(e) => setMixerConfig({ ...mixerConfig, output_port: parseInt(e.target.value) })}
                                            className="select-gold w-full">
                                            <option value={1}>Port 1</option>
                                            <option value={2}>Port 2</option>
                                            <option value={3}>Port 3</option>
                                            <option value={4}>Port 4</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>LO端口</label>
                                        <select value={mixerConfig.lo_port || 3}
                                            onChange={(e) => setMixerConfig({ ...mixerConfig, lo_port: parseInt(e.target.value) })}
                                            className="select-gold w-full">
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
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>LO配置</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>LO频率 (MHz)</label>
                                        <input type="number" value={mixerConfig.lo_freq || 300}
                                            onChange={(e) => setMixerConfig({ ...mixerConfig, lo_freq: parseFloat(e.target.value) || 0 })}
                                            min="10" max="25500" step="1" className="input-gold" />
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>范围: 10-25500 MHz</p>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>LO功率 (dBm)</label>
                                        <input type="number" value={mixerConfig.lo_power || 10}
                                            onChange={(e) => setMixerConfig({ ...mixerConfig, lo_power: parseFloat(e.target.value) || 0 })}
                                            min="-30" max="10" step="0.1" className="input-gold" />
                                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>范围: -30 至 +10 dBm</p>
                                    </div>
                                </div>
                            </div>

                            {/* 转换模式 */}
                            <div className="mb-4">
                                <label style={{ display: 'block', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>转换模式</label>
                                <select value={mixerConfig.sideband || 'LOW'}
                                    onChange={(e) => setMixerConfig({ ...mixerConfig, sideband: e.target.value })}
                                    className="select-gold w-full">
                                    <option value="LOW">DC-UP (下变频上边带)</option>
                                    <option value="HIGH">DC-DOWN (下变频下边带)</option>
                                </select>
                            </div>
                        </>
                    )}

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
            </div>
        </>
    )
}

export default MixerMeasurementTab
