import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Zap
} from 'lucide-react'

const PerformanceMonitor = ({ cognitiveState = {}, sessionData = {}, onAlert }) => {
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [alerts, setAlerts] = useState([])
  const [performanceScore, setPerformanceScore] = useState(75)
  const [trends, setTrends] = useState({})

  useEffect(() => {
    if (Object.keys(cognitiveState).length > 0) {
      updatePerformanceMetrics(cognitiveState)
    }
  }, [cognitiveState])

  const updatePerformanceMetrics = (state) => {
    const timestamp = new Date()
    const newScore = calculatePerformanceScore(state)
    
    // Update performance history
    const newEntry = {
      timestamp,
      score: newScore,
      attention: state.attention || 0,
      engagement: state.engagement || 0,
      fatigue: state.fatigue || 0,
      confusion: state.confusion || 0
    }
    
    setPerformanceHistory(prev => {
      const updated = [...prev, newEntry]
      return updated.slice(-50) // Keep last 50 entries
    })
    
    setPerformanceScore(newScore)
    
    // Analyze trends
    if (performanceHistory.length >= 5) {
      const newTrends = analyzeTrends([...performanceHistory, newEntry])
      setTrends(newTrends)
      
      // Check for alerts
      const newAlerts = checkForAlerts(newEntry, newTrends)
      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts])
        newAlerts.forEach(alert => {
          if (onAlert) onAlert(alert)
          if (window.toast) {
            window.toast.warning(alert.message, { duration: 5000 })
          }
        })
      }
    }
  }

  const calculatePerformanceScore = (state) => {
    const weights = {
      attention: 0.3,
      engagement: 0.25,
      fatigue: -0.2, // Negative impact
      confusion: -0.25 // Negative impact
    }
    
    let score = 50 // Base score
    
    Object.entries(weights).forEach(([metric, weight]) => {
      const value = state[metric] || 0
      score += value * weight
    })
    
    return Math.max(0, Math.min(100, score))
  }

  const analyzeTrends = (history) => {
    const recentData = history.slice(-10)
    
    const trends = {}
    const metrics = ['score', 'attention', 'engagement', 'fatigue', 'confusion']
    
    metrics.forEach(metric => {
      const values = recentData.map(entry => entry[metric])
      const slope = calculateTrend(values)
      
      trends[metric] = {
        direction: slope > 0.5 ? 'improving' : slope < -0.5 ? 'declining' : 'stable',
        slope,
        current: values[values.length - 1] || 0,
        average: values.reduce((a, b) => a + b, 0) / values.length
      }
    })
    
    return trends
  }

  const calculateTrend = (values) => {
    if (values.length < 3) return 0
    
    const x = values.map((_, i) => i)
    const y = values
    
    const n = values.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    return isNaN(slope) ? 0 : slope
  }

  const checkForAlerts = (currentEntry, trends) => {
    const alerts = []
    const timestamp = new Date()
    
    // Performance decline alert
    if (trends.score?.direction === 'declining' && currentEntry.score < 60) {
      alerts.push({
        id: `alert_${timestamp.getTime()}`,
        type: 'performance_decline',
        severity: 'medium',
        message: 'Performance declining - consider taking a break',
        timestamp,
        data: { currentScore: currentEntry.score, trend: trends.score.slope }
      })
    }
    
    // High fatigue alert
    if (currentEntry.fatigue > 80) {
      alerts.push({
        id: `alert_${timestamp.getTime() + 1}`,
        type: 'high_fatigue',
        severity: 'high',
        message: 'High fatigue detected - immediate break recommended',
        timestamp,
        data: { fatigueLevel: currentEntry.fatigue }
      })
    }
    
    // Low attention alert
    if (currentEntry.attention < 30 && trends.attention?.direction === 'declining') {
      alerts.push({
        id: `alert_${timestamp.getTime() + 2}`,
        type: 'low_attention',
        severity: 'medium',
        message: 'Attention levels dropping - try changing environment',
        timestamp,
        data: { attentionLevel: currentEntry.attention }
      })
    }
    
    // High confusion alert
    if (currentEntry.confusion > 70) {
      alerts.push({
        id: `alert_${timestamp.getTime() + 3}`,
        type: 'high_confusion',
        severity: 'medium',
        message: 'High confusion detected - consider simpler explanations',
        timestamp,
        data: { confusionLevel: currentEntry.confusion }
      })
    }
    
    return alerts
  }

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-blue-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Performance Score Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Monitor
          </h3>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Live</span>
          </div>
        </div>

        {/* Main Performance Score */}
        <div className="text-center mb-6">
          <div className={`text-4xl font-bold ${getPerformanceColor(performanceScore)} mb-2`}>
            {Math.round(performanceScore)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Performance Score</div>
          {trends.score && (
            <div className="flex items-center justify-center space-x-1 mt-2">
              {getTrendIcon(trends.score.direction)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {trends.score.direction}
              </span>
            </div>
          )}
        </div>

        {/* Metric Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'attention', label: 'Attention', icon: Brain, value: cognitiveState.attention || 0 },
            { key: 'engagement', label: 'Engagement', icon: Zap, value: cognitiveState.engagement || 0 },
            { key: 'fatigue', label: 'Fatigue', icon: Clock, value: cognitiveState.fatigue || 0, invert: true },
            { key: 'confusion', label: 'Confusion', icon: Target, value: cognitiveState.confusion || 0, invert: true }
          ].map((metric) => {
            const Icon = metric.icon
            const trend = trends[metric.key]
            const displayValue = metric.invert ? 100 - metric.value : metric.value
            
            return (
              <div key={metric.key} className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                  {trend && getTrendIcon(trend.direction)}
                </div>
                <div className={`text-lg font-semibold ${getPerformanceColor(displayValue)}`}>
                  {Math.round(displayValue)}%
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Active Alerts */}
      <AnimatePresence>
        {alerts.slice(-3).map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className={`p-4 rounded-lg border-l-4 ${
              alert.severity === 'high' 
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <div>
                  <p className={`font-medium text-sm ${
                    alert.severity === 'high' 
                      ? 'text-red-800 dark:text-red-200' 
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissAlert(alert.id)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Performance Insights */}
      {Object.keys(trends).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Insights
          </h4>
          
          <div className="space-y-3">
            {Object.entries(trends).map(([metric, trend]) => (
              <div key={metric} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTrendIcon(trend.direction)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {metric.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {Math.round(trend.current)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Avg: {Math.round(trend.average)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PerformanceMonitor