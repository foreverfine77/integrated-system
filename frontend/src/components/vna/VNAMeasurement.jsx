import { Play, Square, FolderOpen, Settings, Gauge } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'

/**
 * VNA测量控制组件
 */
function VNAMeasurement({ onStart, onStop, onExport }) {
    const {
        isConnected,
        isMeasuring,
        selectedParameters,
        measurementResults,
        measurementCount, setMeasurementCount,
        frequencyPoints, setFrequencyPoints,
        startFrequency, setStartFrequency,
        stopFrequency, setStopFrequency
    } = useVNA()

    const pointOptions = [201, 401, 801, 1001]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
            {/* 标题 */}
            <div className="flex items-center space-x-2 mb-4">
                <Gauge className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">测量控制</h2>
            </div>

            {/* 参数设置 */}
            <div className="space-y-4 mb-6">
                {/* 频率范围 */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase">频率范围</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                起始 (MHz)
                            </label>
                            <input
                                type="number"
                                value={startFrequency}
                                onChange={(e) => setStartFrequency(e.target.value)}
                                disabled={isMeasuring}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                placeholder="500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                终止 (MHz)
                            </label>
                            <input
                                type="number"
                                value={stopFrequency}
                                onChange={(e) => setStopFrequency(e.target.value)}
                                disabled={isMeasuring}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                                placeholder="2500"
                            />
                        </div>
                    </div>
                </div>

                {/* 测量参数 */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase">测量设置</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                扫描点数
                            </label>
                            <select
                                value={frequencyPoints}
                                onChange={(e) => setFrequencyPoints(Number(e.target.value))}
                                disabled={isMeasuring}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                            >
                                {pointOptions.map(p => (
                                    <option key={p} value={p}>{p} 点</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">
                                测量次数
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={measurementCount}
                                onChange={(e) => setMeasurementCount(e.target.value)}
                                disabled={isMeasuring}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                            />
                            <p className="text-xs text-slate-400 mt-1">软件循环，每次单独测量</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 控制按钮 */}
            <div className="space-y-3 mb-4">
                {!isMeasuring ? (
                    <button
                        onClick={onStart}
                        disabled={!isConnected || selectedParameters.length === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        <Play className="h-4 w-4 fill-current" />
                        <span>开始测量</span>
                    </button>
                ) : (
                    <button
                        onClick={onStop}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
                    >
                        <Square className="h-4 w-4 fill-current" />
                        <span>停止测量</span>
                    </button>
                )}

                <button
                    onClick={onExport}
                    disabled={measurementResults.length === 0 || isMeasuring}
                    className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <FolderOpen className="h-4 w-4" />
                    <span>查看数据 ({measurementResults.length})</span>
                </button>
            </div>

            {/* 状态提示 */}
            <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-center text-slate-600">
                    {!isConnected ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 py-2 px-3 rounded-md">请先连接设备</span>
                    ) : selectedParameters.length === 0 ? (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-2 px-3 rounded-md">请选择测量参数</span>
                    ) : isMeasuring ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-2 px-3 rounded-md">正在进行测量...</span>
                    ) : (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 py-2 px-3 rounded-md">设备就绪，可以开始测量</span>
                    )}
                </p>
            </div>
        </div>
    )
}

export default VNAMeasurement
