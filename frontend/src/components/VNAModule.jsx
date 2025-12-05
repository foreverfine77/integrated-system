import { useEffect, useState } from 'react'
import VNAConnection from './vna/VNAConnection'
import VNAParameters from './vna/VNAParameters'
import VNAMeasurement from './vna/VNAMeasurement'
import VNAProgress from './vna/VNAProgress'
import VNAMixerConfig from './vna/VNAMixerConfig'
import Toast from './common/Toast'
import { vnaAPI, handleAPIError } from '../services/api'
import { useApp } from '../contexts/AppContext'
import { useVNA } from '../contexts/VNAContext'

/**
 * 矢量网络分析仪模块
 * 整合设备连接、参数选择、测量控制和进度显示
 */
function VNAModule() {
  const { addLog } = useApp()
  const {
    selectedDevice, setSelectedDevice,
    isConnected, setIsConnected,
    selectedParameters, setSelectedParameters,
    isMeasuring, setIsMeasuring,
    measurementProgress, setMeasurementProgress,
    measurementResults, setMeasurementResults,
    currentCount, setCurrentCount,
    totalCount, setTotalCount,
    measurementCount, setMeasurementCount,
    frequencyPoints, setFrequencyPoints,
    startFrequency, setStartFrequency,
    stopFrequency, setStopFrequency,
  } = useVNA()

  // Toast通知状态
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const syncConnectionStatus = async () => {
      try {
        const response = await vnaAPI.getStatus()
        if (response.data.connected) {
          setIsConnected(true)
          // 同步设备信息
          if (response.data.type && response.data.ip_address) {
            setSelectedDevice({
              id: response.data.type,
              ipAddress: response.data.ip_address,
              port: response.data.port || 5025
            })
          }
        } else {
          setIsConnected(false)
        }
      } catch (error) {
        setIsConnected(false)
      }
    }

    // 立即同步一次
    syncConnectionStatus()

    // 每5秒同步一次（防止状态不同步）
    const interval = setInterval(syncConnectionStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  // 开始测量
  const handleStartMeasurement = async () => {
    if (selectedParameters.length === 0) {
      addLog('请先选择测量参数！', 'warning', 'vna')
      setToast({ message: '请先选择测量参数！', type: 'warning' })
      return
    }

    addLog(`开始测量，参数: ${selectedParameters.join(', ')}`, 'info', 'vna')
    addLog(`测量次数: ${measurementCount}, 频点数: ${frequencyPoints}`, 'info', 'vna')

    setIsMeasuring(true)
    setMeasurementProgress(0)
    setMeasurementResults([])

    try {
      const response = await vnaAPI.startMeasurement({
        device: selectedDevice ? {
          id: selectedDevice.id,
          ipAddress: selectedDevice.ipAddress,
          port: selectedDevice.port || 5025
        } : null,
        parameters: selectedParameters,
        measurementCount: Number(measurementCount),
        frequencyPoints: Number(frequencyPoints),
        startFrequency: Number(startFrequency),
        stopFrequency: Number(stopFrequency)
      })

      const data = response.data

      if (!data.success) {
        const errorMsg = data.message || '测量启动失败'
        addLog(`测量启动失败: ${errorMsg}`, 'error', 'vna')
        setIsMeasuring(false)
      }
    } catch (error) {
      handleAPIError(error, addLog, 'vna')
      setIsMeasuring(false)
    }
  }

  // 停止测量
  const handleStopMeasurement = async () => {
    try {
      await vnaAPI.stopMeasurement()
      addLog('测量已停止', 'info', 'vna')
      setIsMeasuring(false)
    } catch (error) {
      handleAPIError(error, addLog, 'vna')
    }
  }

  // 查看数据（打开文件夹）
  const handleExportData = async () => {
    if (measurementResults.length === 0) {
      addLog('没有可查看的数据', 'warning', 'vna')
      setToast({ message: '没有可查看的数据！', type: 'warning' })
      return
    }

    try {
      const response = await fetch('/api/vna/open-results-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: measurementResults })
      })

      const data = await response.json()

      if (data.success) {
        addLog(`已打开结果文件夹: ${data.path}`, 'success', 'vna')
        setToast({ message: '已打开结果文件夹！', type: 'success' })
      } else {
        throw new Error(data.message || '打开文件夹失败')
      }
    } catch (error) {
      console.error('打开文件夹失败:', error)
      addLog('打开结果文件夹失败', 'error', 'vna')
      setToast({ message: error.message || '打开文件夹失败', type: 'error' })
    }
  }

  // 轮询测量状态
  useEffect(() => {
    if (!isMeasuring) return

    let cancelled = false
    const intervalId = setInterval(async () => {
      try {
        const res = await vnaAPI.getMeasurementStatus()
        if (!res.data) return

        const data = res.data
        if (cancelled) return

        setMeasurementProgress(Number(data?.progress || 0))
        setCurrentCount(Number(data?.current_measurement || 0))
        setTotalCount(Number(data?.total_measurements || 0))

        if (Array.isArray(data?.results)) {
          setMeasurementResults(data.results)
        }

        if (!data?.is_running) {
          clearInterval(intervalId)
          setIsMeasuring(false)
          addLog(`测量完成！共测量 ${totalCount} 个参数`, 'success', 'vna')
        }
      } catch (error) {
        // 忽略单次轮询错误
      }
    }, 800)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [isMeasuring])

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration || 3000}
          onClose={() => setToast(null)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：设备连接和参数选择 */}
        <div className="lg:col-span-1 space-y-6">
          <VNAConnection
            selectedDevice={selectedDevice}
            onDeviceSelect={setSelectedDevice}
            onConnectionChange={setIsConnected}
            addLog={addLog}
          />

          <VNAParameters />

          <VNAMixerConfig
            isConnected={isConnected}
            deviceType={selectedDevice?.id}
            addLog={addLog}
          />
        </div>

        {/* 中间：测量进度和结果 */}
        <div className="lg:col-span-1">
          <VNAProgress />
        </div>

        {/* 右侧：测量控制 */}
        <div className="lg:col-span-1">
          <VNAMeasurement
            onStart={handleStartMeasurement}
            onStop={handleStopMeasurement}
            onExport={handleExportData}
          />
        </div>
      </div>
    </>
  )
}

export default VNAModule
