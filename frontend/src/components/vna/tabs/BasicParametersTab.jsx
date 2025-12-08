import { CheckSquare, Square } from 'lucide-react'
import { useVNA } from '../../../contexts/VNAContext'

/**
 * 基本参数Tab - S参数测量
 */
function BasicParametersTab() {
    const { selectedParameters, setSelectedParameters } = useVNA()

    // S参数列表
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
                <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    S参数
                </h3>
                <span className="text-xs text-slate-500 dark:text-gray-400">
                    已选择 <span className="font-semibold text-emerald-600">{selectedCount}</span> 个
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {sParameters.map((param) => {
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

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>提示：</strong>基本S参数测量适用于常规双端口网络分析。
                </p>
            </div>
        </div>
    )
}

export default BasicParametersTab
