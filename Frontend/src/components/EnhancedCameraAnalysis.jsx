import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// import Webcam from 'react-webcam' // Removed for performance
import { Camera, Eye, Brain, Heart, Zap, Settings, AlertTriangle, Target, Activity } from 'lucide-react'
import advancedMLService from '../services/advancedMLService'
import geminiService from '../services/geminiService'
import useWebSocket from '../hooks/useWebSocket'
import useErrorHandler from '../hooks/useErrorHandler'

const EnhancedCameraAnalysis = ({ 
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
        analyzeFatigueAdvanced(mockImageSrc)
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
      const advancedCognitiveState = calculateAdvancedCognitiveState(emotion, attention, fatigue)

      // Update histories for trend/fatigue
      if (typeof attention?.attentionScore === 'number') {
        attentionHistoryRef.current.push(attention.attentionScore)
        if (attentionHistoryRef.current.length > MAX_HISTORY) attentionHistoryRef.current.shift()
        // sync module-level history for getTrendDirection helper
        attentionScoreHistory = attentionHistoryRef.current.slice()
      }
      const ear = attention?.eyeMetrics?.averageEAR ?? (
        typeof attention?.eyeMetrics?.leftEAR === 'number' && typeof attention?.eyeMetrics?.rightEAR === 'number'
          ? (attention.eyeMetrics.leftEAR + attention.eyeMetrics.rightEAR) / 2
          : null
      )
      const mar = attention?.eyeMetrics?.mouthAspectRatio ?? null
      eyeMetricsHistoryRef.current.push({ t: Date.now(), ear, mar })
      // cap history to 60s window
      const cutoff = Date.now() - 60000
      eyeMetricsHistoryRef.current = eyeMetricsHistoryRef.current.filter(e => e.t >= cutoff)

      setAnalysisData({
        emotion,
        attention,
        fatigue,
        advanced: advancedCognitiveState,
        lastUpdate: new Date(),
        processingTime
      })

      // Update advanced metrics
      updateAdvancedMetrics(emotion, attention, fatigue)

      // Generate real-time insights
      if (analysisMode === 'comprehensive' || analysisMode === 'research') {
        await generateRealTimeInsights(advancedCognitiveState)
      }

      // Draw visualizations
      if (visualizations.showFaceDetection || visualizations.showGazeTracking) {
        drawAnalysisOverlay(emotion, attention)
      }

      // Update parent component
      if (onCognitiveStateUpdate) {
        onCognitiveStateUpdate(advancedCognitiveState)
      }

      // Send advanced insights to parent
      if (onAdvancedInsights && advancedCognitiveState.insights) {
        onAdvancedInsights(advancedCognitiveState.insights)
      }

    } catch (error) {
      console.error('Advanced analysis failed:', error)
      setCameraError('Advanced analysis failed')
      if (onError) onError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isActive, analysisMode, visualizations, onCognitiveStateUpdate, onAdvancedInsights, onError, isAnalyzing, userProfile])

  // In-memory histories for trend/fatigue (module-level alternatives defined below)
  const MAX_HISTORY = 10
  const attentionHistoryRef = useRef([])
  const eyeMetricsHistoryRef = useRef([])

  const analyzeFatigueAdvanced = async () => {
    // Compute fatigue from recent eye metrics history (EAR/MAR)
    const now = Date.now()
    const windowMs = 60000 // 60s window
    const recent = eyeMetricsHistoryRef.current.filter(e => now - e.t <= windowMs && e.ear != null)
    if (recent.length < 3) {
      return {
        fatigueScore: null,
        indicators: {
          eyeClosureDuration: null,
          blinkFrequency: null,
          microSleep: false,
          yawnDetected: null
        },
        recommendations: [],
        confidence: 0.0
      }
    }

    // Detect blinks and closures using EAR threshold
    const EAR_THRESH = 0.21
    let blinks = 0
    let lowStart = null
    const lowDurations = []
    for (let i = 0; i < recent.length; i++) {
      const currLow = recent[i].ear < EAR_THRESH
      const prevLow = i > 0 ? recent[i - 1].ear < EAR_THRESH : false
      if (currLow && !prevLow) {
        lowStart = recent[i].t
      } else if (!currLow && prevLow && lowStart != null) {
        const dur = recent[i].t - lowStart
        lowDurations.push(dur)
        // Blink if duration within blink bounds
        if (dur >= 80 && dur <= 800) blinks += 1
        lowStart = null
      }
    }
    // If still low at end, close the span
    if (lowStart != null) {
      const dur = recent[recent.length - 1].t - lowStart
      lowDurations.push(dur)
    }

    const windowSec = Math.max(1, windowMs / 1000)
    const blinkPerMin = blinks * (60 / windowSec)
    const avgClosureMs = lowDurations.length ? lowDurations.reduce((a, b) => a + b, 0) / lowDurations.length : 0
    const microSleep = lowDurations.some(d => d > 1500)

    // Yawn detection via MAR if available: sustained high MAR in last 5s
    const recent5s = eyeMetricsHistoryRef.current.filter(e => now - e.t <= 5000 && e.mar != null)
    const yawnDetected = recent5s.length ? recent5s.some(e => e.mar > 0.7) : null

    // Heuristic fatigue score 0-100
    let fatigue = 0
    if (blinkPerMin > 25) fatigue += 30
    if (blinkPerMin > 35) fatigue += 20
    if (avgClosureMs > 300) fatigue += 20
    if (avgClosureMs > 600) fatigue += 20
    if (microSleep) fatigue += 20
    fatigue = Math.max(0, Math.min(100, fatigue))

    return {
      fatigueScore: fatigue,
      indicators: {
        eyeClosureDuration: avgClosureMs / 1000, // seconds
        blinkFrequency: Math.round(blinkPerMin),
        microSleep,
        yawnDetected
      },
      recommendations: fatigue > 60 ? ['Take a short break', 'Hydrate', 'Do light stretching'] : [],
      confidence: recent.length >= 10 ? 0.8 : 0.6
    }
  }

  const calculateAdvancedCognitiveState = (emotion, attention, fatigue) => {
    const state = {
      attention: attention?.attentionScore ?? null,
      engagement: attention?.engagementLevel != null ? attention.engagementLevel * 100 : null,
      confusion: emotion?.emotions?.confused != null ? emotion.emotions.confused * 100 : 0,
      fatigue: fatigue?.fatigueScore ?? 0,
      mood: emotion?.emotions ? Object.keys(emotion.emotions).reduce((a, b) => 
        emotion.emotions[a] > emotion.emotions[b] ? a : b
      ) : 'neutral',
      confidence: {
        emotion: emotion?.confidence || 0,
        attention: attention?.gazeAnalysis?.confidence || 0,
        fatigue: fatigue?.confidence || 0
      }
    }

    // Advanced calculations
    state.cognitiveLoad = attention?.cognitiveLoad?.level != null ? attention.cognitiveLoad.level * 100 : null
    state.emotionalStability = emotion?.advancedMetrics?.emotionalStability != null ? emotion.advancedMetrics.emotionalStability * 100 : 0
    state.focusQuality = calculateFocusQuality(attention)
    state.learningReadiness = calculateLearningReadiness(state)
    
    // Generate insights
    state.insights = generateCognitiveInsights(state)
    
    return state
  }

  const calculateFocusQuality = (attention) => {
    if (!attention) return 50
    
    const factors = [
      attention.gazeAnalysis?.fixationStability || 0.5,
      attention.focusMap?.focusStability || 0.5,
      1 - (attention.distractionIndicators?.length || 0) * 0.2
    ]
    
    return Math.max(0, Math.min(100, factors.reduce((a, b) => a + b, 0) / factors.length * 100))
  }

  const calculateLearningReadiness = (state) => {
    const weights = {
      attention: 0.3,
      engagement: 0.25,
      fatigue: -0.2,
      confusion: -0.15,
      emotionalStability: 0.1
    }
    
    let readiness = 50 // Base readiness
    
    Object.entries(weights).forEach(([metric, weight]) => {
      const value = state[metric] || 0
      readiness += value * weight
    })
    
    return Math.max(0, Math.min(100, readiness))
  }

  const generateCognitiveInsights = (state) => {
    const insights = []
    
    if (state.attention > 80 && state.confusion < 20) {
      insights.push({
        type: 'optimal_state',
        message: 'Optimal learning state detected - perfect time for challenging content',
        confidence: 0.9,
        actionable: true
      })
    }
    
    if (state.fatigue > 70) {
      insights.push({
        type: 'fatigue_warning',
        message: 'High fatigue detected - break recommended within 5 minutes',
        confidence: 0.85,
        actionable: true,
        urgent: true
      })
    }
    
    if (state.confusion > 60 && state.attention > 60) {
      insights.push({
        type: 'confusion_focus',
        message: 'High confusion despite good attention - content may be too difficult',
        confidence: 0.8,
        actionable: true
      })
    }
    
    if (state.emotionalStability < 40) {
      insights.push({
        type: 'emotional_instability',
        message: 'Emotional state fluctuating - consider wellness check-in',
        confidence: 0.7,
        actionable: true
      })
    }
    
    return insights
  }

  const updateAdvancedMetrics = (emotion, attention, fatigue) => {
    setAdvancedMetrics(prev => ({
      microExpressions: [
        ...prev.microExpressions.slice(-9),
        emotion?.microExpressions || { detected: false }
      ],
      gazePatterns: [
        ...prev.gazePatterns.slice(-19),
        attention?.gazeAnalysis || { direction: 'center' }
      ],
      cognitiveLoad: (attention?.cognitiveLoad?.level != null)
        ? attention.cognitiveLoad.level * 100
        : prev.cognitiveLoad,
      emotionalStability: (emotion?.advancedMetrics?.emotionalStability != null)
        ? emotion.advancedMetrics.emotionalStability * 100
        : prev.emotionalStability,
      attentionConsistency: calculateAttentionConsistency(prev.gazePatterns)
    }))
  }

  const calculateAttentionConsistency = (gazePatterns) => {
    if (gazePatterns.length < 5) return 50
    
    const centerGazes = gazePatterns.filter(gp => gp.direction === 'center').length
    return (centerGazes / gazePatterns.length) * 100
  }

  const generateRealTimeInsights = async (cognitiveState) => {
    try {
      const insights = await geminiService.generateWellnessInsights(
        { currentState: cognitiveState },
        [cognitiveState]
      )
      
      setRealTimeInsights(prev => [
        ...prev.slice(-4),
        {
          id: Date.now(),
          insight: insights.insights || 'Cognitive state analysis complete',
          timestamp: new Date(),
          confidence: 0.8
        }
      ])
    } catch (error) {
      console.error('Real-time insights generation failed:', error)
    }
  }

  const drawAnalysisOverlay = (emotion, attention) => {
    if (!canvasRef.current || !webcamRef.current) return

    const canvas = canvasRef.current
    const video = webcamRef.current.video
    
    if (!video) return

    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw face detection box
    if (visualizations.showFaceDetection && emotion?.facialLandmarks) {
      ctx.strokeStyle = '#10B981'
      ctx.lineWidth = 2
      ctx.strokeRect(50, 50, 200, 200) // Mock face box
      
      ctx.fillStyle = '#10B981'
      ctx.font = '12px Arial'
      ctx.fillText('Face Detected', 55, 45)
    }

    // Draw gaze tracking
    if (visualizations.showGazeTracking && attention?.gazeAnalysis) {
      const gazeX = canvas.width * 0.5 + (attention.gazeAnalysis.coordinates?.x || 0) * 10
      const gazeY = canvas.height * 0.5 + (attention.gazeAnalysis.coordinates?.y || 0) * 10
      
      ctx.fillStyle = '#3B82F6'
      ctx.beginPath()
      ctx.arc(gazeX, gazeY, 8, 0, 2 * Math.PI)
      ctx.fill()
      
      ctx.fillStyle = '#3B82F6'
      ctx.font = '10px Arial'
      ctx.fillText('Gaze Point', gazeX + 10, gazeY - 10)
    }

    // Draw emotion overlay
    if (visualizations.showEmotionOverlay && emotion?.emotions) {
      const topEmotion = Object.keys(emotion.emotions).reduce((a, b) => 
        emotion.emotions[a] > emotion.emotions[b] ? a : b
      )
      
      ctx.fillStyle = '#8B5CF6'
      ctx.font = '14px Arial'
      ctx.fillText(`${topEmotion}: ${Math.round(emotion.emotions[topEmotion] * 100)}%`, 10, 30)
    }
  }

  const toggleVisualization = (type) => {
    setVisualizations(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  useEffect(() => {
    let interval
    if (isActive && !cameraError && !error) {
      interval = setInterval(captureAndAnalyzeAdvanced, 3000) // Analyze every 3 seconds for advanced processing
    }
    return () => clearInterval(interval)
  }, [isActive, cameraError, error, captureAndAnalyzeAdvanced])

  const handleCameraError = useCallback((error) => {
    console.error('Camera error:', error)
    let errorMessage = 'Camera access denied. Please enable camera permissions.'
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.'
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and try again.'
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is being used by another application.'
    }
    
    setCameraError(errorMessage)
    if (onError) onError(errorMessage)
  }, [onError])

  const retryCamera = useCallback(() => {
    setCameraError(null)
    clearError()
  }, [clearError])

  if (cameraError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Enhanced Camera Analysis Unavailable
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{cameraError}</p>
        <button onClick={retryCamera} className="btn-primary">
          Retry Camera Access
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enhanced Cognitive Analysis
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered real-time cognitive monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={analysisMode}
              onChange={(e) => setAnalysisMode(e.target.value)}
              className="text-sm input-field"
            >
              {analysisModes.map(mode => (
                <option key={mode.id} value={mode.id}>{mode.label}</option>
              ))}
            </select>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isActive && !error ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isActive && !error ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Camera Feed with Overlay */}
        <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-6">
          {/* <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-64 object-cover"
            onUserMediaError={handleCameraError}
          /> */}
          <div className="w-full h-64 bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <Camera className="w-12 h-12 text-gray-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-2">
              Camera feed placeholder
            </p>
          </div>
          
          {/* Analysis Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'multiply' }}
          />
          
          {/* Status Overlays */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
            <Camera className="w-4 h-4 inline mr-1" />
            Enhanced Analysis {analysisMode}
          </div>
          
          {isAnalyzing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Advanced AI Analysis...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Real-time Insights Overlay */}
          {realTimeInsights.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/70 text-white p-3 rounded-lg backdrop-blur-sm">
                <div className="text-xs font-medium mb-1">💡 Real-time Insight</div>
                <div className="text-sm">
                  {realTimeInsights[realTimeInsights.length - 1]?.insight}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Attention',
              value: analysisData.attention?.attentionScore ?? null,
              icon: Eye,
              color: 'blue',
              advanced: analysisData.attention?.focusMap?.focusStability ?? null,
              unit: '%'
            },
            {
              label: 'Cognitive Load',
              value: advancedMetrics.cognitiveLoad ?? null,
              icon: Brain,
              color: 'purple',
              advanced: analysisData.attention?.cognitiveLoad?.level != null ? analysisData.attention.cognitiveLoad.level * 100 : null,
              unit: '%'
            },
            {
              label: 'Engagement',
              value: analysisData.attention?.engagementLevel != null ? analysisData.attention.engagementLevel * 100 : null,
              icon: Zap,
              color: 'green',
              advanced: calculateEngagementQuality(analysisData.attention),
              unit: '%'
            },
            {
              label: 'Emotional State',
              value: advancedMetrics.emotionalStability ?? null,
              icon: Heart,
              color: 'red',
              advanced: analysisData.emotion?.emotionIntensity?.overall != null ? analysisData.emotion.emotionIntensity.overall * 100 : null,
              unit: '%'
            }
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="text-center group relative">
                <div className={`w-12 h-12 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-500`} />
                </div>
                <div className={`text-xl font-bold text-${metric.color}-500 mb-1`}>
                  {fmt(metric.value, metric.unit)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Quality: {fmt(metric.advanced, metric.unit)}
                </div>
                
                {/* Advanced Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap z-10">
                  <div>Current: {fmt(metric.value, metric.unit)}</div>
                  <div>Quality: {fmt(metric.advanced, metric.unit)}</div>
                  <div>Trend: {getTrendDirection(metric.label)}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Advanced Visualizations */}
        {analysisMode === 'research' && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
              Advanced Metrics
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Micro-expressions Timeline */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Micro-expressions
                </h5>
                <div className="space-y-2">
                  {advancedMetrics.microExpressions.slice(-3).map((expr, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {expr.type || 'None detected'}
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {expr.intensity ? `${Math.round(expr.intensity * 100)}%` : '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Gaze Pattern Analysis */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                  Gaze Patterns
                </h5>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500 mb-1">
                    {Math.round(advancedMetrics.attentionConsistency)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Attention Consistency
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visualization Controls */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
            Visualization Options
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'showFaceDetection', label: 'Face Detection', icon: Target },
              { key: 'showGazeTracking', label: 'Gaze Tracking', icon: Eye },
              { key: 'showEmotionOverlay', label: 'Emotion Overlay', icon: Heart },
              { key: 'showAttentionHeatmap', label: 'Attention Heatmap', icon: Activity }
            ].map((viz) => {
              const Icon = viz.icon
              return (
                <button
                  key={viz.key}
                  onClick={() => toggleVisualization(viz.key)}
                  className={`flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors ${
                    visualizations[viz.key]
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{viz.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Real-time Insights */}
        {realTimeInsights.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
              AI Insights
            </h4>
            <div className="space-y-2">
              {realTimeInsights.slice(-2).map((insight) => (
                <div key={insight.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <Brain className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {insight.insight}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {insight.timestamp.toLocaleTimeString()} • {Math.round(insight.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {analysisData.processingTime || 0}ms
            </div>
            <div className="text-gray-600 dark:text-gray-400">Processing Time</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {Math.round((analysisData.emotion?.confidence || 0) * 100)}%
            </div>
            <div className="text-gray-600 dark:text-gray-400">AI Confidence</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {analysisData.advanced?.insights?.length || 0}
            </div>
            <div className="text-gray-600 dark:text-gray-400">Active Insights</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function
const calculateEngagementQuality = (attention) => {
  if (!attention) return null
  const score = typeof attention.attentionScore === 'number' ? attention.attentionScore : null
  const conf = typeof attention?.gazeAnalysis?.confidence === 'number' ? attention.gazeAnalysis.confidence * 100 : null
  const stability = typeof attention?.focusMap?.focusStability === 'number' ? attention.focusMap.focusStability : null
  const parts = [
    score != null ? { v: score, w: 0.6 } : null,
    conf != null ? { v: conf, w: 0.2 } : null,
    stability != null ? { v: stability, w: 0.2 } : null
  ].filter(Boolean)
  if (!parts.length) return null
  const weighted = parts.reduce((acc, p) => acc + p.v * p.w, 0)
  const totalW = parts.reduce((acc, p) => acc + p.w, 0)
  return Math.max(0, Math.min(100, weighted / totalW))
}

// Attention trend from moving averages of last 10 scores
const getTrendDirection = () => {
  const hist = attentionScoreHistory
  if (!hist || hist.length < 6) return '→ Stable'
  const last3 = hist.slice(-3)
  const prev3 = hist.slice(-6, -3)
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
  const a1 = avg(prev3)
  const a2 = avg(last3)
  const diff = a2 - a1
  const threshold = 2 // percentage points
  if (diff > threshold) return '↗️ Rising'
  if (diff < -threshold) return '↘️ Falling'
  return '→ Stable'
}

// Display formatter: show '—' when null/undefined, else rounded with unit
const fmt = (value, unit = '') => {
  const isNil = value === null || value === undefined || Number.isNaN(value)
  return isNil ? '—' : `${Math.round(value)}${unit}`
}

// Module-level histories to support helper computations
let attentionScoreHistory = []


export default EnhancedCameraAnalysis