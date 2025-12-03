import { createContext, useContext, useState, useCallback, useEffect } from 'react'

/**
 * 应用全局上下文
 * 管理日志、通知等全局状态
 */
const AppContext = createContext()

export function AppProvider({ children }) {
    const [logs, setLogs] = useState([])

    // 深色模式状态（优先读取 localStorage，否则跟随系统）
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        if (saved !== null) {
            return saved === 'true'
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })

    /**
     * 添加日志
     */
    const addLog = useCallback((message, type = 'info', source = 'matrix') => {
        const timestamp = new Date().toLocaleTimeString('zh-CN')
        const sourcePrefix = source === 'vna' ? '[矢网] '
            : source === 'system' ? '[系统] '
                : '[矩阵] '

        setLogs(prev => [...prev, {
            message: sourcePrefix + message,
            type,
            timestamp,
            source,
            id: Date.now() + Math.random()
        }])
    }, [])

    /**
     * 清空日志
     */
    const clearLogs = useCallback(() => {
        setLogs([])
    }, [])

    /**
     * 切换深色模式
     */
    const toggleDarkMode = useCallback(() => {
        setDarkMode(prev => {
            const newValue = !prev
            localStorage.setItem('darkMode', newValue)
            // 更新 HTML 根元素的 class
            if (newValue) {
                document.documentElement.classList.add('dark')
            } else {
                document.documentElement.classList.remove('dark')
            }
            return newValue
        })
    }, [])

    // 监听系统主题变化（仅当用户未手动设置时）
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e) => {
            if (localStorage.getItem('darkMode') === null) {
                setDarkMode(e.matches)
                if (e.matches) {
                    document.documentElement.classList.add('dark')
                } else {
                    document.documentElement.classList.remove('dark')
                }
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    // 初始化时设置 dark class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    const value = {
        logs,
        addLog,
        clearLogs,
        darkMode,
        toggleDarkMode,
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

/**
 * 使用App上下文的Hook
 */
export function useApp() {
    const context = useContext(AppContext)
    if (!context) {
        throw new Error('useApp must be used within AppProvider')
    }
    return context
}

export default AppContext
