import { CheckSquare, Square } from 'lucide-react'
import { useVNA } from '../../../contexts/VNAContext'

/**
 * 基本参数Tab - S参数测量 (Claude风格)
 */
function BasicParametersTab() {
    const { selectedParameters, setSelectedParameters } = useVNA()

    const sParameters = [
        { id: 'S11', name: 'S11', description: '输入反射系数' },
        { id: 'S12', name: 'S12', description: '反向传输系数' },
        { id: 'S21', name: 'S21', description: '正向传输系数' },
        { id: 'S22', name: 'S22', description: '输出反射系数' },
    ]

    const toggleParameter = (paramId) => {
        if (selectedParameters.includes(paramId)) {
            setSelectedParameters(selectedParameters.filter(p => p !== paramId))
        } else {
            setSelectedParameters([...selectedParameters, paramId])
        }
    }

    const selectedCount = selectedParameters.filter(p =>
        sParameters.some(sp => sp.id === p)
    ).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--text-secondary)'
                }}>
                    S参数
                </h3>
                <span style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-tertiary)'
                }}>
                    已选择 <span style={{
                        fontWeight: 'var(--weight-semibold)',
                        color: 'var(--vna-primary)'
                    }}>{selectedCount}</span> 个
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {sParameters.map((param) => {
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
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--vna-hover)'
                                    e.currentTarget.style.backgroundColor = 'rgba(201, 169, 97, 0.03)'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--border-medium)'
                                    e.currentTarget.style.backgroundColor = 'var(--bg-card)'
                                }
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

            <div style={{
                backgroundColor: 'rgba(127, 140, 84, 0.08)',
                borderColor: 'var(--color-info)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)'
            }}>
                <p style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)'
                }}>
                    <strong>提示：</strong>基本S参数测量适用于常规双端口网络分析。
                </p>
            </div>
        </div>
    )
}

export default BasicParametersTab
