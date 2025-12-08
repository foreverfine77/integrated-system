import { AlertTriangle } from 'lucide-react'

/**
 * 功率测量Tab - 功率参数（暂不可用） (Claude风格)
 */
function PowerMeasurementTab() {
    const powerParameters = [
        { id: 'IPWR', name: 'IPwr', description: '输入功率' },
        { id: 'OPWR', name: 'OPwr', description: '输出功率' },
        { id: 'REVIPWR', name: 'RevIPwr', description: '反向输入功率' },
        { id: 'REVOPWR', name: 'RevOPwr', description: '反向输出功率' },
    ]

    return (
        <div className="space-y-4">
            {/* 警告提示 */}
            <div style={{
                backgroundColor: 'rgba(184, 134, 11, 0.08)',
                borderColor: 'var(--color-warning)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)'
            }}>
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-warning)' }} />
                    <div>
                        <h4 style={{
                            fontSize: 'var(--text-sm)',
                            fontWeight: 'var(--weight-semibold)',
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem'
                        }}>
                            功率测量需要功率校准
                        </h4>
                        <p style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)'
                        }}>
                            功率测量功能正在开发中，需要专门的功率传感器和校准步骤。
                        </p>
                    </div>
                </div>
            </div>

            {/* 功率参数列表（禁用状态） */}
            <div>
                <h3 style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    功率参数
                </h3>
                <div className="grid grid-cols-2 gap-2" style={{ opacity: 0.5 }}>
                    {powerParameters.map((param) => (
                        <button
                            key={param.id}
                            disabled
                            className="flex items-center space-x-2 p-3 rounded-md border"
                            style={{
                                backgroundColor: 'var(--bg-secondary)',
                                borderColor: 'var(--border-light)',
                                cursor: 'not-allowed'
                            }}
                            title="需要功率校准（暂不可用）"
                        >
                            <div className="flex-1 text-left min-w-0">
                                <div style={{
                                    fontWeight: 'var(--weight-semibold)',
                                    fontSize: 'var(--text-sm)',
                                    color: 'var(--text-tertiary)'
                                }}>
                                    {param.name}
                                </div>
                                <div style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-disabled)'
                                }} className="truncate">
                                    {param.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PowerMeasurementTab
