import { useState } from 'react'
import { ToggleLeft, Play, FastForward, LayoutDashboard } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useMatrix } from '../../contexts/MatrixContext'
import { matrixAPI, handleAPIError } from '../../services/api'

/**
 * MatrixPanel: 矩阵开关面板（PATHSWITCH + CHANGETO）
 */
export default function MatrixPanel() {
  const { addLog } = useApp()
  const { isConnected } = useMatrix()

  /* ------------------ PATHSWITCH 区域 ------------------ */
  const [a1, setA1] = useState('0')
  const [a2, setA2] = useState('0')
  const [pathLoading, setPathLoading] = useState(false)

  /* ------------------ CHANGETO 区域 ------------------ */
  const [num1, setNum1] = useState('1')
  const [num2, setNum2] = useState('1')
  const [changeLoading, setChangeLoading] = useState(false)

  /* 生成 COM1 选项 0~72 */
  const a1Options = [
    { v: '0', l: '0 （全部CH直连CP）' },
    ...Array.from({ length: 72 }, (_, i) => ({ v: String(i + 1), l: `CH ${i + 1}` }))
  ]

  /* 生成 COM2 选项 0、73~76 */
  const a2Options = [
    { v: '0', l: '0 （COM2断开）' },
    ...[73, 74, 75, 76].map((v) => ({ v: String(v), l: `CH ${v}` }))
  ]

  /* 根据 NUM1 范围生成 NUM2 可选值 */
  const num2Range = (() => {
    const n = Number(num1)
    if (n >= 1 && n <= 72) return [1, 2]
    if (n >= 73 && n <= 81) return Array.from({ length: 9 }, (_, i) => i)
    if (n === 82) return Array.from({ length: 10 }, (_, i) => i)
    if (n === 83) return Array.from({ length: 5 }, (_, i) => i)
    return [0]
  })()

  /* 发送 PATHSWITCH */
  const handlePathSwitch = async () => {
    if (!isConnected) {
      addLog('请先连接设备', 'warning')
      return
    }
    setPathLoading(true)
    try {
      const response = await matrixAPI.sendCommand(`ROUTE:PATHSWITCH:${a1}:${a2}`)
      const data = response.data
      if (data.success) {
        addLog(`PATHSWITCH 成功：COM1=${a1}  COM2=${a2}`, 'success')
      } else {
        addLog(`PATHSWITCH 失败：${data.message}`, 'error')
      }
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setPathLoading(false)
    }
  }

  /* 发送 CHANGETO */
  const handleChangeTo = async () => {
    if (!isConnected) {
      addLog('请先连接设备', 'warning')
      return
    }
    setChangeLoading(true)
    try {
      const response = await matrixAPI.sendCommand(`ROUTE:CHANGETO:${num1}:${num2}`)
      const data = response.data
      if (data.success) {
        addLog(`CHANGETO 成功：开关${num1} → 端口${num2}`, 'success')
      } else {
        addLog(`CHANGETO 失败：${data.message}`, 'error')
      }
    } catch (error) {
      handleAPIError(error, addLog, 'matrix')
    } finally {
      setChangeLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border space-y-4 border-slate-200 dark:border-gray-700 p-5">
      <div className="flex items-center space-x-2 mb-4">
        <LayoutDashboard className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">控制面板</h2>
      </div>

      {/* 使用提示 */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300">
        <div className="font-semibold mb-2">使用说明</div>
        <ul className="list-disc list-inside space-y-1">
          <li>COM1端口 (0~72)：0=全部CH直连CP，1~72=指定COM1连接</li>
          <li>COM2端口 (0、73~76)：0=COM2断开，73~76=特殊端口</li>
          <li>点击"建立路径"执行 PATHSWITCH 命令</li>
          <li>点击"快速切换"执行 CHANGETO 命令</li>
        </ul>
      </div>

      {/* PATHSWITCH 区域 */}
      <div className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-gray-700 dark:text-gray-300">PATHSWITCH — 建立路径</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm text-gray-600 mb-1">COM1 端口</label>
            <select
              value={a1}
              onChange={(e) => setA1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
            >
              {a1Options.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm text-gray-600 mb-1">COM2 端口</label>
            <select
              value={a2}
              onChange={(e) => setA2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
            >
              {a2Options.map((o) => (
                <option key={o.v} value={o.v}>{o.l}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handlePathSwitch}
            disabled={pathLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Play className="w-4 h-4" />
            {pathLoading ? '建立中...' : '建立路径'}
          </button>
        </div>
      </div>

      {/* CHANGETO 区域 */}
      <div className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded p-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-gray-700 dark:text-gray-300">CHANGETO — 快速切换</span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm text-gray-600 mb-1">开关编号 (1~83)</label>
            <select
              value={num1}
              onChange={(e) => setNum1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
            >
              {Array.from({ length: 83 }, (_, i) => i + 1).map((v) => (
                <option key={v} value={String(v)}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-sm text-gray-600 mb-1">目标端口</label>
            <select
              value={num2}
              onChange={(e) => setNum2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
            >
              {num2Range.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleChangeTo}
            disabled={changeLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <FastForward className="w-4 h-4" />
            {changeLoading ? '切换中...' : '快速切换'}
          </button>
        </div>
      </div>
    </div>
  )
}