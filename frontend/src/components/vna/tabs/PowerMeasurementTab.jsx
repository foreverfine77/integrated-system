import { useState } from 'react'
import { Zap, CheckSquare, Square } from 'lucide-react'
import { useVNA } from '../../../contexts/VNAContext'

/**
 * 功率测量Tab - 功率参数 (Claude风格)
 * 启用功率测量功能
 */
function PowerMeasurementTab() {
    const {
        selectedParameters,
        setSelectedParameters,
        isConnected,
        selectedDevice
    } = useVNA()

    const isSiyiMixer = isConnected && selectedDevice?.id === 'siyi-3674l'
    const isRohdeMixer = isConnected && selectedDevice?.id === 'rohde-zna26'
    const isPowerSupported = isSiyiMixer || isRohdeMixer

    const powerParameters = [
        { id: 'IPWR', name: 'Ipwr', description: '输入功率' },
        { id: 'OPWR', name: 'Opwr', description: '输出功率' },
        { id: 'REVIPWR', name: 'RevIPwr', description: '反向输入功率' },
        { id: 'REVOPWR', name: 'RevOPwr', description: '反向输出功率' },
    ]

    const toggleParameter = (paramId) => {
        setSelectedParameters(prev =>
            prev.includes(paramId) ? prev.filter(p => p !== paramId) : [...prev, paramId]
        )
    }

    const selectedCount = selectedParameters.filter(p => powerParameters.some(pp => pp.id === p)).length

    if (!isPowerSupported) {
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
                        <strong>⚠️ 功率测量仅支持罗德ZNA26和思仪3674L</strong><br />
                        {!isConnected && '请先连接设备'}
                        {isConnected && !isPowerSupported && '当前设备不支持功率测量'}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* 功率参数标题 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5" style={{ color: 'var(--vna-primary)' }} />
                    <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>
                        功率参数
                    </h3>
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                    已选择 <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--vna-primary)' }}>{selectedCount}</span> 个
                </span>
            </div>

            {/* 功率参数列表 */}
            <div className="grid grid-cols-2 gap-2">
                {powerParameters.map((param) => {
                    const isSelected = selectedParameters.includes(param.id)
                    return (
                        <button
                            key={param.id}
                            onClick={() => toggleParameter(param.id)}
                            className="flex items-center space-x-2 p-3 rounded-md border"
                            style={{
                                backgroundColor: isSelected ? 'rgba(201, 169, 97, 0.08)' : 'var(--bg-card)',
                                borderColor: isSelected ? 'var(--vna-primary)' : 'var(--border-medium)',
                                transition: 'all var(--transition-base)',
                                cursor: 'pointer',
                                boxShadow: isSelected ? 'var(--glow-subtle)' : 'var(--shadow-sm)'
                            }}
                            title={param.description}
                        >
                            <div className="flex-shrink-0">
                                {isSelected ? (
                                    <CheckSquare className="h-4 w-4" style={{ color: 'var(--vna-primary)' }} />
                                ) : (
                                    <Square className="h-4 w-4" style={{ color: 'var(--text-tertiary)' }} />
                                )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <div style={{
                                    fontWeight: 'var(--weight-semibold)',
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--text-primary)'
                                }}>
                                    {param.name}
                                </div>
                                <div style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-tertiary)'
                                }} className="truncate">
                                    {param.description}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default PowerMeasurementTab
