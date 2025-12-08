import { AlertTriangle } from 'lucide-react'

/**
 * 功率测量Tab - 功率参数（暂不可用）
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
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                            功率测量需要功率校准
                        </h4>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">
                            功率测量功能正在开发中，需要专门的功率传感器和校准步骤。
                        </p>
                    </div>
                </div>
            </div>

            {/* 功率参数列表（禁用状态） */}
            <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                    功率参数
                </h3>
                <div className="grid grid-cols-2 gap-2 opacity-50">
                    {powerParameters.map((param) => (
                        <button
                            key={param.id}
                            disabled
                            className="flex items-center space-x-2 p-3 rounded-md border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 cursor-not-allowed"
                            title="需要功率校准（暂不可用）"
                        >
                            <div className="flex-1 text-left min-w-0">
                                <div className="font-semibold text-sm text-slate-600 dark:text-gray-400">
                                    {param.name}
                                </div>
                                <div className="text-[10px] text-slate-400 dark:text-gray-500 truncate">
                                    {param.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 功能说明 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    功率测量要求
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <li>✓ 专门的功率传感器</li>
                    <li>✓ 功率校准步骤</li>
                    <li>✓ VNA设备支持功率测量</li>
                </ul>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                    该功能将在后续版本中实现。
                </p>
            </div>
        </div>
    )
}

export default PowerMeasurementTab
