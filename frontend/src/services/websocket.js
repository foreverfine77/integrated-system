import { io } from 'socket.io-client'

/**
 * WebSocket配置
 */
const SOCKET_URL = window.location.origin

/**
 * 创建WebSocket连接
 */
class WebSocketService {
    constructor() {
        this.socket = null
        this.listeners = new Map()
    }

    /**
     * 连接WebSocket服务器
     */
    connect() {
        if (this.socket?.connected) {
            return this.socket
        }

        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        })

        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected to server')
        })

        this.socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason)
        })

        this.socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error)
        })

        return this.socket
    }

    /**
     * 订阅事件
     */
    on(event, callback) {
        if (!this.socket) {
            this.connect()
        }

        // 保存监听器引用
        if (!this.listeners.has(event)) {
            this.listeners.set(event, [])
        }
        this.listeners.get(event).push(callback)

        this.socket.on(event, callback)
    }

    /**
     * 取消订阅
     */
    off(event, callback) {
        if (!this.socket) return

        this.socket.off(event, callback)

        // 从监听器列表中移除
        const listeners = this.listeners.get(event)
        if (listeners) {
            const index = listeners.indexOf(callback)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }

    /**
     * 发送事件
     */
    emit(event, data) {
        if (!this.socket?.connected) {
            console.warn('[WebSocket] Not connected, cannot emit:', event)
            return
        }

        this.socket.emit(event, data)
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            // 清理所有监听器
            this.listeners.forEach((callbacks, event) => {
                callbacks.forEach(callback => {
                    this.socket.off(event, callback)
                })
            })
            this.listeners.clear()

            this.socket.disconnect()
            this.socket = null
        }
    }

    /**
     * 检查连接状态
     */
    isConnected() {
        return this.socket?.connected || false
    }
}

// 创建单例
const socketService = new WebSocketService()

export default socketService
