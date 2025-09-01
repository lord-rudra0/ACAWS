import React, { useState, useRef, useEffect, useCallback } from 'react'
// import Webcam from 'react-webcam' // Removed for performance
import { Camera, Eye, Brain, Heart, Zap, Settings, AlertTriangle, Target, Activity } from 'lucide-react'
import advancedMLService from '../services/advancedMLService'
import geminiService from '../services/geminiService'
import useWebSocket from '../hooks/useWebSocket'
import useErrorHandler from '../hooks/useErrorHandler'

const CameraAnalysis = ({ 
  onCognitiveStateUpdate, 
  isActive = false, 
  onError,
  onAdvancedInsights,
  userProfile = {}
}) => {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const [analysisData, setAnalysisData] = useState({
    emotion: null,
    attention: null,
    fatigue: null,
    advanced: null,
    lastUpdate: null
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [analysisMode, setAnalysisMode] = useState('comprehensive')
  const [visualizations, setVisualizations] = useState({
    showFaceDetection: true,
    showGazeTracking: true,
    showEmotionOverlay: true,
    showAttentionHeatmap: false
  })
  const [advancedMetrics, setAdvancedMetrics] = useState({
    microExpressions: [],
    gazePatterns: [],
    cognitiveLoad: 0,
    emotionalStability: 0,
    attentionConsistency: 0
  })
  const [realTimeInsights, setRealTimeInsights] = useState([])
  const { error, handleAsync, clearError } = useErrorHandler()

  const analysisModes = [
    { id: 'basic', label: 'Basic', description: 'Standard emotion and attention tracking' },
    { id: 'comprehensive', label: 'Comprehensive', description: 'Full cognitive analysis with ML' },
    { id: 'research', label: 'Research', description: 'Advanced metrics for detailed insights' }
  ]

  useEffect(() => {
    if (isActive) {
      initializeAdvancedAnalysis()
    }
  }, [isActive, analysisMode])

  const initializeAdvancedAnalysis = async () => {
    try {
      await advancedMLService.initialize()
      console.log('✅ Advanced ML service initialized')
    } catch (error) {
      console.error('❌ Advanced ML initialization failed:', error)
      setCameraError('Advanced analysis features unavailable')
    }
  }

  const captureAndAnalyzeAdvanced = useCallback(async () => {
    if (!isActive || isAnalyzing) return

    try {
      // Mock image capture for development (no webcam)
      const mockImageSrc = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TW9jayBDYW1lcmEgSW1hZ2U8L3RleHQ+PC9zdmc+'
      
      setIsAnalyzing(true)
      const startTime = Date.now()

      // Comprehensive analysis using advanced ML
      const [emotionResult, attentionResult, fatigueResult] = await Promise.allSettled([
        advancedMLService.analyzeEmotionAdvanced(mockImageSrc),
        advancedMLService.analyzeAttentionAdvanced(mockImageSrc, { userProfile, analysisMode }),
        advancedMLService.detectFatigueAdvanced(mockImageSrc)
      ])

      const processingTime = Date.now() - startTime

      // Process results
      const emotion = emotionResult.status === 'fulfilled' ? emotionResult.value : null
      const attention = attentionResult.status === 'fulfilled' ? attentionResult.value : null
      const fatigue = fatigueResult.status === 'fulfilled' ? fatigueResult.value : null

      // Debug logs to verify backend attention flow
      try {
        console.debug('[Enhanced] attention result:', attention)
        console.debug('[Enhanced] py attention score/conf:', attention?.attentionScore, attention?.gazeAnalysis?.confidence)
      } catch {}

      // Advanced cognitive state calculation
      const advancedCognitiveState = await advancedMLService.analyzeCognitiveState(emotion, attention, fatigue)

      // Update histories for trend/fatigue
      if (typeof attention?.attentionScore === 'number') {
        // Update attention history
        setAdvancedMetrics(prev => ({
          ...prev,
          attentionConsistency: attention.attentionScore
        }))
      }

      // Update analysis data
      setAnalysisData({
        emotion,
        attention,
        fatigue,
        advanced: advancedCognitiveState,
        lastUpdate: new Date()
      })

      // Call parent callback
      if (onCognitiveStateUpdate) {
        onCognitiveStateUpdate({
          attention: attention?.attentionScore || 0,
          engagement: attention?.gazeAnalysis?.confidence || 0,
          fatigue: fatigue?.fatigueLevel || 0,
          mood: emotion?.emotion || 'neutral',
          cognitiveLoad: advancedCognitiveState?.cognitiveLoad || 0
        })
      }

      // Generate insights if available
      if (onAdvancedInsights && advancedCognitiveState) {
        try {
          const insights = await geminiService.generateWellnessInsights({
            emotion: emotion?.emotion,
            attention: attention?.attentionScore,
            fatigue: fatigue?.fatigueLevel,
            cognitiveLoad: advancedCognitiveState.cognitiveLoad
          })
          onAdvancedInsights(insights)
        } catch (error) {
          console.warn('Failed to generate insights:', error)
        }
      }

      console.log(`✅ Analysis completed in ${processingTime}ms`)
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      setCameraError('Analysis failed. Please try again.')
      if (onError) onError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isActive, isAnalyzing, userProfile, analysisMode, onCognitiveStateUpdate, onAdvancedInsights, onError])

  // Mock fatigue analysis function
  const analyzeFatigueAdvanced = async (imageSrc) => {
    // This would normally call the ML service
    return {
      fatigueLevel: Math.random() * 0.8,
      eyeOpenness: 0.3 + Math.random() * 0.7,
      blinkRate: 15 + Math.random() * 10,
      confidence: 0.6 + Math.random() * 0.4
    }
  }

  // Calculate advanced cognitive state
  const calculateAdvancedCognitiveState = async (emotion, attention, fatigue) => {
    try {
      return await advancedMLService.analyzeCognitiveState(emotion, attention, fatigue)
    } catch (error) {
      console.warn('Failed to calculate cognitive state:', error)
      return {
        cognitiveLoad: 0.5,
        emotionalStability: 0.6,
        focusLevel: 0.7,
        overallState: 'fair'
      }
    }
  }

  // Handle camera errors
  const handleCameraError = useCallback((error) => {
    console.error('Camera error:', error)
    setCameraError('Camera access denied. Please enable camera permissions.')
    if (onError) onError('Camera access denied')
  }, [onError])

  // Toggle analysis mode
  const toggleAnalysisMode = useCallback(() => {
    const modes = ['basic', 'comprehensive', 'research']
    const currentIndex = modes.indexOf(analysisMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setAnalysisMode(modes[nextIndex])
  }, [analysisMode])

  // Toggle visualizations
  const toggleVisualization = useCallback((key) => {
    setVisualizations(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }, [])

  // Start continuous analysis
  useEffect(() => {
    let interval
    if (isActive && !cameraError) {
      interval = setInterval(captureAndAnalyzeAdvanced, 3000) // Analyze every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, cameraError, captureAndAnalyzeAdvanced])

  if (cameraError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Camera Analysis Error
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {cameraError}
        </p>
        <button
          onClick={() => setCameraError(null)}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cognitive Analysis
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <button
              onClick={toggleAnalysisMode}
              className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
              title="Toggle analysis mode"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Analysis Mode Display */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Mode:</span>
            <span className="font-medium text-gray-900 dark:text-white capitalize">
              {analysisMode}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {analysisModes.find(m => m.id === analysisMode)?.description}
          </p>
        </div>

        {/* Camera Feed Placeholder */}
        <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-6">
          <div className="w-full h-64 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              Camera feed placeholder
            </p>
          </div>
          
          {/* Analysis Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Analyzing cognitive state...</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Overlay */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
            <Camera className="w-4 h-4 inline mr-1" />
            {isActive ? 'Analysis Active' : 'Analysis Paused'}
          </div>
        </div>

        {/* Analysis Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            {
              label: 'Attention',
              value: analysisData.attention?.attentionScore || 0,
              confidence: analysisData.attention?.gazeAnalysis?.confidence || 0,
              icon: Eye,
              color: 'primary'
            },
            {
              label: 'Emotion',
              value: analysisData.emotion?.emotion || 'neutral',
              confidence: analysisData.emotion?.confidence || 0,
              icon: Heart,
              color: 'secondary',
              isText: true
            },
            {
              label: 'Fatigue',
              value: analysisData.fatigue?.fatigueLevel || 0,
              confidence: analysisData.fatigue?.confidence || 0,
              icon: Brain,
              color: 'warning'
            },
            {
              label: 'Cognitive Load',
              value: analysisData.advanced?.cognitiveLoad || 0,
              confidence: 0.8,
              icon: Zap,
              color: 'success'
            }
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="text-center">
                <div className={`w-12 h-12 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-500`} />
                </div>
                <div className={`text-xl font-bold text-${metric.color}-500 mb-1`}>
                  {metric.isText ? metric.value : `${Math.round(metric.value * 100)}%`}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </div>
                {metric.confidence > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(metric.confidence * 100)}% confident
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Visualization Controls */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Visualizations</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(visualizations).map(([key, value]) => (
              <button
                key={key}
                onClick={() => toggleVisualization(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  value
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Last Update */}
        {analysisData.lastUpdate && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Last updated: {analysisData.lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}

export default CameraAnalysis