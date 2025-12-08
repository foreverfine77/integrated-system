import { Activity, CheckCircle, FileText, Timer } from 'lucide-react'
import { useVNA } from '../../contexts/VNAContext'

/**
 * VNA测量进度显示组件 (Claude风格)
 */
function VNAProgress() {
  const { isMeasuring, measurementProgress, measurementResults, currentCount, totalCount } = useVNA()

  return (
    <div className="card-vna">
      <div className="flex items-center space-x-2 mb-4">
        <Timer className="h-5 w-5" style={{ color: 'var(--vna-primary)' }} />
        <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>测量进度</h2>
      </div>

      {/* 进度条 */}
      {isMeasuring && (
        <div className="mb-6">
          <div className="flex justify-between mb-2" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            <span>进度</span>
            <span style={{ fontWeight: 'var(--weight-semibold)' }}>{Math.round(measurementProgress)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${measurementProgress}%` }} />
          </div>
          <div className="flex justify-between mt-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            <span>当前: {currentCount}</span>
            <span>总计: {totalCount}</span>
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {!isMeasuring && measurementResults.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          <Activity className="h-16 w-16 mx-auto mb-3" style={{ opacity: 0.3 }} />
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>等待开始测量</p>
          <p style={{ fontSize: 'var(--text-xs)', marginTop: '0.25rem' }}>请选择测量参数后点击"开始测量"</p>
        </div>
      )}

      {isMeasuring && (
        <div className="text-center py-8">
          <div className="inline-block">
            <div className="rounded-full h-12 w-12 border-b-2" style={{
              borderColor: 'var(--vna-primary)',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', marginTop: '0.75rem' }}>
            测量进行中...
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
            请勿断开设备连接
          </p>
        </div>
      )}

      {/* 测量结果 */}
      {!isMeasuring && measurementResults.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="h-5 w-5" style={{ color: 'var(--color-success)' }} />
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-secondary)' }}>
              测量完成
            </h3>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {measurementResults.map((result, idx) => (
              <div key={idx} className="p-3 border rounded-md" style={{
                backgroundColor: 'rgba(201, 169, 97, 0.08)',
                borderColor: 'rgba(201, 169, 97, 0.3)'
              }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" style={{ color: 'var(--vna-primary)' }} />
                      <span style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
                        {result.parameter}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      测量次数: {result.measurements}
                    </p>
                    <p className="font-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                      {result.filename?.split('/').pop()}
                    </p>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', fontWeight: 'var(--weight-medium)' }}>
                    ✓ 完成
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 结果统计 */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-light)' }}>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'var(--weight-bold)', color: 'var(--vna-primary)' }}>
                  {measurementResults.length}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  完成参数
                </div>
              </div>
              <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'var(--weight-bold)', color: 'var(--color-info)' }}>
                  {measurementResults.reduce((sum, r) => sum + r.measurements, 0)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
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
