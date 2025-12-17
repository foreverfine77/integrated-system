/**
 * API端点常量
 * 统一管理所有API路径，避免硬编码字符串分散
 */

// ==================== 矩阵开关API ====================
export const MATRIX_ENDPOINTS = {
    PORTS: '/api/matrix/ports',
    CONNECT: '/api/matrix/connect',
    DISCONNECT: '/api/matrix/disconnect',
    STATUS: '/api/matrix/status',
    COMMAND: '/api/matrix/command',
    ROUTE: '/api/matrix/route',
    SWITCH: '/api/matrix/switch',
}

// ==================== VNA API ====================
export const VNA_ENDPOINTS = {
    DEVICES: '/api/vna/devices',
    CONNECT: '/api/vna/connect',
    DISCONNECT: '/api/vna/disconnect',
    STATUS: '/api/vna/status',
    START_MEASUREMENT: '/api/vna/start-measurement',
    STOP_MEASUREMENT: '/api/vna/stop-measurement',
    MEASUREMENT_STATUS: '/api/vna/measurement-status',
    EXPORT_DATA: '/api/vna/export-data',
    MIXER_CONFIG: '/api/vna/mixer-config',
    CONNECTION_HISTORY: '/api/vna/connection-history',
    CONNECTION_HISTORY_CLEAR: '/api/vna/connection-history/clear',
}

// ==================== 系统API ====================
export const SYSTEM_ENDPOINTS = {
    HEALTH: '/api/health',
}

// 所有端点的联合导出
export const API_ENDPOINTS = {
    ...MATRIX_ENDPOINTS,
    ...VNA_ENDPOINTS,
    ...SYSTEM_ENDPOINTS,
}

export default API_ENDPOINTS
