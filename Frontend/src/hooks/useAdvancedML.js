import { useState, useEffect, useCallback, useRef } from 'react'
import advancedMLService from '../services/advancedMLService'
import geminiService from '../services/geminiService'

export const useAdvancedML = (options = {}) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [models, setModels] = useState({})
  const [predictions, setPredictions] = useState({})
  const [insights, setInsights] = useState([])
  const [error, setError] = useState(null)
  const [performance, setPerformance] = useState({
    totalPredictions: 0,
    averageAccuracy: 0,
    averageResponseTime: 0
  })
  
  const predictionCache = useRef(new Map())
  const performanceMetrics = useRef([])

  const {
    enableCaching = true,
    cacheTimeout = 300000, // 5 minutes
    enablePerformanceTracking = true,
    autoInitialize = true
  } = options

  useEffect(() => {
    if (autoInitialize) {
      initializeML()
    }
  }, [autoInitialize])

  const initializeML = useCallback(async () => {
    try {
      setError(null)
      await advancedMLService.initialize()
      
      setModels({
        emotion: 'loaded',
        attention: 'loaded',
        fatigue: 'loaded',
        performance: 'loaded',
        wellness: 'loaded'
      })
      
      setIsInitialized(true)
      console.log('✅ Advanced ML hook initialized')
    } catch (error) {
      console.error('❌ ML initialization failed:', error)
      setError({
        type: 'initialization',
        message: 'Failed to initialize ML models',
        details: error.message
      })
    }
  }, [])

  const analyzeEmotion = useCallback(async (imageData, options = {}) => {
    if (!isInitialized) {
      throw new Error('ML service not initialized')
    }

    const cacheKey = `emotion_${Date.now()}`
    
    try {
      const startTime = Date.now()
      
      // Check cache if enabled
      if (enableCaching && predictionCache.current.has(cacheKey)) {
        const cached = predictionCache.current.get(cacheKey)
        if (Date.now() - cached.timestamp < cacheTimeout) {
          return cached.data
        }
      }

      const result = await advancedMLService.analyzeEmotionAdvanced(imageData)
      const responseTime = Date.now() - startTime

      // Cache result
      if (enableCaching) {
        predictionCache.current.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        })
      }

      // Track performance
      if (enablePerformanceTracking) {
        trackPredictionPerformance('emotion', responseTime, result.confidence)
      }

      return result
    } catch (error) {
      console.error('Emotion analysis failed:', error)
      setError({
        type: 'prediction',
        message: 'Emotion analysis failed',
        details: error.message
      })
      throw error
    }
  }, [isInitialized, enableCaching, cacheTimeout, enablePerformanceTracking])

  const analyzeAttention = useCallback(async (imageData, contextData = {}) => {
    if (!isInitialized) {
      throw new Error('ML service not initialized')
    }

    try {
      const startTime = Date.now()
      const result = await advancedMLService.analyzeAttentionAdvanced(imageData, contextData)
      const responseTime = Date.now() - startTime

      if (enablePerformanceTracking) {
        trackPredictionPerformance('attention', responseTime, result.gazeAnalysis?.confidence || 0.5)
      }

      return result
    } catch (error) {
      console.error('Attention analysis failed:', error)
      setError({
        type: 'prediction',
        message: 'Attention analysis failed',
        details: error.message
      })
      throw error
    }
  }, [isInitialized, enablePerformanceTracking])

  const predictLearningOutcome = useCallback(async (studentData, moduleData, cognitiveHistory) => {
    if (!isInitialized) {
      throw new Error('ML service not initialized')
    }

    try {
      const startTime = Date.now()
      const result = await advancedMLService.predictLearningOutcome(studentData, moduleData, cognitiveHistory)
      const responseTime = Date.now() - startTime

      setPredictions(prev => ({
        ...prev,
        learningOutcome: result,
        lastUpdated: new Date()
      }))

      if (enablePerformanceTracking) {
        trackPredictionPerformance('learning_outcome', responseTime, result.confidence)
      }

      return result
    } catch (error) {
      console.error('Learning outcome prediction failed:', error)
      setError({
        type: 'prediction',
        message: 'Learning outcome prediction failed',
        details: error.message
      })
      throw error
    }
  }, [isInitialized, enablePerformanceTracking])

  const generatePersonalizedContent = useCallback(async (topic, userProfile, cognitiveState) => {
    try {
      const result = await geminiService.generatePersonalizedExplanation(topic, userProfile, cognitiveState)
      
      setInsights(prev => [...prev.slice(-9), {
        type: 'personalized_content',
        content: result,
        timestamp: new Date()
      }])

      return result
    } catch (error) {
      console.error('Personalized content generation failed:', error)
      setError({
        type: 'content_generation',
        message: 'Failed to generate personalized content',
        details: error.message
      })
      throw error
    }
  }, [])

  const generateLearningPath = useCallback(async (subject, currentLevel, goals, learningStyle) => {
    try {
      const result = await geminiService.generateLearningPath(subject, currentLevel, goals, learningStyle)
      
      setInsights(prev => [...prev.slice(-9), {
        type: 'learning_path',
        content: result,
        timestamp: new Date()
      }])

      return result
    } catch (error) {
      console.error('Learning path generation failed:', error)
      setError({
        type: 'path_generation',
        message: 'Failed to generate learning path',
        details: error.message
      })
      throw error
    }
  }, [])

  const analyzeProgress = useCallback(async (progressData, cognitiveHistory) => {
    try {
      const result = await geminiService.analyzeStudentProgress(progressData, cognitiveHistory)
      
      setInsights(prev => [...prev.slice(-9), {
        type: 'progress_analysis',
        content: result,
        timestamp: new Date()
      }])

      return result
    } catch (error) {
      console.error('Progress analysis failed:', error)
      setError({
        type: 'analysis',
        message: 'Failed to analyze progress',
        details: error.message
      })
      throw error
    }
  }, [])

  const trackPredictionPerformance = useCallback((type, responseTime, confidence) => {
    const metric = {
      type,
      responseTime,
      confidence,
      timestamp: Date.now()
    }

    performanceMetrics.current.push(metric)
    
    // Keep only last 100 metrics
    if (performanceMetrics.current.length > 100) {
      performanceMetrics.current.shift()
    }

    // Update performance stats
    const metrics = performanceMetrics.current
    setPerformance({
      totalPredictions: metrics.length,
      averageAccuracy: metrics.reduce((sum, m) => sum + m.confidence, 0) / metrics.length,
      averageResponseTime: metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
    })
  }, [])

  const clearCache = useCallback(() => {
    predictionCache.current.clear()
    console.log('ML prediction cache cleared')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getModelStatus = useCallback(() => {
    return {
      initialized: isInitialized,
      models,
      cacheSize: predictionCache.current.size,
      performance,
      lastError: error
    }
  }, [isInitialized, models, performance, error])

  const retryInitialization = useCallback(async () => {
    setError(null)
    setIsInitialized(false)
    await initializeML()
  }, [initializeML])

  return {
    // State
    isInitialized,
    models,
    predictions,
    insights,
    error,
    performance,
    
    // Actions
    initializeML,
    analyzeEmotion,
    analyzeAttention,
    predictLearningOutcome,
    generatePersonalizedContent,
    generateLearningPath,
    analyzeProgress,
    
    // Utilities
    clearCache,
    clearError,
    getModelStatus,
    retryInitialization
  }
}

export default useAdvancedML