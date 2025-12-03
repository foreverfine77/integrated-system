import { useState } from 'react'
import { Terminal, Send } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useMatrix } from '../../contexts/MatrixContext'
import { matrixAPI, handleAPIError } from '../../services/api'

/**
 * 命令面板组件
 * 允许用户手动输入和发送自定义命令
 */
function CommandPanel() {
  const { addLog } = useApp()
  const { isConnected } = useMatrix()

  // 命令输入内容
  const [command, setCommand] = useState('')
  // 发送状态
  const [sending, setSending] = useState(false)
  // 命令历史记录
  const [commandHistory, setCommandHistory] = useState([])

  /**
   * 发送自定义命令
   * 将用户输入的命令发送到后端，再转发给硬件设备
   */
  const sendCommand = async () => {
    const cmd = command.trim()
    if (!cmd) {
      addLog('请输入命令', 'warning')
      return
    }

    setSending(true)
    try {
      const response = await matrixAPI.sendCommand(command.trim())

      if (response.data.success) {
        addLog(`命令发送成功: ${command}`, 'success')
        addLog(`设备响应: ${response.data.response}`, 'info')

        // 添加到历史记录
        setCommandHistory(prev => [command, ...prev.slice(0, 9)])
        setCommand('') // 清空输入框
      } else {
        addLog(`命令执行失败: ${response.data.message}`, 'error')
      }
    } catch (error) {
      handleAPIError(error, addLog, 'system')
    } finally {
      setSending(false)
    }
  }

  /**
   * 处理Enter键发送
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendCommand()
    }
  }

  /**
   * 从历史记录中选择命令
   */
  const selectFromHistory = (cmd) => {
    setCommand(cmd)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-5">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">命令输入</h2>
      </div>

      {/* 命令格式说明 */}
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-700 font-mono font-semibold mb-2">支持的命令格式：</p>
        <div className="grid grid-cols-1 gap-1">
          {[
            'ROUTE:PATHSWITCH:<A1_NUM>:<A2_NUM>',
            'ROUTE:PATHSWITCH?',
            'ROUTE:CHANGETO:<NUM1>:<NUM2>',
            'ROUTE:CHANGETO:<NUM1>?',
            'ROUTE:COUNT?',
            '*IDN?',
            'ifconfig',
            'SetIP:<IP>',
            'SetNetMask:<NetMask>',
            'SetGetway:<Getway>',
            'TcpPort:<TcpPortNum>',
            'SetMac:<MAC>'
          ].map((cmd, index) => (
            <button
              key={index}
              onClick={() => {
                setCommand(cmd)
                navigator.clipboard.writeText(cmd)
                addLog(`已复制命令: ${cmd}`, 'info')
              }}
              className="text-left px-2 py-1 text-xs font-mono text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors border border-transparent hover:border-blue-200"
              title="点击复制到输入框"
            >
              • {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* 命令输入区 */}
      <div className="mb-4">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入命令，例如: ROUTE:PATHSWITCH:1:2"
          disabled={sending}
          className="
            w-full px-3  border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 
            disabled:bg-gray-100 font-mono h-9 leading-8 text-center resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          提示: 按 Enter 发送命令
        </p>
      </div>

      {/* 发送按钮 */}
      <button
        onClick={sendCommand}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        <Send className="w-4 h-4" />
        {sending ? '发送中...' : '发送命令'}
      </button>

      {/* 命令历史记录 */}
      {commandHistory.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">历史命令</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {commandHistory.map((cmd, index) => (
              <button
                key={index}
                onClick={() => selectFromHistory(cmd)}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 font-mono transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default CommandPanel

