import { useState } from 'react'
import { callAPI } from '../services/apiWrapper'

/**
 * API调用自定义Hook
 * 自动管理loading状态，简化API调用
 * 
 * @example
 * const { isLoading, execute } = useAPICall()
 * 
 * const handleConnect = async () => {
 *   await execute(
 *     () => vnaAPI.connect({device_type, ip_address, port}),
 *     {
 *       successMessage: '连接成功',
 *       addLog,
 *       source: 'vna',
 *       showToast: setToast,
 *       onSuccess: (data) => setIsConnected(true)
 *     }
 *   )
 * }
 */
export function useAPICall() {
    const [isLoading, setIsLoading] = useState(false)

    const execute = async (apiMethod, options = {}) => {
        return callAPI(apiMethod, {
            loadingSetter: setIsLoading,
            ...options
        })
    }

    return {
        isLoading,
        execute
    }
}

/**
 * 多个loading状态管理Hook
 * 用于需要管理多个独立loading状态的场景
 * 
 * @example
 * const { loading, setLoading } = useMultiLoading(['connect', 'fetch', 'save'])
 * 
 * setLoading('connect', true)
 * // loading.connect === true
 */
export function useMultiLoading(keys = []) {
    const initialState = keys.reduce((acc, key) => {
        acc[key] = false
        return acc
    }, {})

    const [loading, setLoadingState] = useState(initialState)

    const setLoading = (key, value) => {
        setLoadingState(prev => ({
            ...prev,
            [key]: value
        }))
    }

    return {
        loading,
        setLoading
    }
}

export default useAPICall
