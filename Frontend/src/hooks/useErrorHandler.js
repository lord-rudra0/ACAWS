import { useState, useCallback } from 'react'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleAsync = useCallback(async (asyncFunction, options = {}) => {
    const { 
      onSuccess, 
      onError, 
      showLoading = true,
      errorMessage = 'An error occurred',
      maxRetries = 3,
      retryDelay = 1000,
      shouldRetry = () => true
    } = options

    let currentRetry = 0

    const executeWithRetry = async () => {
      try {
        if (showLoading) setLoading(true)
        setError(null)
        
        const result = await asyncFunction()
        
        // Reset retry count on success
        setRetryCount(0)
        
        if (onSuccess) onSuccess(result)
        return { success: true, data: result }
        
      } catch (err) {
        console.error(`Attempt ${currentRetry + 1} failed:`, err)
        
        // Check if we should retry
        if (currentRetry < maxRetries && shouldRetry(err)) {
          currentRetry++
          setRetryCount(currentRetry)
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay * currentRetry))
          
          return executeWithRetry()
        }
        
        // All retries exhausted or shouldn't retry
        const errorMsg = err.response?.data?.message || err.message || errorMessage
        setError({
          message: errorMsg,
          code: err.response?.status || err.code,
          retryCount: currentRetry,
          timestamp: new Date().toISOString(),
          canRetry: currentRetry < maxRetries
        })
        
        if (onError) onError(err)
        
        // Enhanced error logging
        console.group('🚨 Error Handler')
        console.error('Final error after retries:', err)
        console.error('Retry count:', currentRetry)
        console.error('Error details:', {
          message: errorMsg,
          status: err.response?.status,
          data: err.response?.data
        })
        console.groupEnd()
        
        return { success: false, error: errorMsg, retryCount: currentRetry }
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    return executeWithRetry()
  }, [])

  const clearError = useCallback(() => {
    setError(null)
    setRetryCount(0)
  }, [])

  const retry = useCallback((asyncFunction, options = {}) => {
    return handleAsync(asyncFunction, options)
  }, [handleAsync])

  const handleNetworkError = useCallback((error) => {
    if (!navigator.onLine) {
      setError({
        message: 'No internet connection. Please check your network.',
        code: 'NETWORK_ERROR',
        type: 'network'
      })
      return true
    }
    return false
  }, [])

  return {
    error,
    loading,
    retryCount,
    handleAsync,
    clearError,
    retry,
    handleNetworkError
  }
}

export default useErrorHandler