import { Play, Square, FolderOpen, Gauge } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'

/**
 * VNA测量控制组件 (Claude风格)
 */
function VNAMeasurement({ onStart, onStop, onExport }) {
    const {
        isConnected, isMeasuring, selectedParameters, measurementResults,
        measurementCount, setMeasurementCount,
        frequencyPoints, setFrequencyPoints,
        startFrequency, setStartFrequency,
        stopFrequency, setStopFrequency
    } = useVNA()

    const pointOptions = [201, 401, 801, 1001]

    return (
        <div className="card-vna">
            <div className="flex items-center space-x-2 mb-4">
                <Gauge className="h-5 w-5" style={{ color: 'var(--vna-primary)' }} />
                <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>测量控制</h2>
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>频率范围</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>起始 (MHz)</label>
                            <input type="number" value={startFrequency} onChange={(e) => setStartFrequency(e.target.value)} disabled={isMeasuring}
                                className="input-gold" placeholder="500" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>终止 (MHz)</label>
                            <input type="number" value={stopFrequency} onChange={(e) => setStopFrequency(e.target.value)} disabled={isMeasuring}
                                className="input-gold" placeholder="2500" />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>测量设置</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>扫描点数</label>
                            <select value={frequencyPoints} onChange={(e) => setFrequencyPoints(Number(e.target.value))} disabled={isMeasuring} className="select-gold w-full">
                                {pointOptions.map(p => (<option key={p} value={p}>{p} 点</option>))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>测量次数</label>
                            <input type="number" min="1" max="100" value={measurementCount} onChange={(e) => setMeasurementCount(e.target.value)} disabled={isMeasuring} className="input-gold" />
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>软件循环，每次单独测量</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                {!isMeasuring ? (
                    <button onClick={onStart} disabled={!isConnected || selectedParameters.length === 0}
                        className="btn-gold w-full flex items-center justify-center space-x-2"
                        style={{ opacity: (!isConnected || selectedParameters.length === 0) ? 0.5 : 1, cursor: (!isConnected || selectedParameters.length === 0) ? 'not-allowed' : 'pointer' }}>
                        <Play className="h-4 w-4 fill-current" />
                        <span>开始测量</span>
                    </button>
                ) : (
                    <button onClick={onStop} className="w-full flex items-center justify-center space-x-2 btn-brown"
                        style={{ background: 'linear-gradient(135deg, #CD5C5C, #8B4513)' }}>
                        <Square className="h-4 w-4 fill-current" />
                        <span>停止测量</span>
                    </button>
                )}

                <button onClick={onExport} disabled={measurementResults.length === 0 || isMeasuring}
                    className="w-full border font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-medium)',
                        color: 'var(--text-secondary)',
                        opacity: (measurementResults.length === 0 || isMeasuring) ? 0.5 : 1,
                        cursor: (measurementResults.length === 0 || isMeasuring) ? 'not-allowed' : 'pointer',
                        transition: 'all var(--transition-base)'
                    }}
                    onMouseEnter={(e) => {
                        if (measurementResults.length > 0 && !isMeasuring) {
                            e.target.style.borderColor = 'var(--vna-primary)'
                            e.target.style.backgroundColor = 'rgba(201, 169, 97, 0.05)'
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.borderColor = 'var(--border-medium)'
                        e.target.style.backgroundColor = 'var(--bg-card)'
                    }}>
                    <FolderOpen className="h-4 w-4" />
                    <span>查看数据 ({measurementResults.length})</span>
                </button>
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
                <p className="text-sm text-center">
                    {!isConnected ? (
                        <span className="py-2 px-3 rounded-md" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', backgroundColor: 'rgba(184, 134, 11, 0.08)' }}>请先连接设备</span>
                    ) : selectedParameters.length === 0 ? (
                        <span className="py-2 px-3 rounded-md" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-info)', backgroundColor: 'rgba(127, 140, 84, 0.08)' }}>请选择测量参数</span>
                    ) : isMeasuring ? (
                        <span className="py-2 px-3 rounded-md" style={{ fontSize: 'var(--text-xs)', color: 'var(--vna-primary)', backgroundColor: 'rgba(201, 169, 97, 0.08)' }}>正在进行测量...</span>
                    ) : (
                        <span className="py-2 px-3 rounded-md" style={{ fontSize: 'var(--text-xs)', color: 'var(--vna-primary)', backgroundColor: 'rgba(201, 169, 97, 0.08)' }}>设备就绪，可以开始测量</span>
                    )}
                </p>
            </div>
        </div>
    )
}

export default VNAMeasurement
