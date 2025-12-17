import { handleAPIError } from './api'

/**
 * 统一的API调用包装器
 * 自动处理loading、错误、Toast通知等常见逻辑
 */
export async function callAPI(apiMethod, options = {}) {
    const {
        loadingSetter,      // setIsLoading - 自动管理loading状态
        onSuccess,          // 成功回调函数
        onError,            // 错误回调函数
        addLog,             // 日志函数
        source = 'system',  // 日志来源 ('vna', 'matrix', 'system')
        successMessage,     // 成功时的Toast消息
        errorMessage,       // 错误时的Toast消息（可选，默认使用API返回的错误）
        showToast,          // setToast函数
        validateResponse = true, // 是否验证response.data.success
    } = options

    // 开始loading
    if (loadingSetter) {
        loadingSetter(true)
    }

    try {
        // 调用API方法
        const response = await apiMethod()

        // 验证响应（如果启用）
        if (validateResponse && response.data?.success === false) {
            const error = response.data?.message ||
                response.data?.errors?.join('; ') ||
                '操作失败'
            throw new Error(error)
        }

        // 成功处理
        if (successMessage && showToast) {
            showToast({
                message: successMessage,
                type: 'success',
                duration: 3000
            })
        }

        if (addLog && successMessage) {
            addLog(successMessage, 'success', source)
        }

        if (onSuccess) {
            onSuccess(response.data)
        }

        return response.data

    } catch (error) {
        // 错误处理
        const errorMsg = errorMessage || error.message || '操作失败'

        if (showToast) {
            showToast({
                message: errorMsg,
                type: 'error',
                duration: 5000
            })
        }

        if (addLog) {
            handleAPIError(error, addLog, source)
        }

        if (onError) {
            onError(error)
        }

        // 重新抛出错误，让调用者可以选择性处理
        throw error

    } finally {
        // 结束loading
        if (loadingSetter) {
            loadingSetter(false)
        }
    }
}

/**
 * 创建可取消的API请求
 * 用于避免组件卸载后仍然处理响应的问题
 */
export function createCancellableRequest(apiClient) {
    const abortController = new AbortController()

    const request = (config) => apiClient({
        ...config,
        signal: abortController.signal
    })

    return {
        request,
        cancel: () => abortController.abort(),
        signal: abortController.signal
    }
}

/**
 * 批量API调用
 * 同时执行多个API请求并等待全部完成
 */
export async function callAPIBatch(apiCalls, options = {}) {
    const {
        loadingSetter,
        showToast,
        addLog,
        source = 'system',
        onSuccess,
        onError
    } = options

    if (loadingSetter) {
        loadingSetter(true)
    }

    try {
        const results = await Promise.all(
            apiCalls.map(({ method, params }) => method(params))
        )

        if (onSuccess) {
            onSuccess(results)
        }

        return results

    } catch (error) {
        if (showToast) {
            showToast({
                message: error.message || '批量操作失败',
                type: 'error',
                duration: 5000
            })
        }

        if (addLog) {
            handleAPIError(error, addLog, source)
        }

        if (onError) {
            onError(error)
        }

        throw error

    } finally {
        if (loadingSetter) {
            loadingSetter(false)
        }
    }
}

export default callAPI
