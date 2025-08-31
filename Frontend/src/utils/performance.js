// Performance monitoring and optimization utilities

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      apiCalls: [],
      renderTimes: [],
      memoryUsage: [],
      userInteractions: []
    }
    
    this.observers = {
      intersection: null,
      mutation: null,
      performance: null
    }
    
    this.init()
  }

  init() {
    // Monitor page load performance
    this.monitorPageLoad()
    
    // Monitor API performance
    this.monitorAPIPerformance()
    
    // Monitor render performance
    this.monitorRenderPerformance()
    
    // Monitor memory usage
    this.monitorMemoryUsage()
    
    // Monitor user interactions
    this.monitorUserInteractions()
  }

  monitorPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0]
      
      this.metrics.pageLoad = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint(),
        timestamp: new Date().toISOString()
      }
      
      this.reportPerformanceMetrics('page_load', this.metrics.pageLoad)
    })
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : null
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : null
  }

  getLargestContentfulPaint() {
    return new Promise((resolve) => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        resolve(lastEntry ? lastEntry.startTime : null)
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // Timeout after 10 seconds
      setTimeout(() => resolve(null), 10000)
    })
  }

  monitorAPIPerformance() {
    // Intercept fetch requests
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const startTime = performance.now()
      const url = args[0]
      
      try {
        const response = await originalFetch(...args)
        const endTime = performance.now()
        
        this.recordAPICall({
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: response.status,
          duration: endTime - startTime,
          success: response.ok,
          timestamp: new Date().toISOString()
        })
        
        return response
      } catch (error) {
        const endTime = performance.now()
        
        this.recordAPICall({
          url: typeof url === 'string' ? url : url.url,
          method: args[1]?.method || 'GET',
          status: 0,
          duration: endTime - startTime,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        })
        
        throw error
      }
    }
  }

  recordAPICall(callData) {
    this.metrics.apiCalls.push(callData)
    
    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift()
    }
    
    // Report slow API calls
    if (callData.duration > 5000) { // 5 seconds
      this.reportPerformanceIssue('slow_api_call', {
        url: callData.url,
        duration: callData.duration,
        method: callData.method
      })
    }
  }

  monitorRenderPerformance() {
    // Monitor React component render times
    if (window.React && window.React.Profiler) {
      this.setupReactProfiler()
    }
    
    // Monitor frame rate
    this.monitorFrameRate()
  }

  setupReactProfiler() {
    // This would be integrated with React DevTools Profiler
    // For now, we'll use a simple render time tracker
    const originalRender = React.Component.prototype.render
    
    React.Component.prototype.render = function() {
      const startTime = performance.now()
      const result = originalRender.call(this)
      const endTime = performance.now()
      
      if (endTime - startTime > 16) { // Longer than one frame (60fps)
        console.warn(`Slow render detected: ${this.constructor.name} took ${endTime - startTime}ms`)
      }
      
      return result
    }
  }

  monitorFrameRate() {
    let lastTime = performance.now()
    let frameCount = 0
    
    const measureFPS = (currentTime) => {
      frameCount++
      
      if (currentTime - lastTime >= 1000) { // Every second
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        this.metrics.renderTimes.push({
          fps,
          timestamp: new Date().toISOString()
        })
        
        // Keep only last 60 measurements (1 minute)
        if (this.metrics.renderTimes.length > 60) {
          this.metrics.renderTimes.shift()
        }
        
        // Report low FPS
        if (fps < 30) {
          this.reportPerformanceIssue('low_fps', { fps, timestamp: new Date().toISOString() })
        }
        
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }

  monitorMemoryUsage() {
    if (!performance.memory) return
    
    setInterval(() => {
      const memoryInfo = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      }
      
      this.metrics.memoryUsage.push(memoryInfo)
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift()
      }
      
      // Check for memory leaks
      const usagePercentage = (memoryInfo.used / memoryInfo.limit) * 100
      if (usagePercentage > 80) {
        this.reportPerformanceIssue('high_memory_usage', {
          usagePercentage,
          usedMB: Math.round(memoryInfo.used / 1024 / 1024),
          limitMB: Math.round(memoryInfo.limit / 1024 / 1024)
        })
      }
    }, 10000) // Every 10 seconds
  }

  monitorUserInteractions() {
    const interactionTypes = ['click', 'scroll', 'keypress', 'touchstart']
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now()
        
        // Measure interaction response time
        requestAnimationFrame(() => {
          const responseTime = performance.now() - startTime
          
          this.metrics.userInteractions.push({
            type,
            responseTime,
            target: event.target.tagName,
            timestamp: new Date().toISOString()
          })
          
          // Keep only last 50 interactions
          if (this.metrics.userInteractions.length > 50) {
            this.metrics.userInteractions.shift()
          }
          
          // Report slow interactions
          if (responseTime > 100) { // 100ms threshold
            this.reportPerformanceIssue('slow_interaction', {
              type,
              responseTime,
              target: event.target.tagName
            })
          }
        })
      }, { passive: true })
    })
  }

  reportPerformanceIssue(type, data) {
    const issue = {
      type: `performance_${type}`,
      data,
      timestamp: new Date().toISOString(),
      severity: this.calculateSeverity(type, data)
    }
    
    // Report as error
    this.reportError(issue)
    
    // Show user notification for severe issues
    if (issue.severity === 'high' && window.toast) {
      window.toast.warning(
        'Performance issue detected. The app may be running slowly.',
        { duration: 5000 }
      )
    }
  }

  calculateSeverity(type, data) {
    switch (type) {
      case 'slow_api_call':
        return data.duration > 10000 ? 'high' : 'medium'
      case 'low_fps':
        return data.fps < 15 ? 'high' : 'medium'
      case 'high_memory_usage':
        return data.usagePercentage > 90 ? 'high' : 'medium'
      case 'slow_interaction':
        return data.responseTime > 200 ? 'high' : 'medium'
      default:
        return 'low'
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
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to send error to server:', error)
      this.queueError(errorData)
    }
  }

  queueError(errorData) {
    this.errorQueue.push(errorData)
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
    
    try {
      localStorage.setItem('performanceErrorQueue', JSON.stringify(this.errorQueue))
    } catch (error) {
      console.error('Failed to queue error:', error)
    }
  }

  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

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
        localStorage.removeItem('performanceErrorQueue')
      } else {
        this.errorQueue = [...errors, ...this.errorQueue]
      }
    } catch (error) {
      this.errorQueue = [...errors, ...this.errorQueue]
    }
  }

  getPerformanceReport() {
    return {
      pageLoad: this.metrics.pageLoad,
      apiPerformance: this.getAPIPerformanceStats(),
      renderPerformance: this.getRenderPerformanceStats(),
      memoryUsage: this.getMemoryStats(),
      userInteractions: this.getInteractionStats(),
      timestamp: new Date().toISOString()
    }
  }

  getAPIPerformanceStats() {
    const apiCalls = this.metrics.apiCalls
    if (apiCalls.length === 0) return null

    const durations = apiCalls.map(call => call.duration)
    const successRate = (apiCalls.filter(call => call.success).length / apiCalls.length) * 100

    return {
      totalCalls: apiCalls.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      slowestCall: Math.max(...durations),
      fastestCall: Math.min(...durations),
      successRate,
      errorRate: 100 - successRate
    }
  }

  getRenderPerformanceStats() {
    const renderTimes = this.metrics.renderTimes
    if (renderTimes.length === 0) return null

    const fps = renderTimes.map(rt => rt.fps)
    
    return {
      averageFPS: fps.reduce((a, b) => a + b, 0) / fps.length,
      minFPS: Math.min(...fps),
      maxFPS: Math.max(...fps),
      measurements: renderTimes.length
    }
  }

  getMemoryStats() {
    const memoryUsage = this.metrics.memoryUsage
    if (memoryUsage.length === 0) return null

    const latest = memoryUsage[memoryUsage.length - 1]
    const usageHistory = memoryUsage.map(m => m.used)
    
    return {
      currentUsageMB: Math.round(latest.used / 1024 / 1024),
      limitMB: Math.round(latest.limit / 1024 / 1024),
      usagePercentage: (latest.used / latest.limit) * 100,
      trend: this.calculateMemoryTrend(usageHistory)
    }
  }

  calculateMemoryTrend(usageHistory) {
    if (usageHistory.length < 5) return 'stable'
    
    const recent = usageHistory.slice(-5)
    const older = usageHistory.slice(-10, -5)
    
    if (older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
  }

  getInteractionStats() {
    const interactions = this.metrics.userInteractions
    if (interactions.length === 0) return null

    const responseTimes = interactions.map(i => i.responseTime)
    
    return {
      totalInteractions: interactions.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      slowestInteraction: Math.max(...responseTimes),
      fastestInteraction: Math.min(...responseTimes)
    }
  }

  reportPerformanceMetrics(type, data) {
    // Send performance data to analytics
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        event_category: 'Performance',
        event_label: type,
        value: Math.round(data.loadComplete || data.duration || 0)
      })
    }
    
    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric [${type}]:`, data)
    }
  }

  // Optimization suggestions
  getOptimizationSuggestions() {
    const suggestions = []
    const report = this.getPerformanceReport()
    
    // Page load suggestions
    if (report.pageLoad?.loadComplete > 3000) {
      suggestions.push({
        type: 'page_load',
        priority: 'high',
        suggestion: 'Page load time is slow. Consider code splitting and lazy loading.',
        metric: `${Math.round(report.pageLoad.loadComplete)}ms load time`
      })
    }
    
    // API performance suggestions
    if (report.apiPerformance?.averageDuration > 2000) {
      suggestions.push({
        type: 'api_performance',
        priority: 'medium',
        suggestion: 'API calls are slow. Consider caching and request optimization.',
        metric: `${Math.round(report.apiPerformance.averageDuration)}ms average`
      })
    }
    
    // Memory usage suggestions
    if (report.memoryUsage?.usagePercentage > 70) {
      suggestions.push({
        type: 'memory_usage',
        priority: 'high',
        suggestion: 'High memory usage detected. Check for memory leaks.',
        metric: `${Math.round(report.memoryUsage.usagePercentage)}% memory used`
      })
    }
    
    // Render performance suggestions
    if (report.renderPerformance?.averageFPS < 45) {
      suggestions.push({
        type: 'render_performance',
        priority: 'medium',
        suggestion: 'Low frame rate detected. Optimize animations and rendering.',
        metric: `${Math.round(report.renderPerformance.averageFPS)} FPS average`
      })
    }
    
    return suggestions
  }
}

// Create global performance monitor
const performanceMonitor = new PerformanceMonitor()

// Export utilities
export const getPerformanceReport = () => {
  return performanceMonitor.getPerformanceReport()
}

export const getOptimizationSuggestions = () => {
  return performanceMonitor.getOptimizationSuggestions()
}

export const reportCustomMetric = (name, value, unit = 'ms') => {
  performanceMonitor.reportPerformanceMetrics('custom_metric', {
    name,
    value,
    unit,
    timestamp: new Date().toISOString()
  })
}

export default performanceMonitor