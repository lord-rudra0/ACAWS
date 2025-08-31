import React, { useRef, useEffect, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, Eye, Brain, Heart, Zap, Pause, Play, Settings, AlertTriangle } from 'lucide-react'
import { mlAPI } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'
import useErrorHandler from '../hooks/useErrorHandler'

const CameraAnalysis = ({ onCognitiveStateUpdate, isActive = false, onError }) => {
  const webcamRef = useRef(null)
  const [analysisData, setAnalysisData] = useState({
    emotion: null,
    attention: null,
    fatigue: null,
    lastUpdate: null
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [analysisStats, setAnalysisStats] = useState({
    totalFrames: 0,
    successfulAnalyses: 0,
    averageProcessingTime: 0
  })
  const [cameraSettings, setCameraSettings] = useState({
    width: 640,
    height: 480,
    facingMode: 'user',
    frameRate: 30
  })
  const { error, handleAsync, clearError } = useErrorHandler()

  // Enhanced WebSocket with better error handling
  const { sendMessage, lastMessage, readyState, error: wsError, reconnect } = useWebSocket(
    `ws://localhost:5000/ws/${Date.now()}`,
    {
      onMessage: (data) => {
        try {
          if (data.type === 'analysis_result') {
            const cognitiveState = {
              attention: data.attention?.attention_score || 0,
              confusion: data.emotion?.emotion_probabilities?.confused || 0,
              engagement: data.attention?.engagement_score || 0,
              fatigue: data.fatigue?.fatigue_score || 0,
              mood: data.emotion?.primary_emotion || 'neutral',
              confidence: {
                emotion: data.emotion?.emotion_confidence || 0,
                attention: data.attention?.confidence || 0,
                fatigue: data.fatigue?.confidence || 0
              }
            }

            setAnalysisData({
              emotion: data.emotion,
              attention: data.attention,
              fatigue: data.fatigue,
              lastUpdate: new Date()
            })

            // Update stats
            setAnalysisStats(prev => ({
              totalFrames: prev.totalFrames + 1,
              successfulAnalyses: prev.successfulAnalyses + 1,
              averageProcessingTime: data.processing_time || prev.averageProcessingTime
            }))
            
            // Update parent component
            if (onCognitiveStateUpdate) {
              onCognitiveStateUpdate(cognitiveState)
            }
          } else if (data.type === 'error') {
            console.error('WebSocket analysis error:', data.message)
            setCameraError(data.message)
            if (onError) onError(data.message)
          }
        } catch (error) {
          console.error('Failed to process WebSocket message:', error)
        }
      },
      onError: (error) => {
        console.error('WebSocket error:', error)
        setCameraError('Real-time analysis connection failed')
        if (onError) onError('WebSocket connection failed')
      },
      onClose: (event) => {
        if (event.code !== 1000) {
          setCameraError('Connection lost. Attempting to reconnect...')
        }
      },
      maxReconnectAttempts: 5,
      reconnectInterval: 3000
    }
  )

  const captureAndAnalyze = useCallback(async () => {
    if (!webcamRef.current || !isActive || isAnalyzing) return

    try {
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) {
        console.warn('No image captured from webcam')
        return
      }

      setIsAnalyzing(true)
      const startTime = Date.now()

      // Send frame via WebSocket for real-time analysis
      if (readyState === WebSocket.OPEN) {
        const result = sendMessage({
          type: 'frame_data',
          frame: imageSrc,
          timestamp: new Date().toISOString(),
          settings: cameraSettings
        })

        if (!result.success) {
          throw new Error(result.error)
        }
      } else {
        // Fallback to REST API with enhanced error handling
        await handleAsync(async () => {
          const [emotionResult, attentionResult, fatigueResult] = await Promise.allSettled([
            mlAPI.analyzeEmotion(imageSrc),
            mlAPI.trackAttention(imageSrc),
            mlAPI.detectFatigue(imageSrc)
          ])

          const processingTime = Date.now() - startTime

          // Process results, handling partial failures
          const emotion = emotionResult.status === 'fulfilled' ? emotionResult.value.data : null
          const attention = attentionResult.status === 'fulfilled' ? attentionResult.value.data : null
          const fatigue = fatigueResult.status === 'fulfilled' ? fatigueResult.value.data : null

          setAnalysisData({
            emotion,
            attention,
            fatigue,
            lastUpdate: new Date()
          })

          // Update stats
          setAnalysisStats(prev => ({
            totalFrames: prev.totalFrames + 1,
            successfulAnalyses: prev.successfulAnalyses + (emotion || attention || fatigue ? 1 : 0),
            averageProcessingTime: (prev.averageProcessingTime + processingTime) / 2
          }))

          if (onCognitiveStateUpdate && (emotion || attention || fatigue)) {
            onCognitiveStateUpdate({
              attention: attention?.attention_score || 0,
              confusion: emotion?.emotion_probabilities?.confused || 0,
              engagement: attention?.engagement_score || 0,
              fatigue: fatigue?.fatigue_score || 0,
              mood: emotion?.primary_emotion || 'neutral'
            })
          }

          // Log any partial failures
          if (emotionResult.status === 'rejected') {
            console.warn('Emotion analysis failed:', emotionResult.reason)
          }
          if (attentionResult.status === 'rejected') {
            console.warn('Attention tracking failed:', attentionResult.reason)
          }
          if (fatigueResult.status === 'rejected') {
            console.warn('Fatigue detection failed:', fatigueResult.reason)
          }
        }, {
          errorMessage: 'Analysis failed. Please check camera permissions.',
          maxRetries: 2,
          retryDelay: 1000,
          shouldRetry: (error) => error.status !== 403 // Don't retry permission errors
        })
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      setCameraError('Analysis failed. Please check camera permissions.')
      if (onError) onError(error.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [isActive, readyState, sendMessage, handleAsync, onCognitiveStateUpdate, onError, cameraSettings, isAnalyzing])

  useEffect(() => {
    let interval
    if (isActive && !cameraError && !error) {
      interval = setInterval(captureAndAnalyze, 2000) // Analyze every 2 seconds
    }
    return () => clearInterval(interval)
  }, [isActive, cameraError, error, captureAndAnalyze])

  const handleCameraError = useCallback((error) => {
    console.error('Camera error:', error)
    let errorMessage = 'Camera access denied. Please enable camera permissions.'
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.'
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found. Please connect a camera and try again.'
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is being used by another application. Please close other apps and try again.'
    }
    
    setCameraError(errorMessage)
    if (onError) onError(errorMessage)
  }, [onError])

  const retryCamera = useCallback(() => {
    setCameraError(null)
    clearError()
    
    // Force webcam to reinitialize
    if (webcamRef.current) {
      webcamRef.current.video.srcObject = null
    }
  }, [clearError])

  const updateCameraSettings = useCallback((newSettings) => {
    setCameraSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const getAnalysisQuality = useCallback(() => {
    const { totalFrames, successfulAnalyses } = analysisStats
    if (totalFrames === 0) return 'unknown'
    
    const successRate = (successfulAnalyses / totalFrames) * 100
    
    if (successRate >= 90) return 'excellent'
    if (successRate >= 75) return 'good'
    if (successRate >= 50) return 'fair'
    return 'poor'
  }, [analysisStats])

  if (cameraError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Camera Access Required
          </h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">
          {cameraError}
        </p>
        <div className="flex space-x-3">
          <button
            onClick={retryCamera}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Camera Access</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Real-time Cognitive Analysis
          </h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isActive && readyState === WebSocket.OPEN ? 'bg-green-500 animate-pulse' : 
                readyState === WebSocket.CONNECTING ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isActive && readyState === WebSocket.OPEN ? 'Active' : 
                 readyState === WebSocket.CONNECTING ? 'Connecting' : 'Inactive'}
              </span>
            </div>
            <button
              onClick={() => updateCameraSettings({ facingMode: cameraSettings.facingMode === 'user' ? 'environment' : 'user' })}
              className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
              title="Switch camera"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Analysis Quality Indicator */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Analysis Quality:</span>
            <span className={`font-medium ${
              getAnalysisQuality() === 'excellent' ? 'text-green-500' :
              getAnalysisQuality() === 'good' ? 'text-blue-500' :
              getAnalysisQuality() === 'fair' ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {getAnalysisQuality().toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Frames: {analysisStats.totalFrames}</span>
            <span>Success: {analysisStats.successfulAnalyses}</span>
            <span>Avg: {Math.round(analysisStats.averageProcessingTime)}ms</span>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-6">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: cameraSettings.width,
              height: cameraSettings.height,
              facingMode: cameraSettings.facingMode,
              frameRate: cameraSettings.frameRate
            }}
            className="w-full h-64 object-cover"
            onUserMediaError={handleCameraError}
          />
          
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
            {isActive ? 'Live Analysis' : 'Analysis Paused'}
          </div>

          {/* Face Detection Overlay */}
          {analysisData.emotion?.face_coordinates && (
            <div 
              className="absolute border-2 border-green-400 rounded"
              style={{
                left: `${(analysisData.emotion.face_coordinates.x / cameraSettings.width) * 100}%`,
                top: `${(analysisData.emotion.face_coordinates.y / cameraSettings.height) * 100}%`,
                width: `${(analysisData.emotion.face_coordinates.width / cameraSettings.width) * 100}%`,
                height: `${(analysisData.emotion.face_coordinates.height / cameraSettings.height) * 100}%`
              }}
            >
              <div className="absolute -top-6 left-0 bg-green-400 text-white px-2 py-1 rounded text-xs">
                Face Detected
              </div>
            </div>
          )}

          {/* Last Update Indicator */}
          {analysisData.lastUpdate && (
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
              Updated: {analysisData.lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Enhanced Analysis Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {[
            {
              label: 'Attention',
              value: analysisData.attention?.attention_score || 0,
              confidence: analysisData.attention?.confidence || 0,
              icon: Eye,
              color: 'primary',
              details: analysisData.attention ? {
                'Gaze Direction': analysisData.attention.gaze_direction,
                'Blink Rate': `${analysisData.attention.blink_rate}/min`,
                'Focus Level': analysisData.attention.focus_level
              } : {}
            },
            {
              label: 'Emotion',
              value: analysisData.emotion?.primary_emotion || 'neutral',
              confidence: analysisData.emotion?.emotion_confidence || 0,
              icon: Heart,
              color: 'secondary',
              isText: true,
              details: analysisData.emotion?.emotion_probabilities || {}
            },
            {
              label: 'Engagement',
              value: analysisData.attention?.engagement_score || 0,
              confidence: analysisData.attention?.engagement_confidence || 0,
              icon: Zap,
              color: 'success',
              details: analysisData.attention ? {
                'Head Pose': `${Math.round(analysisData.attention.head_pose?.yaw || 0)}°`,
                'Eye Contact': analysisData.attention.facing_camera ? 'Yes' : 'No'
              } : {}
            },
            {
              label: 'Fatigue',
              value: analysisData.fatigue?.fatigue_score || 0,
              confidence: analysisData.fatigue?.confidence || 0,
              icon: Brain,
              color: 'warning',
              details: analysisData.fatigue?.indicators || {}
            }
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="text-center group relative">
                <div className={`w-12 h-12 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-500`} />
                </div>
                <div className={`text-xl font-bold text-${metric.color}-500 mb-1`}>
                  {metric.isText ? metric.value : `${Math.round(metric.value)}%`}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </div>
                {metric.confidence > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(metric.confidence * 100)}% confident
                  </div>
                )}
                
                {/* Tooltip with details */}
                {Object.keys(metric.details).length > 0 && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg p-2 whitespace-nowrap z-10">
                    {Object.entries(metric.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between space-x-2">
                        <span>{key}:</span>
                        <span className="font-medium">{typeof value === 'number' ? Math.round(value * 100) / 100 : value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Connection Status */}
        {wsError && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Real-time connection issue: {wsError.message}
              </p>
              <button
                onClick={reconnect}
                className="text-yellow-600 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* General Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-red-700 dark:text-red-300 text-sm font-medium mb-1">
                  {error.message}
                </p>
                {error.retryCount > 0 && (
                  <p className="text-red-600 dark:text-red-400 text-xs">
                    Failed after {error.retryCount} attempts
                  </p>
                )}
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Advanced Controls */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Quality: {getAnalysisQuality()}</span>
            <span>FPS: {cameraSettings.frameRate}</span>
            <span>Resolution: {cameraSettings.width}x{cameraSettings.height}</span>
          </div>
          <div className="flex items-center space-x-2">
            {readyState === WebSocket.OPEN && (
              <div className="flex items-center space-x-1 text-green-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CameraAnalysis