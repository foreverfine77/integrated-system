import { useState } from 'react'
import { Terminal, Send } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { useMatrix } from '../../contexts/MatrixContext'
import { matrixAPI } from '../../services/api'
import { useAPICall } from '../../hooks/useAPICall'

/**
 * 命令面板组件 (Claude风格 - 琥珀棕倾向)
 */
function CommandPanel() {
  const { addLog } = useApp()
  const { isConnected } = useMatrix()

  // 使用useAPICall自动管理sending状态
  const { isLoading: sending, execute } = useAPICall()

  const [command, setCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState([])

  const sendCommand = async () => {
    const cmd = command.trim()
    if (!cmd) {
      addLog('请输入命令', 'warning')
      return
    }

    try {
      await execute(
        () => matrixAPI.sendCommand(cmd),
        {
          addLog,
          source: 'matrix',
          onSuccess: (data) => {
            addLog(`命令发送成功: ${cmd}`, 'success')
            addLog(`设备响应: ${data.response}`, 'info')
            setCommandHistory(prev => [cmd, ...prev.slice(0, 9)])
            setCommand('')
          }
        }
      )
    } catch {
      // 错误已处理
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendCommand()
    }
  }

  return (
    <div className="card-matrix">
      <div className="flex items-center space-x-2 mb-4">
        <Terminal className="w-5 h-5" style={{ color: 'var(--matrix-primary)' }} />
        <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>命令输入</h2>
      </div>

      {/* 命令格式说明 */}
      <div className="border rounded-lg p-3 mb-4" style={{
        backgroundColor: 'rgba(127, 140, 84, 0.08)',
        borderColor: 'var(--color-info)'
      }}>
        <p className="font-mono font-semibold mb-2" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>支持的命令格式：</p>
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
            <button key={index}
              onClick={() => {
                setCommand(cmd)
                navigator.clipboard.writeText(cmd)
                addLog(`已复制命令: ${cmd}`, 'info')
              }}
              className="text-left px-2 py-1 rounded transition-colors border"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                borderColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(139, 111, 71, 0.1)'
                e.target.style.borderColor = 'var(--matrix-primary)'
                e.target.style.color = 'var(--matrix-primary)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent'
                e.target.style.borderColor = 'transparent'
                e.target.style.color = 'var(--text-secondary)'
              }}
              title="点击复制到输入框">
              • {cmd}
            </button>
          ))}
        </div>
      </div>

      {/* 命令输入区 */}
      <div className="mb-4">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyPress}  // 建议改用 onKeyDown 捕获回车
          placeholder="输入命令，例如: ROUTE:PATHSWITCH:1:2"
          disabled={sending}
          className="input-gold font-mono h-12 w-full text-center focus:outline-none"
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
          提示: 按 Enter 发送命令
        </p>
      </div>

      {/* 发送按钮 */}
      <button onClick={sendCommand} disabled={sending} className="btn-brown w-full flex items-center justify-center gap-2">
        <Send className="w-4 h-4" />
        {sending ? '发送中...' : '发送命令'}
      </button>

      {/* 命令历史记录 */}
      {commandHistory.length > 0 && (
        <div className="mt-4">
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>历史命令</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {commandHistory.map((cmd, index) => (
              <button key={index} onClick={() => setCommand(cmd)}
                className="w-full text-left px-3 py-2 rounded border font-mono transition-colors"
                style={{
                  fontSize: 'var(--text-sm)',
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-medium)'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(139, 111, 71, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--bg-secondary)'}>
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
