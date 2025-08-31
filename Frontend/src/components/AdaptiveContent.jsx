import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Play, 
  Pause,
  RotateCcw,
  Settings,
  TrendingUp,
  Eye,
  Timer
} from 'lucide-react'
import { mlAPI } from '../services/api'
import useErrorHandler from '../hooks/useErrorHandler'

const AdaptiveContent = ({ 
  moduleData, 
  cognitiveState = {}, 
  onProgressUpdate, 
  onAdaptationChange,
  userId 
}) => {
  const [currentContent, setCurrentContent] = useState(moduleData)
  const [adaptationHistory, setAdaptationHistory] = useState([])
  const [isAdapting, setIsAdapting] = useState(false)
  const [adaptationSettings, setAdaptationSettings] = useState({
    sensitivity: 0.7,
    autoAdapt: true,
    adaptationTypes: ['difficulty', 'explanation', 'interactivity', 'pacing']
  })
  const [contentMetrics, setContentMetrics] = useState({
    timeSpent: 0,
    interactionCount: 0,
    adaptationCount: 0,
    effectivenessScore: 0
  })
  const { error, handleAsync, clearError } = useErrorHandler()

  useEffect(() => {
    if (adaptationSettings.autoAdapt && cognitiveState && Object.keys(cognitiveState).length > 0) {
      adaptContent()
    }
  }, [cognitiveState, adaptationSettings.autoAdapt])

  useEffect(() => {
    // Track time spent
    const interval = setInterval(() => {
      setContentMetrics(prev => ({
        ...prev,
        timeSpent: prev.timeSpent + 1
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const adaptContent = async () => {
    if (isAdapting) return

    setIsAdapting(true)

    await handleAsync(async () => {
      const adaptationResult = await mlAPI.adaptContent(userId, cognitiveState, currentContent)
      
      if (adaptationResult.success) {
        const newContent = adaptationResult.data.adapted_content
        const adaptations = adaptationResult.data.adaptations_applied
        
        setCurrentContent(newContent)
        
        // Record adaptation
        const adaptationRecord = {
          id: Date.now(),
          timestamp: new Date(),
          cognitiveState: { ...cognitiveState },
          adaptations,
          confidence: adaptationResult.data.confidence || 0.8,
          previousContent: { ...currentContent }
        }
        
        setAdaptationHistory(prev => [...prev.slice(-9), adaptationRecord])
        
        // Update metrics
        setContentMetrics(prev => ({
          ...prev,
          adaptationCount: prev.adaptationCount + 1,
          effectivenessScore: calculateEffectivenessScore(adaptations, cognitiveState)
        }))

        if (onAdaptationChange) {
          onAdaptationChange(adaptations, newContent)
        }

        // Show adaptation notification
        if (window.toast) {
          window.toast.info(
            `Content adapted: ${adaptations.difficulty_adjustment || 'optimized'} difficulty`,
            { duration: 3000 }
          )
        }
      }
    }, {
      errorMessage: 'Failed to adapt content',
      onError: (error) => {
        console.error('Content adaptation failed:', error)
        if (window.toast) {
          window.toast.error('Content adaptation temporarily unavailable')
        }
      }
    })

    setIsAdapting(false)
  }

  const calculateEffectivenessScore = (adaptations, state) => {
    let score = 50 // Base score

    // Positive adaptations
    if (adaptations.difficulty_adjustment === 'decrease' && state.confusion > 60) score += 20
    if (adaptations.difficulty_adjustment === 'increase' && state.confusion < 30) score += 15
    if (adaptations.interactivity_level === 'high' && state.attention < 50) score += 25
    if (adaptations.break_suggestion && state.fatigue > 70) score += 30

    return Math.min(100, score)
  }

  const manualAdapt = async (adaptationType) => {
    const manualAdaptations = {
      simplify: { difficulty_adjustment: 'decrease', explanation_style: 'detailed' },
      challenge: { difficulty_adjustment: 'increase', explanation_style: 'concise' },
      interactive: { interactivity_level: 'high', content_format: 'interactive' },
      visual: { content_format: 'visual', explanation_style: 'visual' }
    }

    const adaptation = manualAdaptations[adaptationType]
    if (!adaptation) return

    setIsAdapting(true)

    // Apply manual adaptation
    const newContent = {
      ...currentContent,
      ...adaptation,
      manuallyAdapted: true,
      adaptedAt: new Date().toISOString()
    }

    setCurrentContent(newContent)

    // Record manual adaptation
    const adaptationRecord = {
      id: Date.now(),
      timestamp: new Date(),
      type: 'manual',
      adaptationType,
      adaptations: adaptation,
      cognitiveState: { ...cognitiveState }
    }

    setAdaptationHistory(prev => [...prev.slice(-9), adaptationRecord])

    setContentMetrics(prev => ({
      ...prev,
      adaptationCount: prev.adaptationCount + 1,
      interactionCount: prev.interactionCount + 1
    }))

    if (onAdaptationChange) {
      onAdaptationChange(adaptation, newContent)
    }

    setTimeout(() => setIsAdapting(false), 1000)
  }

  const resetContent = () => {
    setCurrentContent(moduleData)
    setAdaptationHistory([])
    setContentMetrics(prev => ({
      ...prev,
      adaptationCount: 0,
      interactionCount: prev.interactionCount + 1
    }))

    if (window.toast) {
      window.toast.info('Content reset to original state')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Adaptation Status */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentContent.title || 'Learning Content'}
          </h2>
          <div className="flex items-center space-x-2">
            {isAdapting && (
              <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Adapting...</span>
              </div>
            )}
            <button
              onClick={() => setAdaptationSettings(prev => ({ ...prev, autoAdapt: !prev.autoAdapt }))}
              className={`p-2 rounded-lg transition-colors ${
                adaptationSettings.autoAdapt 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle auto-adaptation"
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Adaptation Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { 
              label: 'Difficulty', 
              value: currentContent.difficulty_level || 'Medium',
              icon: Target,
              color: currentContent.difficulty_level === 'easy' ? 'green' : 
                     currentContent.difficulty_level === 'hard' ? 'red' : 'blue'
            },
            { 
              label: 'Explanation', 
              value: currentContent.explanation_mode || 'Standard',
              icon: Lightbulb,
              color: 'purple'
            },
            { 
              label: 'Interactivity', 
              value: currentContent.interactivity_level || 'Medium',
              icon: Play,
              color: 'orange'
            },
            { 
              label: 'Format', 
              value: currentContent.primary_format || 'Mixed',
              icon: BookOpen,
              color: 'teal'
            }
          ].map((indicator) => {
            const Icon = indicator.icon
            return (
              <div key={indicator.label} className="text-center">
                <div className={`w-10 h-10 bg-${indicator.color}-100 dark:bg-${indicator.color}-900/20 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 text-${indicator.color}-500`} />
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {indicator.value}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {indicator.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {/* Manual Adaptation Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Manual Adaptations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'simplify', label: 'Simplify', icon: Lightbulb, color: 'green' },
              { key: 'challenge', label: 'Challenge', icon: Target, color: 'red' },
              { key: 'interactive', label: 'Interactive', icon: Zap, color: 'blue' },
              { key: 'visual', label: 'Visual', icon: Eye, color: 'purple' }
            ].map((adaptation) => {
              const Icon = adaptation.icon
              return (
                <button
                  key={adaptation.key}
                  onClick={() => manualAdapt(adaptation.key)}
                  disabled={isAdapting}
                  className={`flex items-center space-x-2 p-3 bg-${adaptation.color}-50 dark:bg-${adaptation.color}-900/20 text-${adaptation.color}-700 dark:text-${adaptation.color}-300 rounded-lg hover:bg-${adaptation.color}-100 dark:hover:bg-${adaptation.color}-900/30 transition-colors disabled:opacity-50`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{adaptation.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content Display */}
        <div className="mb-6">
          <div className="prose dark:prose-invert max-w-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentContent.adaptedAt || 'original'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h3>{currentContent.title || 'Learning Module'}</h3>
                <p>{currentContent.description || 'Content description will appear here.'}</p>
                
                {/* Adaptive Content Based on Current Settings */}
                {currentContent.explanation_mode === 'detailed' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500 my-4">
                    <h4 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">
                      📚 Detailed Explanation
                    </h4>
                    <p className="text-blue-700 dark:text-blue-300">
                      This concept can be understood by thinking of it step by step. Let me walk you through each component and how they connect together...
                    </p>
                  </div>
                )}

                {currentContent.interactivity_level === 'high' && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg my-4">
                    <h4 className="text-green-800 dark:text-green-200 font-semibold mb-3">
                      🎯 Interactive Exercise
                    </h4>
                    <div className="space-y-3">
                      <p className="text-green-700 dark:text-green-300">
                        Let's practice! Which of the following best describes this concept?
                      </p>
                      <div className="space-y-2">
                        {['Option A: Basic definition', 'Option B: Advanced application', 'Option C: Practical example'].map((option, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setContentMetrics(prev => ({ ...prev, interactionCount: prev.interactionCount + 1 }))
                              if (window.toast) window.toast.success('Great choice! Let\'s explore this further.')
                            }}
                            className="block w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-700"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentContent.primary_format === 'visual' && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg my-4">
                    <h4 className="text-purple-800 dark:text-purple-200 font-semibold mb-3">
                      👁️ Visual Learning Aid
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-700 text-center">
                          <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-lg mx-auto mb-2"></div>
                          <p className="text-sm text-purple-700 dark:text-purple-300">Visual {i}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Adaptation History */}
        {adaptationHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Recent Adaptations
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {adaptationHistory.slice(-3).map((adaptation) => (
                <div key={adaptation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {Object.keys(adaptation.adaptations).join(', ').replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {adaptation.timestamp.toLocaleTimeString()} • {Math.round(adaptation.confidence * 100)}% confidence
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {adaptation.type === 'manual' ? '👤 Manual' : '🤖 Auto'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Metrics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Learning Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Time Spent', value: formatTime(contentMetrics.timeSpent), icon: Timer, color: 'blue' },
              { label: 'Interactions', value: contentMetrics.interactionCount, icon: Target, color: 'green' },
              { label: 'Adaptations', value: contentMetrics.adaptationCount, icon: Brain, color: 'purple' },
              { label: 'Effectiveness', value: `${contentMetrics.effectivenessScore}%`, icon: TrendingUp, color: 'orange' }
            ].map((metric) => {
              const Icon = metric.icon
              return (
                <div key={metric.label} className="text-center">
                  <div className={`w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`w-5 h-5 text-${metric.color}-500`} />
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Adaptation Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adaptation Settings
            </h3>
            <button
              onClick={resetContent}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Auto-Adaptation</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={adaptationSettings.autoAdapt}
                  onChange={(e) => setAdaptationSettings(prev => ({ ...prev, autoAdapt: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adaptation Sensitivity: {Math.round(adaptationSettings.sensitivity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={adaptationSettings.sensitivity}
                onChange={(e) => setAdaptationSettings(prev => ({ ...prev, sensitivity: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default AdaptiveContent