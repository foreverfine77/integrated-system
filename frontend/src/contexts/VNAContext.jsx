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

    // 混频器配置
    const [mixerConfig, setMixerConfig] = useState({
        rfPort: 1,
        ifPort: 2,
        loPort: 3,
        loFrequency: 300,  // MHz
        loPower: 10,       // dBm
        conversionMode: 'DCUP'
    })

    // 当前激活的测量Tab
    const [activeMeasurementTab, setActiveMeasurementTab] = useState('basic') // 'basic' | 'mixer' | 'power'


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
        // 混频器配置
        mixerConfig,
        setMixerConfig,
        // Tab状态
        activeMeasurementTab,
        setActiveMeasurementTab,
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
