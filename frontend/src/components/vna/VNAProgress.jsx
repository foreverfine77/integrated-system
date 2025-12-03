import { Activity, CheckCircle, FileText, Timer } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'

/**
 * VNA测量进度显示组件
 */
function VNAProgress() {
  const { isMeasuring, measurementProgress, measurementResults, currentCount, totalCount } = useVNA()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
      <div className="flex items-center space-x-2 mb-4">
        <Timer className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900">测量进度</h2>
      </div>

      {/* 进度条 */}
      {isMeasuring && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>进度</span>
            <span className="font-semibold">{Math.round(measurementProgress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${measurementProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>当前: {currentCount}</span>
            <span>总计: {totalCount}</span>
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {!isMeasuring && measurementResults.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Activity className="h-16 w-16 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">等待开始测量</p>
          <p className="text-xs mt-1">请选择测量参数后点击"开始测量"</p>
        </div>
      )}

      {isMeasuring && (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
          <p className="text-sm font-medium text-slate-700 mt-3">
            测量进行中...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            请勿断开设备连接
          </p>
        </div>
      )}

      {/* 测量结果 */}
      {!isMeasuring && measurementResults.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-700">
              测量完成
            </h3>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {measurementResults.map((result, idx) => (
              <div
                key={idx}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800">
                        {result.parameter}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      测量次数: {result.measurements}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {result.filename?.split('/').pop()}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ 完成
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 结果统计 */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-md">
                <div className="text-2xl font-bold text-emerald-600">
                  {measurementResults.length}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  完成参数
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <div className="text-2xl font-bold text-blue-600">
                  {measurementResults.reduce((sum, r) => sum + r.measurements, 0)}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  总测量次数
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VNAProgress
