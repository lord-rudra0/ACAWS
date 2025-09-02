import { useState, useEffect, useCallback, useRef } from 'react'
import aiOrchestrator from '../services/aiOrchestrator'
import intelligentTutoringService from '../services/intelligentTutoring'
import geminiService from '../services/geminiService'
import advancedMLService from '../services/advancedMLService'
import { pythonAPI, analyticsAPI } from '../services/api'

export const useAIFeatures = (userId, initialContext = {}) => {
  const [aiState, setAiState] = useState({
    isInitialized: false,
    services: {
      orchestrator: 'loading',
      tutoring: 'loading',
      gemini: 'loading',
      ml: 'loading'
    },
    capabilities: {},
    activeFeatures: new Set(),
    performance: {
      responseTime: 0,
      accuracy: 0,
      userSatisfaction: 0
    }
  })
  
  const [tutoringSession, setTutoringSession] = useState(null)
  const [aiInsights, setAiInsights] = useState([])
  const [predictions, setPredictions] = useState({})
  const [recommendations, setRecommendations] = useState([])
  const [learningPath, setLearningPath] = useState(null)
  const [error, setError] = useState(null)
  
  const contextRef = useRef(initialContext)
  const performanceMetrics = useRef({
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0
  })

  useEffect(() => {
    initializeAIFeatures()
  }, [userId])

  const initializeAIFeatures = useCallback(async () => {
    try {
      setError(null)
      
      // Initialize all AI services
      const initPromises = [
        initializeOrchestrator(),
        initializeTutoring(),
        initializeGemini(),
        initializeML()
      ]
      
      const results = await Promise.allSettled(initPromises)
      
      // Update service status
      // First update services and initialization status
      setAiState(prev => ({
        ...prev,
        services: {
          orchestrator: results[0].status === 'fulfilled' ? 'ready' : 'error',
          tutoring: results[1].status === 'fulfilled' ? 'ready' : 'error',
          gemini: results[2].status === 'fulfilled' ? 'ready' : 'error',
          ml: results[3].status === 'fulfilled' ? 'ready' : 'error'
        },
        isInitialized: results.some(r => r.status === 'fulfilled')
      }))
      
      // Then load capabilities in a separate update
      const capabilities = await loadCapabilities()
      setAiState(prev => ({
        ...prev,
        capabilities
      }))
      
      console.log('✅ AI Features initialized')
      
    } catch (error) {
      console.error('❌ AI Features initialization failed:', error)
      setError({
        type: 'initialization',
        message: 'Failed to initialize AI features',
        details: error.message
      })
    }
  }, [userId])

  const initializeOrchestrator = async () => {
    // AI Orchestrator is already initialized as singleton
    return Promise.resolve()
  }

  const initializeTutoring = async () => {
    // Intelligent Tutoring Service is already initialized
    return Promise.resolve()
  }

  const initializeGemini = async () => {
    // Gemini service initialization
    try {
      const pingOnStart = String(import.meta.env.VITE_GEMINI_PING_ON_START || 'false').toLowerCase() === 'true'
      if (!pingOnStart) {
        // Skip quota-consuming probe unless explicitly enabled
        return Promise.resolve()
      }
      await geminiService.generatePersonalizedExplanation(
        'test',
        { learningStyle: 'visual' },
        { attention: 50 }
      )
      return Promise.resolve()
    } catch (error) {
      console.warn('Gemini service may have limited functionality:', error)
      return Promise.resolve() // Don't fail completely
    }
  }

  const initializeML = async () => {
    try {
      await advancedMLService.initialize()
      return Promise.resolve()
    } catch (error) {
      console.warn('ML service initialization failed:', error)
      return Promise.resolve() // Don't fail completely
    }
  }

  const loadCapabilities = async () => {
    return {
      intelligentTutoring: intelligentTutoringService.getTutoringCapabilities(),
      orchestration: aiOrchestrator.getOrchestrationStats(),
      contentGeneration: {
        personalizedExplanations: true,
        adaptiveQuizzes: true,
        learningPaths: true,
        visualAids: true
      },
      realTimeAnalysis: {
        cognitiveStateTracking: true,
        emotionDetection: true,
        attentionMonitoring: true,
        fatigueDetection: true
      },
      predictiveAnalytics: {
        performancePrediction: true,
        riskAssessment: true,
        outcomeForecasting: true,
        optimizationSuggestions: true
      }
    }
  }

  const startTutoringSession = useCallback(async (context = {}) => {
    try {
      const mergedContext = { ...contextRef.current, ...context }
      
      const session = await intelligentTutoringService.startIntelligentTutoringSession(
        userId,
        mergedContext
      )
      
      setTutoringSession(session)
      setAiState(prev => ({
        ...prev,
        activeFeatures: new Set([...prev.activeFeatures, 'tutoring'])
      }))
      
      return session
    } catch (error) {
      console.error('Tutoring session start failed:', error)
      setError({
        type: 'tutoring',
        message: 'Failed to start tutoring session',
        details: error.message
      })
      throw error
    }
  }, [userId])

  const sendTutoringMessage = useCallback(async (message, context = {}) => {
    if (!tutoringSession) {
      throw new Error('No active tutoring session')
    }
    
    try {
      const startTime = Date.now()
      
      const response = await intelligentTutoringService.processIntelligentTutoringRequest(
        tutoringSession.sessionId,
        message,
        { ...contextRef.current, ...context }
      )
      
      const responseTime = Date.now() - startTime
      updatePerformanceMetrics(responseTime, true)
      
      // Update insights
      if (response.followUpInsights) {
        setAiInsights(prev => [...prev.slice(-9), ...response.followUpInsights])
      }
      
      // Update recommendations
      if (response.nextRecommendations) {
        setRecommendations(prev => [...prev.slice(-4), ...response.nextRecommendations])
      }
      
      return response
    } catch (error) {
      console.error('Tutoring message failed:', error)
      updatePerformanceMetrics(0, false)
      throw error
    }
  }, [tutoringSession])

  const generateIntelligentContent = useCallback(async (topic, options = {}) => {
    try {
      const startTime = Date.now()
      
      const contentRequest = {
        topic,
        userProfile: contextRef.current.userProfile || {},
        cognitiveState: contextRef.current.cognitiveState || {},
        ...options
      }
      
      const content = await aiOrchestrator.executeIntelligentWorkflow(
        'content_generation',
        contentRequest
      )
      
      const responseTime = Date.now() - startTime
      updatePerformanceMetrics(responseTime, true)
      
      return content
    } catch (error) {
      console.error('Intelligent content generation failed:', error)
      updatePerformanceMetrics(0, false)
      throw error
    }
  }, [])

  const generateLearningPath = useCallback(async (subject, goals, options = {}) => {
    try {
      const pathRequest = {
        subject,
        goals,
        userProfile: contextRef.current.userProfile || {},
        learningHistory: contextRef.current.learningHistory || {},
        ...options
      }
      
      const path = await geminiService.generateLearningPath(
        subject,
        pathRequest.userProfile.experienceLevel || 'intermediate',
        goals,
        pathRequest.userProfile.learningStyle || 'visual'
      )
      
      setLearningPath(path)
      
      return path
    } catch (error) {
      console.error('Learning path generation failed:', error)
      throw error
    }
  }, [])

  const predictLearningOutcome = useCallback(async (moduleData, options = {}) => {
    try {
      const prediction = await advancedMLService.predictLearningOutcome(
        contextRef.current.userProfile || {},
        moduleData,
        contextRef.current.learningHistory?.cognitiveHistory || []
      )
      
      setPredictions(prev => ({
        ...prev,
        [moduleData.id || 'current']: prediction
      }))
      
      return prediction
    } catch (error) {
      console.error('Learning outcome prediction failed:', error)
      throw error
    }
  }, [])

  const generatePersonalizedQuiz = useCallback(async (topic, difficulty = 'medium', questionCount = 5) => {
    try {
      const quiz = await geminiService.generateQuizQuestions(
        topic,
        difficulty,
        contextRef.current.cognitiveState || {},
        questionCount
      )
      
      return quiz
    } catch (error) {
      console.error('Personalized quiz generation failed:', error)
      throw error
    }
  }, [])

  const analyzePerformanceWithAI = useCallback(async (performanceData, timeRange = 'week') => {
    try {
      const analysis = await aiOrchestrator.executeIntelligentWorkflow(
        'performance_analysis',
        {
          userId,
          performanceData,
          timeRange,
          userProfile: contextRef.current.userProfile,
          cognitiveHistory: contextRef.current.learningHistory?.cognitiveHistory
        }
      )
      
      return analysis
    } catch (error) {
      console.error('AI performance analysis failed:', error)
      throw error
    }
  }, [userId])

  const optimizeLearningExperience = useCallback(async (sessionData) => {
    try {
      const optimization = await aiOrchestrator.executeIntelligentWorkflow(
        'learning_optimization',
        {
          sessionData,
          userProfile: contextRef.current.userProfile,
          cognitiveState: contextRef.current.cognitiveState,
          learningHistory: contextRef.current.learningHistory
        }
      )
      
      return optimization
    } catch (error) {
      console.error('Learning experience optimization failed:', error)
      throw error
    }
  }, [])

  const integrateWellnessWithLearning = useCallback(async (wellnessData) => {
    try {
      const integration = await aiOrchestrator.executeIntelligentWorkflow(
        'wellness_integration',
        {
          wellnessData,
          cognitiveState: contextRef.current.cognitiveState,
          userProfile: contextRef.current.userProfile,
          learningHistory: contextRef.current.learningHistory
        }
      )
      
      return integration
    } catch (error) {
      console.error('Wellness-learning integration failed:', error)
      throw error
    }
  }, [])

  const generateRealTimeInsights = useCallback(async (currentState) => {
    try {
      // First try the backend cognitive monitor if available
      let monitorResult = null
      try {
        const resp = await pythonAPI.post('/api/analytics/monitor/analyze', {
          user_id: currentState.userId || 'anonymous',
          signals: currentState.signals || currentState,
          metadata: { source: 'frontend' }
        })
        monitorResult = resp?.summary || resp?.data?.summary || null
      } catch (err) {
        // backend may be unavailable; fall back to local generation
        console.warn('Cognitive monitor API unavailable, falling back to local insights', err)
      }

      const remoteInsights = monitorResult ? [ { message: JSON.stringify(monitorResult), confidence: 0.9 } ] : []

      // Also call gemini fallback for richer content when needed
      const insights = await geminiService.generateWellnessInsights(
        { currentState },
        [currentState]
      )

      // Normalize to array to avoid TypeError and incorrect spread
      const raw = insights?.insights
      const list = Array.isArray(raw) ? raw : (raw ? [raw] : [])
      const merged = [...remoteInsights, ...list]
      setAiInsights(prev => [...prev.slice(-9), ...merged])
      
      return { ...insights, insights: merged }
    } catch (error) {
      console.error('Real-time insights generation failed:', error)
      return { insights: [] }
    }
  }, [])

  const updateContext = useCallback((newContext) => {
    contextRef.current = { ...contextRef.current, ...newContext }
  }, [])

  const updatePerformanceMetrics = useCallback((responseTime, success) => {
    const metrics = performanceMetrics.current
    
    metrics.totalRequests++
    if (success) metrics.successfulRequests++
    
    metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2
    
    setAiState(prev => ({
      ...prev,
      performance: {
        responseTime: metrics.averageResponseTime,
        accuracy: metrics.successfulRequests / metrics.totalRequests,
        userSatisfaction: prev.performance.userSatisfaction
      }
    }))
  }, [])

  const endTutoringSession = useCallback(async () => {
    if (!tutoringSession) return null
    
    try {
      const sessionSummary = await intelligentTutoringService.endTutoringSession(
        tutoringSession.sessionId
      )
      
      setTutoringSession(null)
      setAiState(prev => ({
        ...prev,
        activeFeatures: new Set([...prev.activeFeatures].filter(f => f !== 'tutoring'))
      }))
      
      return sessionSummary
    } catch (error) {
      console.error('Tutoring session end failed:', error)
      throw error
    }
  }, [tutoringSession])

  const getAIRecommendations = useCallback(async (context = {}) => {
    try {
      const mergedContext = { ...contextRef.current, ...context }
      
      const orchestrationResult = await aiOrchestrator.orchestrateIntelligentLearning(
        userId,
        mergedContext
      )
      
      setRecommendations(orchestrationResult.recommendations || [])
      
      return orchestrationResult.recommendations
    } catch (error) {
      console.error('AI recommendations failed:', error)
      return []
    }
  }, [userId])

  const enableAIFeature = useCallback((featureName) => {
    setAiState(prev => ({
      ...prev,
      activeFeatures: new Set([...prev.activeFeatures, featureName])
    }))
  }, [])

  const disableAIFeature = useCallback((featureName) => {
    setAiState(prev => ({
      ...prev,
      activeFeatures: new Set([...prev.activeFeatures].filter(f => f !== featureName))
    }))
  }, [])

  const isFeatureActive = useCallback((featureName) => {
    return aiState.activeFeatures.has(featureName)
  }, [aiState.activeFeatures])

  const getServiceStatus = useCallback((serviceName) => {
    return aiState.services[serviceName] || 'unknown'
  }, [aiState.services])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const retryInitialization = useCallback(async () => {
    setError(null)
    await initializeAIFeatures()
  }, [initializeAIFeatures])

  const exportAIData = useCallback(() => {
    const exportData = {
      aiState,
      tutoringSession: tutoringSession ? {
        sessionId: tutoringSession.sessionId,
        duration: Date.now() - tutoringSession.startTime,
        interactions: tutoringSession.conversationHistory?.length || 0
      } : null,
      aiInsights: aiInsights.slice(-10),
      predictions,
      recommendations: recommendations.slice(-5),
      learningPath,
      performance: performanceMetrics.current,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-features-data-${userId}.json`
    link.click()
  }, [aiState, tutoringSession, aiInsights, predictions, recommendations, learningPath, userId])

  const getAIStats = useCallback(() => {
    return {
      initialization: aiState.isInitialized,
      serviceHealth: aiState.services,
      activeFeatures: Array.from(aiState.activeFeatures),
      performance: aiState.performance,
      tutoringActive: !!tutoringSession,
      insightsGenerated: aiInsights.length,
      recommendationsActive: recommendations.length,
      hasLearningPath: !!learningPath,
      errorState: error
    }
  }, [aiState, tutoringSession, aiInsights, recommendations, learningPath, error])

  return {
    // State
    aiState,
    tutoringSession,
    aiInsights,
    predictions,
    recommendations,
    learningPath,
    error,
    
    // Actions
    startTutoringSession,
    sendTutoringMessage,
    endTutoringSession,
    generateIntelligentContent,
    generateLearningPath,
    generatePersonalizedQuiz,
    predictLearningOutcome,
    analyzePerformanceWithAI,
    optimizeLearningExperience,
    integrateWellnessWithLearning,
    generateRealTimeInsights,
    getAIRecommendations,
    
    // Utilities
    updateContext,
    enableAIFeature,
    disableAIFeature,
    isFeatureActive,
    getServiceStatus,
    clearError,
    retryInitialization,
    exportAIData,
    getAIStats
  }
}

export default useAIFeatures