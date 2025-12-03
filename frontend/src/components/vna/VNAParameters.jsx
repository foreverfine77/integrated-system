import { CheckSquare, Square, List } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'

/**
 * VNA参数选择组件
 */
function VNAParameters() {
  const { selectedParameters, setSelectedParameters } = useVNA()

  // 可用的测量参数
  const availableParameters = [
    // S参数
    { id: 'S11', name: 'S11', category: 'S参数', description: '输入反射系数' },
    { id: 'S12', name: 'S12', category: 'S参数', description: '反向传输系数' },
    { id: 'S21', name: 'S21', category: 'S参数', description: '正向传输系数' },
    { id: 'S22', name: 'S22', category: 'S参数', description: '输出反射系数' },
    // 变频参数
    { id: 'SC11', name: 'Sc11', category: '变频参数', description: '变频 S11' },
    { id: 'SC12', name: 'Sc12', category: '变频参数', description: '变频 S12' },
    { id: 'SC21', name: 'Sc21', category: '变频参数', description: '变频 S21' },
    { id: 'SC22', name: 'Sc22', category: '变频参数', description: '变频 S22' },
    // 功率参数
    { id: 'IPWR', name: 'IPwr', category: '功率参数', description: '输入功率' },
    { id: 'OPWR', name: 'OPwr', category: '功率参数', description: '输出功率' },
    { id: 'REVIPWR', name: 'RevIPwr', category: '功率参数', description: '反向输入功率' },
    { id: 'REVOPWR', name: 'RevOPwr', category: '功率参数', description: '反向输出功率' }
  ]

  const toggleParameter = (parameterId) => {
    if (selectedParameters.includes(parameterId)) {
      setSelectedParameters(selectedParameters.filter(p => p !== parameterId))
    } else {
      setSelectedParameters([...selectedParameters, parameterId])
    }
  }

  const toggleAll = () => {
    if (selectedParameters.length === availableParameters.length) {
      setSelectedParameters([])
    } else {
      setSelectedParameters(availableParameters.map(p => p.id))
    }
  }

  const categories = [...new Set(availableParameters.map(p => p.category))]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <List className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">测量参数</h2>
        </div>

        <button
          onClick={toggleAll}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {selectedParameters.length === availableParameters.length ? '取消全选' : '全选'}
        </button>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-slate-600 dark:text-gray-400 mb-2 uppercase flex items-center gap-2">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {availableParameters
                .filter(p => p.category === category)
                .map((param) => {
                  const isSelected = selectedParameters.includes(param.id)
                  return (
                    <button
                      key={param.id}
                      onClick={() => toggleParameter(param.id)}
                      className={`flex items-center space-x-2 p-2 rounded-md border transition-all ${isSelected
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
                        <div className="font-semibold text-sm text-slate-800 dark:text-gray-200 truncate">
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
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
        <p className="text-sm text-slate-600 dark:text-gray-400 text-center">
          已选择 <span className="font-semibold text-emerald-600">{selectedParameters.length}</span> 个参数
        </p>
      </div>
    </div>
  )
}

export default VNAParameters
