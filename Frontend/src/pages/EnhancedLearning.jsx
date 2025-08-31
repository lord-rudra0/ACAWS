import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Camera, 
  Play, 
  Pause, 
  RotateCcw, 
  Target, 
  TrendingUp,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Timer,
  Award,
  Eye,
  Zap,
  Settings,
  BarChart3,
  Users,
  Star
} from 'lucide-react'
import EnhancedCameraAnalysis from '../components/EnhancedCameraAnalysis'
import AIAssistant from '../components/AIAssistant'
import AIInsightsPanel from '../components/AIInsightsPanel'
import SmartRecommendationEngine from '../components/SmartRecommendationEngine'
import IntelligentContentAdaptation from '../components/IntelligentContentAdaptation'
import PredictiveAnalytics from '../components/PredictiveAnalytics'
import useAIFeatures from '../hooks/useAIFeatures'
import { useAuth } from '../contexts/AuthContext'

const EnhancedLearning = () => {
  const { user } = useAuth()
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(true)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentModule, setCurrentModule] = useState(null)
  const [cognitiveState, setCognitiveState] = useState({
    attention: 85,
    confusion: 15,
    engagement: 92,
    fatigue: 20,
    learningReadiness: 88,
    cognitiveLoad: 45,
    emotionalStability: 78
  })
  const [sessionTime, setSessionTime] = useState(0)
  const [showAITutor, setShowAITutor] = useState(false)
  const [showPredictiveAnalytics, setShowPredictiveAnalytics] = useState(false)
  const [learningMetrics, setLearningMetrics] = useState({
    totalStudyTime: 0,
    modulesCompleted: 0,
    averageScore: 0,
    streakDays: 0,
    aiInteractions: 0,
    adaptationsApplied: 0
  })
  const [aiInsights, setAiInsights] = useState([])
  const [generatedQuizzes, setGeneratedQuizzes] = useState([])
  const [learningPaths, setLearningPaths] = useState([])
  const [sessionAnalytics, setSessionAnalytics] = useState({
    cognitiveHistory: [],
    adaptationHistory: [],
    performanceHistory: []
  })
  
  const intervalRef = useRef(null)
  
  const {
    aiState,
    generateIntelligentContent,
    generatePersonalizedQuiz,
    predictLearningOutcome,
    optimizeLearningExperience,
    updateContext
  } = useAIFeatures(user?.id, {
    cognitiveState,
    learningHistory: sessionAnalytics,
    currentModule,
    userProfile: user
  })

  const enhancedLearningModules = [
    {
      id: 1,
      title: 'AI-Enhanced Machine Learning Fundamentals',
      description: 'Comprehensive ML course with AI tutoring and adaptive content',
      difficulty: 'beginner',
      duration: '60 min',
      progress: 75,
      topics: ['Supervised Learning', 'Unsupervised Learning', 'Neural Networks', 'Model Evaluation'],
      aiFeatures: ['Personalized explanations', 'Adaptive quizzes', 'Real-time feedback'],
      hasAITutor: true,
      hasAdaptiveContent: true,
      estimatedScore: 85
    },
    {
      id: 2,
      title: 'Advanced Deep Learning with AI Assistance',
      description: 'Deep learning concepts with intelligent content adaptation',
      difficulty: 'intermediate',
      duration: '90 min',
      progress: 30,
      topics: ['CNNs', 'RNNs', 'Transformers', 'GANs', 'Transfer Learning'],
      aiFeatures: ['Visual concept mapping', 'Code generation', 'Project guidance'],
      hasAITutor: true,
      hasAdaptiveContent: true,
      estimatedScore: 78
    },
    {
      id: 3,
      title: 'Computer Vision with Intelligent Tutoring',
      description: 'CV applications with AI-powered learning assistance',
      difficulty: 'advanced',
      duration: '120 min',
      progress: 0,
      topics: ['Image Processing', 'Object Detection', 'Face Recognition', 'Medical Imaging'],
      aiFeatures: ['Interactive simulations', 'Real-world projects', 'Industry insights'],
      hasAITutor: true,
      hasAdaptiveContent: true,
      estimatedScore: 72
    }
  ]

  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1)
        updateSessionAnalytics()
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isSessionActive])
  
  useEffect(() => {
    // Update AI context when state changes
    updateContext({
      cognitiveState,
      learningHistory: sessionAnalytics,
      currentModule,
      userProfile: user
    })
  }, [cognitiveState, sessionAnalytics, currentModule, user, updateContext])

  const updateSessionAnalytics = () => {
    setSessionAnalytics(prev => ({
      ...prev,
      cognitiveHistory: [...prev.cognitiveHistory.slice(-99), {
        ...cognitiveState,
        timestamp: new Date()
      }]
    }))
  }

  const startEnhancedLearningSession = async (module) => {
    setCurrentModule(module)
    setIsSessionActive(true)
    setSessionTime(0)
    
    // Initialize enhanced session with AI
    try {
      // Generate intelligent content for the module
      const intelligentContent = await generateIntelligentContent(
        module.title,
        { 
          difficulty: module.difficulty,
          userProfile: user,
          cognitiveState 
        }
      )
      
      setLearningPaths(prev => [...prev, intelligentContent])
      
      // Predict learning outcome for this module
      const prediction = await predictLearningOutcome(module)
      console.log('Learning outcome prediction:', prediction)
      
      // Optimize learning experience
      const optimization = await optimizeLearningExperience({
        module,
        cognitiveState,
        userProfile: user
      })
      console.log('Learning optimization:', optimization)
      
      if (window.toast) {
        window.toast.success('AI-enhanced learning session started with intelligent optimization!')
      }
    } catch (error) {
      console.error('Enhanced session initialization failed:', error)
      if (window.toast) {
        window.toast.warning('Session started - some AI features may be limited')
      }
    }
  }

  const handleCognitiveStateUpdate = (newState) => {
    setCognitiveState(newState)
    
    // Update learning metrics based on cognitive state
    setLearningMetrics(prev => ({
      ...prev,
      totalStudyTime: prev.totalStudyTime + (1/60), // Add 1 minute
      averageScore: calculateAverageScore(newState, prev.averageScore)
    }))
  }

  const calculateAverageScore = (cognitiveState, currentAverage) => {
    const cognitiveScore = (
      cognitiveState.attention * 0.3 +
      cognitiveState.engagement * 0.3 +
      (100 - cognitiveState.confusion) * 0.2 +
      (100 - cognitiveState.fatigue) * 0.2
    )
    
    return currentAverage === 0 ? cognitiveScore : (currentAverage + cognitiveScore) / 2
  }

  const handleAITutorQuizGenerated = (quiz) => {
    setGeneratedQuizzes(prev => [...prev, {
      id: Date.now(),
      quiz,
      moduleId: currentModule?.id,
      generatedAt: new Date(),
      source: 'ai_tutor'
    }])
    
    setLearningMetrics(prev => ({
      ...prev,
      aiInteractions: prev.aiInteractions + 1
    }))
  }

  const handleLearningPathGenerated = (path) => {
    setLearningPaths(prev => [...prev, {
      id: Date.now(),
      path,
      generatedAt: new Date(),
      source: 'ai_tutor'
    }])
  }

  const handleContentAdaptation = (adaptedContent, adaptations) => {
    setLearningMetrics(prev => ({
      ...prev,
      adaptationsApplied: prev.adaptationsApplied + 1
    }))
    
    setSessionAnalytics(prev => ({
      ...prev,
      adaptationHistory: [...prev.adaptationHistory, {
        adaptations,
        timestamp: new Date(),
        cognitiveState: { ...cognitiveState }
      }]
    }))
  }

  const handleAdvancedInsights = (insights) => {
    setAiInsights(prev => [...prev.slice(-9), ...insights])
  }

  const handleRecommendationSelected = (recommendation, actionIndex) => {
    console.log('Recommendation selected:', recommendation, actionIndex)
    
    if (window.toast) {
      window.toast.success(`Applied: ${recommendation.title}`)
    }
  }

  const pauseSession = () => {
    setIsSessionActive(false)
  }

  const endSession = async () => {
    setIsSessionActive(false)
    
    // Generate session summary with AI
    try {
      const sessionSummary = await generateSessionSummary()
      
      if (window.toast) {
        window.toast.success('Session completed! AI summary generated.')
      }
      
      // Update metrics
      setLearningMetrics(prev => ({
        ...prev,
        modulesCompleted: currentModule ? prev.modulesCompleted + 1 : prev.modulesCompleted
      }))
      
    } catch (error) {
      console.error('Session summary generation failed:', error)
    }
    
    setCurrentModule(null)
    setSessionTime(0)
  }

  const generateSessionSummary = async () => {
    try {
      const summary = await geminiService.analyzeStudentProgress(
        {
          sessionDuration: sessionTime,
          cognitiveState,
          moduleCompleted: currentModule?.title,
          adaptationsApplied: learningMetrics.adaptationsApplied
        },
        sessionAnalytics.cognitiveHistory
      )
      
      return summary
    } catch (error) {
      console.error('Session summary failed:', error)
      return null
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Enhanced Learning Center
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                AI-powered adaptive learning with Gemini intelligence and advanced ML
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPredictiveAnalytics(!showPredictiveAnalytics)}
                className={`btn-secondary flex items-center space-x-2 ${
                  showPredictiveAnalytics ? 'bg-primary-500 text-white' : ''
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Predictive Analytics</span>
              </button>
              
              <button
                onClick={() => setShowAIInsights(!showAIInsights)}
                className={`btn-secondary flex items-center space-x-2 ${
                  showAIInsights ? 'bg-secondary-500 text-white' : ''
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>AI Insights</span>
              </button>
              
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  AI Score: {Math.round(learningMetrics.averageScore)} • {aiState.activeFeatures.size} features
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Learning Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Study Time', value: `${Math.round(learningMetrics.totalStudyTime)}h`, icon: Timer, color: 'blue' },
            { label: 'Modules', value: learningMetrics.modulesCompleted, icon: BookOpen, color: 'green' },
            { label: 'AI Score', value: `${Math.round(learningMetrics.averageScore)}%`, icon: Brain, color: 'purple' },
            { label: 'Streak', value: `${learningMetrics.streakDays}d`, icon: Award, color: 'orange' },
            { label: 'AI Chats', value: learningMetrics.aiInteractions, icon: MessageCircle, color: 'teal' },
            { label: 'Adaptations', value: learningMetrics.adaptationsApplied, icon: Zap, color: 'red' }
          ].map((metric) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-center hover:shadow-xl transition-all`}
              >
                <div className={`w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 text-${metric.color}-500`} />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.label}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Learning Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Cognitive Analysis */}
            <EnhancedCameraAnalysis
              onCognitiveStateUpdate={handleCognitiveStateUpdate}
              isActive={isSessionActive}
              onAdvancedInsights={handleAdvancedInsights}
              userProfile={user}
            />

            {/* Intelligent Content Adaptation */}
            {currentModule && (
              <IntelligentContentAdaptation
                moduleData={currentModule}
                cognitiveState={cognitiveState}
                userProfile={user}
                learningHistory={sessionAnalytics}
                onContentAdapted={handleContentAdaptation}
                onAdaptationInsights={handleAdvancedInsights}
              />
            )}

            {/* Enhanced Learning Modules */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  AI-Enhanced Learning Modules
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Powered by</span>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Gemini AI
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {enhancedLearningModules.map((module) => (
                  <div
                    key={module.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      currentModule?.id === module.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {module.title}
                          </h3>
                          {module.hasAITutor && (
                            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                              AI Tutor
                            </div>
                          )}
                          {module.hasAdaptiveContent && (
                            <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium">
                              Adaptive
                            </div>
                          )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {module.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            module.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {module.difficulty}
                          </span>
                          <span>{module.duration}</span>
                          <span>Est. Score: {module.estimatedScore}%</span>
                        </div>
                        
                        {/* AI Features */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">AI Features:</p>
                          <div className="flex flex-wrap gap-2">
                            {module.aiFeatures.map((feature, index) => (
                              <span key={index} className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => startEnhancedLearningSession(module)}
                        className="btn-primary flex items-center space-x-2 ml-4"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Enhanced</span>
                      </button>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300 relative"
                          style={{ width: `${module.progress}%` }}
                        >
                          {module.progress > 10 && (
                            <div className="absolute right-2 top-0 h-full flex items-center">
                              <span className="text-white text-xs font-medium">
                                {module.progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Topics with AI Enhancement Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {module.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors cursor-pointer"
                          onClick={() => generateTopicExplanation(topic)}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Active Session Dashboard */}
            {currentModule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {currentModule.title}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-mono text-primary-500">
                      {formatTime(sessionTime)}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={isSessionActive ? pauseSession : () => setIsSessionActive(true)}
                        className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={endSession}
                        className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Cognitive Monitoring */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Attention', value: cognitiveState.attention, icon: Eye, color: 'blue' },
                    { label: 'Engagement', value: cognitiveState.engagement, icon: Zap, color: 'green' },
                    { label: 'Readiness', value: cognitiveState.learningReadiness, icon: Target, color: 'purple' },
                    { label: 'Load', value: cognitiveState.cognitiveLoad, icon: Brain, color: 'orange' }
                  ].map((metric) => {
                    const Icon = metric.icon
                    return (
                      <div key={metric.label} className="text-center">
                        <div className={`w-12 h-12 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                          <Icon className={`w-6 h-6 text-${metric.color}-500`} />
                        </div>
                        <div className={`text-2xl font-bold text-${metric.color}-500 mb-1`}>
                          {Math.round(metric.value)}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {metric.label}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* AI Insights Display */}
                {aiInsights.length > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl mb-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      🤖 AI Insights
                    </h3>
                    <div className="space-y-2">
                      {aiInsights.slice(-2).map((insight, index) => (
                        <div key={index} className="text-sm text-gray-700 dark:text-gray-300">
                          • {insight.message || insight.content || insight}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Predictive Analytics Panel */}
            {showPredictiveAnalytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PredictiveAnalytics
                  userProfile={user}
                  learningHistory={sessionAnalytics}
                  cognitiveState={cognitiveState}
                  wellnessData={{ averageStress: 4, averageMood: 7 }}
                  onPredictionUpdate={(predictions) => console.log('Predictions updated:', predictions)}
                  onRiskAlert={(risks) => {
                    if (window.toast) {
                      window.toast.warning('Learning risk detected - check recommendations')
                    }
                  }}
                />
              </motion.div>
            )}
          
          {/* AI Insights Panel */}
          {showAIInsights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AIInsightsPanel
                cognitiveState={cognitiveState}
                learningData={{
                  averageScore: learningMetrics.averageScore,
                  completedModules: learningMetrics.modulesCompleted,
                  totalTime: learningMetrics.totalStudyTime,
                  studyStreak: learningMetrics.streakDays
                }}
                wellnessData={{ averageStress: 4, averageMood: 7 }}
                onInsightAction={(insight, action) => {
                  console.log('Insight action:', insight, action)
                  if (window.toast) {
                    window.toast.success(`Applied: ${action.label}`)
                  }
                }}
                onInsightDismiss={(insightId) => console.log('Dismissed insight:', insightId)}
              />
            </motion.div>
          )}
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Smart Recommendation Engine */}
          <SmartRecommendationEngine
            userProfile={user}
            cognitiveState={cognitiveState}
            learningHistory={sessionAnalytics}
            wellnessData={{ averageStress: 4, averageMood: 7 }}
            onRecommendationSelected={handleRecommendationSelected}
          />

          {/* Enhanced AI Tutor */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Enhanced AI Tutor
              </h3>
              <button
                onClick={() => setShowAITutor(!showAITutor)}
                className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <span className="text-sm text-blue-800 dark:text-blue-200">Gemini AI Integration</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm text-green-800 dark:text-green-200">Advanced ML Models</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <span className="text-sm text-purple-800 dark:text-purple-200">Predictive Analytics</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>

          {/* Generated Content */}
          {(generatedQuizzes.length > 0 || learningPaths.length > 0) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI-Generated Content
              </h3>
              
              <div className="space-y-3">
                {generatedQuizzes.slice(-2).map((quiz, index) => (
                  <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        AI-Generated Quiz
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {quiz.quiz?.length || 0} questions • Generated {quiz.generatedAt.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                
                {learningPaths.slice(-1).map((path, index) => (
                  <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        AI Learning Path
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {path.path?.length || 0} modules • {Math.round(path.estimatedDuration / 60)} hours
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Session Analytics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Session Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cognitive Data Points</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {sessionAnalytics.cognitiveHistory.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Adaptations Applied</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {sessionAnalytics.adaptationHistory.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">AI Insights Generated</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {aiInsights.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Learning Efficiency</span>
                <span className="font-semibold text-green-500">
                  {Math.round((cognitiveState.attention + cognitiveState.engagement) / 2)}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced AI Assistant */}
      <AIAssistant
        isOpen={showAIAssistant}
        onToggle={() => setShowAIAssistant(!showAIAssistant)}
        currentTopic={currentModule?.title}
        currentContext={{
          cognitiveState,
          learningHistory: sessionAnalytics,
          userProfile: user,
          currentModule
        }}
        onInsightGenerated={(insights) => {
          setAiInsights(prev => [...prev.slice(-9), ...insights])
        }}
        onRecommendationApplied={(rec) => {
          console.log('Applied recommendation:', rec)
        }}
      />
      
      {/* Floating AI Assistant Button */}
      {!showAIAssistant && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
        >
          <Brain className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  </div>
  )
}

// Helper function
const generateTopicExplanation = async (topic) => {
  try {
    if (window.toast) {
      window.toast.info(`Generating AI explanation for: ${topic}`)
    }
  } catch (error) {
    console.error('Topic explanation failed:', error)
  }
}

export default EnhancedLearning