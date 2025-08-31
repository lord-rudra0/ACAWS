// Enhanced error reporting and monitoring utilities

class ErrorReporter {
  constructor() {
    this.errorQueue = []
    this.isOnline = navigator.onLine
    this.maxQueueSize = 50
    
    // Listen for network status changes
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers()
  }

  setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // Catch resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.reportError({
          type: 'resource_error',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          timestamp: new Date().toISOString()
        })
      }
    }, true)
  }

  reportError(errorData) {
    try {
      const enhancedError = this.enhanceErrorData(errorData)
      
      if (this.isOnline) {
        this.sendErrorToServer(enhancedError)
      } else {
        this.queueError(enhancedError)
      }
      
      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.group('🚨 Error Reported')
        console.error('Error Data:', enhancedError)
        console.groupEnd()
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError)
    }
  }

  enhanceErrorData(errorData) {
    return {
      ...errorData,
      id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: errorData.timestamp || new Date().toISOString(),
      userId: localStorage.getItem('userId') || 'anonymous',
      sessionId: this.getSessionId(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: {
        online: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || 'unknown'
      },
      performance: this.getPerformanceMetrics()
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  getPerformanceMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
        memoryUsage: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    } catch (error) {
      return null
    }
  }

  async sendErrorToServer(errorData) {
    try {
      const response = await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })

      if (!response.ok) {
        throw new Error(`Error reporting failed: ${response.status}`)
      }

      console.log('Error reported successfully:', errorData.id)
    } catch (error) {
      console.error('Failed to send error to server:', error)
      this.queueError(errorData)
    }
  }

  queueError(errorData) {
    this.errorQueue.push(errorData)
    
    // Limit queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('errorQueue', JSON.stringify(this.errorQueue))
    } catch (error) {
      console.error('Failed to store error queue:', error)
    }
  }

  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

    console.log(`Flushing ${this.errorQueue.length} queued errors...`)

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      const response = await fetch('/api/errors/batch-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errors })
      })

      if (response.ok) {
        localStorage.removeItem('errorQueue')
        console.log('Error queue flushed successfully')
      } else {
        // Re-queue errors if sending failed
        this.errorQueue = [...errors, ...this.errorQueue]
      }
    } catch (error) {
      console.error('Failed to flush error queue:', error)
      this.errorQueue = [...errors, ...this.errorQueue]
    }
  }

  // Load queued errors from localStorage on initialization
  loadQueuedErrors() {
    try {
      const stored = localStorage.getItem('errorQueue')
      if (stored) {
        this.errorQueue = JSON.parse(stored)
        console.log(`Loaded ${this.errorQueue.length} queued errors from storage`)
      }
    } catch (error) {
      console.error('Failed to load error queue:', error)
      localStorage.removeItem('errorQueue')
    }
  }

  getErrorStats() {
    return {
      queuedErrors: this.errorQueue.length,
      isOnline: this.isOnline,
      sessionId: this.getSessionId()
    }
  }
}

// Create global error reporter instance
const errorReporter = new ErrorReporter()
errorReporter.loadQueuedErrors()

// Export utility functions
export const reportError = (errorData) => {
  errorReporter.reportError(errorData)
}

export const getErrorStats = () => {
  return errorReporter.getErrorStats()
}

export const flushErrors = () => {
  return errorReporter.flushErrorQueue()
}

export default errorReporter