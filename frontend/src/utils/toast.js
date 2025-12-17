/**
 * Toast通知工具函数
 * 简化Toast调用，避免重复代码
 */

/**
 * 显示成功Toast
 */
export function showSuccess(setToast, message, duration = 3000) {
    setToast({
        message,
        type: 'success',
        duration
    })
}

/**
 * 显示错误Toast
 */
export function showError(setToast, message, duration = 5000) {
    setToast({
        message,
        type: 'error',
        duration
    })
}

/**
 * 显示警告Toast
 */
export function showWarning(setToast, message, duration = 4000) {
    setToast({
        message,
        type: 'warning',
        duration
    })
}

/**
 * 显示信息Toast
 */
export function showInfo(setToast, message, duration = 3000) {
    setToast({
        message,
        type: 'info',
        duration
    })
}
