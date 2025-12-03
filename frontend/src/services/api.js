import axios from 'axios'

/**
 * 统一的API配置
 */
const apiClient = axios.create({
    baseURL: '/',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
})

/**
 * 请求拦截器
 */
apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API] ${config.method.toUpperCase()} ${config.url}`)
        return config
    },
    (error) => {
        console.error('[API] Request error:', error)
        return Promise.reject(error)
    }
)

/**
 * 响应拦截器 - 统一错误处理
 */
apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        const errorMsg = error.response?.data?.message || error.message || '请求失败'
        console.error('[API] Response error:', errorMsg)

        // 返回格式化的错误
        return Promise.reject({
            message: errorMsg,
            status: error.response?.status,
            data: error.response?.data,
        })
    }
)

/**
 * 矩阵开关API
 */
export const matrixAPI = {
    // 获取可用端口
    getPorts: () => apiClient.get('/api/matrix/ports'),

    // 连接设备
    connect: (config) => apiClient.post('/api/matrix/connect', config),

    // 断开连接
    disconnect: () => apiClient.post('/api/matrix/disconnect'),

    // 获取状态
    getStatus: () => apiClient.get('/api/matrix/status'),

    // 发送命令
    sendCommand: (command) => apiClient.post('/api/matrix/command', { command }),
}

/**
 * VNA API
 */
export const vnaAPI = {
    // 获取设备列表
    getDevices: () => apiClient.get('/api/vna/devices'),

    // 连接设备
    connect: (config) => apiClient.post('/api/vna/connect', config),

    // 断开连接
    disconnect: () => apiClient.post('/api/vna/disconnect'),

    // 获取状态
    getStatus: () => apiClient.get('/api/vna/status'),

    // 开始测量
    startMeasurement: (config) => apiClient.post('/api/vna/start-measurement', config),

    // 停止测量
    stopMeasurement: () => apiClient.post('/api/vna/stop-measurement'),

    // 获取测量状态
    getMeasurementStatus: () => apiClient.get('/api/vna/measurement-status'),

    // 导出数据
    exportData: (results) => apiClient.post('/api/vna/export-data', { results }, {
        responseType: 'blob'
    }),

    // 获取混频器配置
    getMixerConfig: () => apiClient.get('/api/vna/mixer-config'),

    // 设置混频器配置
    setMixerConfig: (config) => apiClient.post('/api/vna/mixer-config', config),
}

/**
 * 通用错误处理工具
 */
export const handleAPIError = (error, addLog, source = 'system') => {
    // 检测后端不可用的情况
    const isBackendUnavailable =
        error.status === 500 ||
        error.status === 503 ||
        error.message?.includes('Network Error') ||
        error.message?.includes('status code 500') ||
        error.message?.includes('ECONNREFUSED') ||
        !error.status

    if (isBackendUnavailable) {
        if (addLog) {
            addLog('后端服务不可用', 'error', 'system')
        }
        return '后端服务不可用'
    }

    // 其他错误正常处理
    const errorMsg = error.message || '未知错误'

    if (addLog) {
        addLog(`错误: ${errorMsg}`, 'error', source)
    }

    return errorMsg
}

export default apiClient
