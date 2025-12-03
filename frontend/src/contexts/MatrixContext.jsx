import { createContext, useContext, useState, useCallback } from 'react'

/**
 * 矩阵开关上下文
 * 管理矩阵开关的连接状态和相关数据
 */
const MatrixContext = createContext()

export function MatrixProvider({ children }) {
    const [isConnected, setIsConnected] = useState(false)
    const [selectedPort, setSelectedPort] = useState('')
    const [isConnecting, setIsConnecting] = useState(false)

    const value = {
        isConnected,
        setIsConnected,
        selectedPort,
        setSelectedPort,
        isConnecting,
        setIsConnecting,
    }

    return (
        <MatrixContext.Provider value={value}>
            {children}
        </MatrixContext.Provider>
    )
}

/**
 * 使用Matrix上下文的Hook
 */
export function useMatrix() {
    const context = useContext(MatrixContext)
    if (!context) {
        throw new Error('useMatrix must be used within MatrixProvider')
    }
    return context
}

export default MatrixContext
