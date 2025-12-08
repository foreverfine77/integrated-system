import { useState } from 'react'
import { LayoutDashboard, Play, FastForward } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useMatrix } from '../../contexts/MatrixContext'
import { matrixAPI, handleAPIError } from '../../services/api'

/**
 * MatrixPanel: 矩阵开关面板 (Claude风格 - 琥珀棕倾向)
 */
export default function MatrixPanel() {
  const { addLog } = useApp()
  const { isConnected } = useMatrix()

  const [a1, setA1] = useState('0')
  const [a2, setA2] = useState('0')
  const [pathLoading, setPathLoading] = useState(false)
  const [num1, setNum1] = useState('1')
  const [num2, setNum2] = useState('1')
  const [changeLoading, setChangeLoading] = useState(false)

  const a1Options = [
    { v: '0', l: '0 （全部CH直连CP）' },
    ...Array.from({ length: 72 }, (_, i) => ({ v: String(i + 1), l: `CH ${i + 1}` }))
  ]

  const a2Options = [
    { v: '0', l: '0 （COM2断开）' },
    ...[73, 74, 75, 76].map((v) => ({ v: String(v), l: `CH ${v}` }))
  ]

  const num2Range = (() => {
    const n = Number(num1)
    if (n >= 1 && n <= 72) return [1, 2]
    if (n >= 73 && n <= 81) return Array.from({ length: 9 }, (_, i) => i)
    if (n === 82) return Array.from({ length: 10 }, (_, i) => i)
    if (n === 83) return Array.from({ length: 5 }, (_, i) => i)
    return [0]
  })()

  const handlePathSwitch = async () => {
    if (!isConnected) {
      addLog('请先连接设备', 'warning')
      return
    }
    setPathLoading(true)
    try {
      const response = await matrixAPI.sendCommand(`ROUTE:PATHSWITCH:${a1}:${a2}`)
      if (response.data.success) {
        addLog(`PATHSWITCH 成功：COM1=${a1}  COM2=${a2}`, 'success')
      } else {
        addLog(`PATHSWITCH 失败：${response.data.message}`, 'error')
      }
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setPathLoading(false)
    }
  }

  const handleChangeTo = async () => {
    if (!isConnected) {
      addLog('请先连接设备', 'warning')
      return
    }
    setChangeLoading(true)
    try {
      const response = await matrixAPI.sendCommand(`ROUTE:CHANGETO:${num1}:${num2}`)
      if (response.data.success) {
        addLog(`CHANGETO 成功：开关${num1} → 端口${num2}`, 'success')
      } else {
        addLog(`CHANGETO 失败：${response.data.message}`, 'error')
      }
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setChangeLoading(false)
    }
  }

  return (
    <div className="card-matrix space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <LayoutDashboard className="w-5 h-5" style={{ color: 'var(--matrix-primary)' }} />
        <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>控制面板</h2>
      </div>

      {/* 使用提示 */}
      <div className="border rounded-lg p-3" style={{
        backgroundColor: 'rgba(127, 140, 84, 0.08)',
        borderColor: 'var(--color-info)',
        fontSize: 'var(--text-sm)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: '0.5rem' }}>使用说明</div>
        <ul className="list-disc list-inside space-y-1" style={{ fontSize: 'var(--text-sm)' }}>
          <li>COM1端口 (0~72)：0=全部CH直连CP，1~72=指定COM1连接</li>
          <li>COM2端口 (0、73~76)：0=COM2断开，73~76=特殊端口</li>
          <li>点击"建立路径"执行 PATHSWITCH 命令</li>
          <li>点击"快速切换"执行 CHANGETO 命令</li>
        </ul>
      </div>

      {/* PATHSWITCH 区域 */}
      <div className="border rounded p-3" style={{
        backgroundColor: 'rgba(139, 111, 71, 0.05)',
        borderColor: 'var(--border-medium)'
      }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>PATHSWITCH — 建立路径</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>COM1 端口</label>
            <select value={a1} onChange={(e) => setA1(e.target.value)} className="select-gold w-full font-mono">
              {a1Options.map((o) => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>COM2 端口</label>
            <select value={a2} onChange={(e) => setA2(e.target.value)} className="select-gold w-full font-mono">
              {a2Options.map((o) => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={handlePathSwitch} disabled={pathLoading} className="btn-brown w-full flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            {pathLoading ? '建立中...' : '建立路径'}
          </button>
        </div>
      </div>

      {/* CHANGETO 区域 */}
      <div className="border rounded p-3" style={{
        backgroundColor: 'rgba(139, 111, 71, 0.05)',
        borderColor: 'var(--border-medium)'
      }}>
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)' }}>CHANGETO — 快速切换</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>开关编号 (1~83)</label>
            <select value={num1} onChange={(e) => setNum1(e.target.value)} className="select-gold w-full font-mono">
              {Array.from({ length: 83 }, (_, i) => i + 1).map((v) => (<option key={v} value={String(v)}>{v}</option>))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>目标端口</label>
            <select value={num2} onChange={(e) => setNum2(e.target.value)} className="select-gold w-full font-mono">
              {num2Range.map((v) => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={handleChangeTo} disabled={changeLoading} className="btn-brown w-full flex items-center justify-center gap-2">
            <FastForward className="w-4 h-4" />
            {changeLoading ? '切换中...' : '快速切换'}
          </button>
        </div>
      </div>
    </div>
  )
}