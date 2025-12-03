import { createContext, useContext, useState } from 'react'

/**
 * VNA上下文
 * 管理VNA的连接状态、测量状态和结果
 */
const VNAContext = createContext()

export function VNAProvider({ children }) {
    const [selectedDevice, setSelectedDevice] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [selectedParameters, setSelectedParameters] = useState([])
    const [isMeasuring, setIsMeasuring] = useState(false)
    const [measurementProgress, setMeasurementProgress] = useState(0)
    const [measurementResults, setMeasurementResults] = useState([])
    const [currentCount, setCurrentCount] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // 测量配置参数
    const [measurementCount, setMeasurementCount] = useState(50)
    const [frequencyPoints, setFrequencyPoints] = useState(201)
    const [startFrequency, setStartFrequency] = useState(500)
    const [stopFrequency, setStopFrequency] = useState(2500)

    const value = {
        selectedDevice,
        setSelectedDevice,
        isConnected,
        setIsConnected,
        selectedParameters,
        setSelectedParameters,
        isMeasuring,
        setIsMeasuring,
        measurementProgress,
        setMeasurementProgress,
        measurementResults,
        setMeasurementResults,
        currentCount,
        setCurrentCount,
        totalCount,
        setTotalCount,
        measurementCount,
        setMeasurementCount,
        frequencyPoints,
        setFrequencyPoints,
        startFrequency,
        setStartFrequency,
        stopFrequency,
        setStopFrequency,
    }

    return (
        <VNAContext.Provider value={value}>
            {children}
        </VNAContext.Provider>
    )
}

/**
 * 使用VNA上下文的Hook
 */
export function useVNA() {
    const context = useContext(VNAContext)
    if (!context) {
        throw new Error('useVNA must be used within VNAProvider')
    }
    return context
}

export default VNAContext
