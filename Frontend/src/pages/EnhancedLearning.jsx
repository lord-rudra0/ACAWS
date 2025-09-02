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
import geminiService from '../services/geminiService'
import { learningAPI, wellnessAPI, analyticsAPI, pythonAPI } from '../services/api'
import { userAPI } from '../services/api'
import { Camera as CameraIcon } from 'lucide-react'

// Simple SVG avatar generator (returns data URL)
const generateAvatarDataUrl = (text = '', size = 64) => {
  const initials = (text || '').split(' ').slice(0,2).map(s => s[0] || '').join('').toUpperCase() || 'U'
  const hue = (Array.from((text || '')).reduce((s,c) => s + c.charCodeAt(0), 0) % 360)
  const bg = `hsl(${hue} 60% 60%)`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}' rx='8' ry='8'/><text x='50%' y='55%' font-size='28' font-family='Inter, Roboto, sans-serif' fill='white' text-anchor='middle' dominant-baseline='middle'>${initials}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Reusable button components for consistent UI
const PrimaryBtn = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
    {...props}
  >
    {children}
  </button>
)

const SecondaryBtn = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 ${className}`}
    {...props}
  >
    {children}
  </button>
)

const IconBtn = ({ children, className = '', 'aria-label': ariaLabel = '', ...props }) => (
  <button
    aria-label={ariaLabel}
    className={`inline-flex items-center justify-center rounded-md p-2 text-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${className}`}
    {...props}
  >
    {children}
  </button>
)

const EnhancedLearning = () => {
  const { user } = useAuth()
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(true)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentModule, setCurrentModule] = useState(null)
  const [cognitiveState, setCognitiveState] = useState({
    attention: 0,
    confusion: 0,
    engagement: 0,
    fatigue: 0,
    learningReadiness: 0,
    cognitiveLoad: 0,
    emotionalStability: 0
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

  const [modules, setModules] = useState([])
  const [moduleQuery, setModuleQuery] = useState('')
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newModuleDifficulty, setNewModuleDifficulty] = useState('beginner')
  const [newModuleDuration, setNewModuleDuration] = useState('60 min')

  // Modal form state to create a module when no module is selected
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false)
  // pendingAction holds the action to execute after creating/selecting a module
  const [pendingAction, setPendingAction] = useState(null)

  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem('el:autoSuggest')) ?? true } catch { return true }
  })
  const [onDeviceOnly, setOnDeviceOnly] = useState(() => {
    try { return JSON.parse(localStorage.getItem('el:onDeviceOnly')) ?? true } catch { return true }
  })
  const [sessionSavedAt, setSessionSavedAt] = useState(null)
  const [predictionResult, setPredictionResult] = useState(null)
  const [showPredictionExplanation, setShowPredictionExplanation] = useState(false)
  const [lastSavedModuleId, setLastSavedModuleId] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [recLoading, setRecLoading] = useState(false)
  const [showRecDetails, setShowRecDetails] = useState(false)

  useEffect(() => {
    // Load persisted modules from backend on mount
    const loadModules = async () => {
      try {
        const resp = await learningAPI.getModules()
        if (resp && resp.modules) setModules(resp.modules)
      } catch (err) {
        console.error('Could not load modules:', err)
      }
    }

    loadModules()

    // Load persisted wellness summary for correlation/alerts
    const loadWellness = async () => {
      try {
        const ws = await wellnessAPI.getDailySummary()
        if (ws) setPersistedWellness(ws.summary ?? ws)
      } catch (err) {
        console.error('Could not load persisted wellness summary:', err)
      }
    }
    loadWellness()

    // load user preferences (best-effort)
    const loadUserSettings = async () => {
      try {
        const settings = await userAPI.getSettings()
        if (settings && typeof settings.autoSuggestEnabled === 'boolean') {
          setAutoSuggestEnabled(settings.autoSuggestEnabled)
          localStorage.setItem('el:autoSuggest', JSON.stringify(settings.autoSuggestEnabled))
        }
        if (settings && typeof settings.onDeviceOnly === 'boolean') {
          setOnDeviceOnly(settings.onDeviceOnly)
          localStorage.setItem('el:onDeviceOnly', JSON.stringify(settings.onDeviceOnly))
        }
      } catch (err) {
        // ignore - user settings route may not exist for quick dev environments
      }
    }
    loadUserSettings()

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

  // Persist autoSuggestEnabled preference whenever it changes (best-effort to backend)
  useEffect(() => {
    try {
      localStorage.setItem('el:autoSuggest', JSON.stringify(autoSuggestEnabled))
    } catch (e) { }

    const savePref = async () => {
      try {
        await userAPI.saveSettings({ autoSuggestEnabled })
      } catch (err) {
        // non-fatal: backend may not expose settings endpoint
      }
    }
    savePref()
  }, [autoSuggestEnabled])
  
  useEffect(() => {
    // Update AI context when state changes
    updateContext({
      cognitiveState,
      learningHistory: sessionAnalytics,
      currentModule,
      userProfile: user
    })
  }, [cognitiveState, sessionAnalytics, currentModule, user, updateContext])

  // Auto-suggest when confusion spikes above threshold (cooldown applied)
  useEffect(() => {
    const threshold = 60
    const cooldownMs = 2 * 60 * 1000 // 2 minutes
    const now = Date.now()
    const confusion = cognitiveState?.confusion || 0
    if (confusion >= threshold && (now - lastAutoSuggestAt.current) > cooldownMs) {
      lastAutoSuggestAt.current = now
      const topic = currentModule?.topics?.[0] || currentModule?.title || null
      if (topic) {
        generateTopicExplanation(topic)
        if (window.toast) window.toast.info('AI Tutor suggested an explanation for possible confusion')
      }
    }
  }, [cognitiveState?.confusion])

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
      
      // Track module locally if not already present
      setModules(prev => {
        const exists = prev.some(m => m.id === module.id || m.title === module.title)
        if (exists) return prev
        const newMod = {
          id: module.id || Date.now(),
          title: module.title,
          description: module.description || 'User added module',
          difficulty: module.difficulty || 'beginner',
          duration: module.duration || '60 min',
          progress: module.progress || 0,
          topics: module.topics || [],
          aiFeatures: module.aiFeatures || [],
          hasAITutor: true,
          hasAdaptiveContent: true,
          estimatedScore: module.estimatedScore || Math.round(learningMetrics.averageScore)
        }
        return [...prev, newMod]
      })
      
      // Predict learning outcome for this module
  const prediction = await predictLearningOutcome(module)
  console.log('Learning outcome prediction:', prediction)
  setPredictionResult(prediction)
      
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

  // Quick Action handlers
  const [quickActionLoading, setQuickActionLoading] = useState(false)
  const [persistedWellness, setPersistedWellness] = useState(null)
  const lastAutoSuggestAt = useRef(0)

  const handleQuickMicroQuiz = async () => {
    if (!currentModule) {
      // open create-module modal and remember to continue this action
      setPendingAction('quickMicroQuiz')
      setShowCreateModuleModal(true)
      return
    }
    setQuickActionLoading(true)
    try {
      const quiz = await generatePersonalizedQuiz(currentModule.title, { difficulty: currentModule.difficulty })
      handleAITutorQuizGenerated(quiz)
      if (window.toast) window.toast.success('Micro-quiz generated')
    } catch (err) {
      console.error('Micro-quiz failed:', err)
      if (window.toast) window.toast.warning('Could not generate micro-quiz')
    } finally {
      setQuickActionLoading(false)
    }
  }

  const handleLowerDifficulty = async () => {
    if (!currentModule) {
      setPendingAction('lowerDifficulty')
      setShowCreateModuleModal(true)
      return
    }
    setQuickActionLoading(true)
    try {
      const adaptation = await optimizeLearningExperience({
        module: currentModule,
        cognitiveState,
        userProfile: user,
        intent: 'lower_difficulty'
      })
      handleContentAdaptation(adaptation?.content || {}, adaptation?.adaptations || {})
      if (window.toast) window.toast.success('Lowered difficulty for current module')
    } catch (err) {
      console.error('Lower difficulty failed:', err)
      if (window.toast) window.toast.warning('Could not adjust difficulty')
    } finally {
      setQuickActionLoading(false)
    }
  }

  const handleShortBreathingBreak = async () => {
    // Pause session and schedule a 2-minute break
    const wasActive = isSessionActive
    if (wasActive) pauseSession()
    if (window.toast) window.toast.info('Starting 2-minute breathing break')

    // Persist break activity (best-effort)
    try {
      await wellnessAPI.recordBreak({ type: 'breathing', duration_seconds: 120, module_id: currentModule?.id || null })
    } catch (err) {
      // non-fatal
      console.error('Could not record break:', err)
    }

    setTimeout(() => {
      if (wasActive) setIsSessionActive(true)
      if (window.toast) window.toast.success('Break complete — resuming session')
    }, 120000)
  }

  const handleRegenerateContent = async () => {
    if (!currentModule) {
      setPendingAction('regenerateContent')
      setShowCreateModuleModal(true)
      return
    }
    setQuickActionLoading(true)
    try {
      const content = await generateIntelligentContent(currentModule.title, { difficulty: currentModule.difficulty, userProfile: user, cognitiveState })
      handleLearningPathGenerated(content)
      if (window.toast) window.toast.success('Content regenerated')
    } catch (err) {
      console.error('Regenerate content failed:', err)
      if (window.toast) window.toast.warning('Could not regenerate content')
    } finally {
      setQuickActionLoading(false)
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

  // Create module from modal and optionally continue pending action
  const submitCreateModuleFromModal = async () => {
    if (!newModuleTitle || !newModuleTitle.trim()) {
      if (window.toast) window.toast.info('Please enter a module title')
      return
    }

    const modulePayload = {
      title: newModuleTitle.trim(),
      description: 'User added module',
      category: 'user',
      difficulty: newModuleDifficulty,
      duration: parseInt(newModuleDuration) || 60,
      topics: []
    }

    try {
      const resp = await learningAPI.createModule(modulePayload)
      let created
      if (resp && resp.module) {
        created = resp.module
        setModules(prev => [...prev, resp.module])
      } else {
        created = { id: Date.now(), title: modulePayload.title, description: modulePayload.description, difficulty: modulePayload.difficulty, duration: modulePayload.duration }
        setModules(prev => [...prev, created])
      }

      // set as current module and close modal
      setCurrentModule(created)
      setShowCreateModuleModal(false)
      setPendingAction(null)

      // Small delay to ensure state is applied before invoking the pending action
      setTimeout(() => {
        if (pendingAction === 'quickMicroQuiz') handleQuickMicroQuiz()
        if (pendingAction === 'lowerDifficulty') handleLowerDifficulty()
        if (pendingAction === 'regenerateContent') handleRegenerateContent()
      }, 100)
    } catch (err) {
      console.error('Create module failed:', err)
      // fallback: create locally
      const created = { id: Date.now(), title: modulePayload.title, description: modulePayload.description, difficulty: modulePayload.difficulty, duration: modulePayload.duration }
      setModules(prev => [...prev, created])
      setCurrentModule(created)
      setShowCreateModuleModal(false)
      setPendingAction(null)
      setTimeout(() => {
        if (pendingAction === 'quickMicroQuiz') handleQuickMicroQuiz()
        if (pendingAction === 'lowerDifficulty') handleLowerDifficulty()
        if (pendingAction === 'regenerateContent') handleRegenerateContent()
      }, 100)
    }
  }

  // record prediction into session history for later review
  useEffect(() => {
    if (predictionResult) {
      setSessionAnalytics(prev => ({
        ...prev,
        predictionHistory: [...(prev.predictionHistory || []), {
          id: Date.now(),
          prediction: predictionResult,
          timestamp: new Date()
        }]
      }))
      // Best-effort persist prediction to backend
      (async () => {
        try {
          await learningAPI.savePrediction({ module_id: currentModule?.id, prediction: predictionResult })
        } catch (err) {
          // non-fatal
          console.debug('Could not persist prediction:', err)
        }
      })()
    }
  }, [predictionResult])

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
      
      // Persist the session summary to backend (best-effort)
      if (sessionSummary) {
        await persistSessionSummary(sessionSummary)
      } else {
        // still try to persist minimal summary
        await persistSessionSummary({
          completion_percentage: currentModule ? 100 : 0,
          initial_cognitive_state: {},
          final_cognitive_state: cognitiveState
        })
      }

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
    
    // After session ends, request a model-backed recommendation automatically
    try {
      const rec = await requestModelRecommendation()
      if (rec) {
        // allow small delay for UI consistency
        setTimeout(() => setCurrentModule(null), 300)
      } else {
        setCurrentModule(null)
      }
    } catch (e) {
      setCurrentModule(null)
    }

    setSessionTime(0)
  }

  // Persist session summary to backend
  const persistSessionSummary = async (summary) => {
    try {
      const payload = {
        module_id: currentModule?.id,
        session_type: 'study',
        summary: {
          ...summary,
          started_at: summary?.started_at || new Date().toISOString(),
          ended_at: new Date().toISOString()
        },
        cognitiveHistory: sessionAnalytics.cognitiveHistory,
        adaptations: sessionAnalytics.adaptationHistory,
        metrics: {
          attention_score: Math.round(learningMetrics.averageScore),
          wellness_score: null
        },
        duration: sessionTime
      }

      const resp = await learningAPI.saveSessionSummary(payload)
      if (resp && resp.session) {
        if (window.toast) window.toast.success('Session saved to server')
        const now = new Date()
        setSessionSavedAt(now)
        // Record which module's session was saved and clear after a short duration
        try {
          const mid = currentModule?.id || null
          setLastSavedModuleId(mid)
          setTimeout(() => setLastSavedModuleId(null), 6000)
        } catch (e) {}
        // small visual flash (floating toast) retained for accessibility
        if (window.toast) window.toast.info(`Session saved • ${now.toLocaleTimeString()}`)
        // Refresh analytics dashboard to include this session in aggregated views
        try {
          await analyticsAPI.getDashboard()
        } catch (e) {
          // non-fatal
          console.debug('analytics refresh failed:', e)
        }
      }
    } catch (err) {
      console.error('Could not persist session summary:', err)
      if (window.toast) window.toast.warning('Session summary could not be saved')
    }
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

  const generateTopicExplanation = async (topic) => {
    try {
      const result = await geminiService.generatePersonalizedExplanation(
        topic,
        user || {},
        cognitiveState
      )
      const message = result?.explanation || 'Explanation generated.'
      setAiInsights(prev => [...prev.slice(-9), { message, source: 'gemini', topic, timestamp: new Date() }])
      if (window.toast) window.toast.success('AI explanation generated')
    } catch (error) {
      console.error('Topic explanation failed:', error)
      if (window.toast) window.toast.warning('Could not generate explanation right now')
    }
  }

  // Correlation helpers: detect combined low wellness + low attention risk
  const getPersistedWellnessScore = () => {
    if (!persistedWellness) return null
    return persistedWellness.wellness_score ?? persistedWellness.wellnessScore ?? null
  }

  const handleShowCorrelationRecommendations = async () => {
    try {
      const resp = await optimizeLearningExperience({
        module: currentModule,
        cognitiveState,
        userProfile: user,
        intent: 'recommend_relief_or_review'
      })
      if (resp) {
        setAiInsights(prev => [...prev.slice(-9), { message: resp.message || 'Recommendations generated', details: resp }])
        if (window.toast) window.toast.success('Recommendations generated')
      }
    } catch (err) {
      console.error('Correlation recommendations failed:', err)
      if (window.toast) window.toast.warning('Could not generate recommendations')
    }
  }

  // Request model-backed recommendation from Python backend
  // small spinner SVG used by buttons
  const Spinner = ({ className = 'w-4 h-4 text-white' }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"></path>
    </svg>
  )

  const ConfidenceBar = ({ value = 0 }) => {
    const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)))
    return (
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
      </div>
    )
  }

  // Build feature vector matching the training-time tokens used by the backend pipeline.
  // This creates numeric tokens prefixed with `num__` and one-hot categorical tokens `cat__<field>_<value>`.
  const buildModelFeatures = (rawDefaults = {}, perf = {}) => {
    const features = {}

    // numeric fields to prefix with num__
    const numericFields = ['age','Medu','Fedu','traveltime','studytime','failures','famrel','freetime','goout','Dalc','Walc','health','absences']
    numericFields.forEach(f => {
      const v = rawDefaults[f]
      features[`num__${f}`] = v == null || v === '' ? 0 : Number(v)
    })

    // map performance metrics to numeric tokens as well
    features['num__score'] = Number(perf.score ?? perf.score_percentage ?? 0)
    features['num__time_taken'] = Number(perf.time_taken ?? perf.duration_seconds ?? 0)
    features['num__mistake_count'] = Number(perf.mistake_count ?? perf.mistakes ?? 0)

    // categorical fields and a small catalog of their expected tokens (best-effort)
    const categoricalOptions = {
      school: ['GP','MS'],
      sex: ['F','M'],
      address: ['U','R'],
      famsize: ['GT3','LE3'],
      Pstatus: ['T','A'],
      Mjob: ['at_home','health','services','teacher','other'],
      Fjob: ['at_home','health','services','teacher','other'],
      reason: ['home','reputation','course','other'],
      guardian: ['mother','father','other'],
      schoolsup: ['yes','no'],
      famsup: ['yes','no'],
      paid: ['yes','no'],
      activities: ['yes','no'],
      nursery: ['yes','no'],
      higher: ['yes','no'],
      internet: ['yes','no'],
      romantic: ['yes','no']
    }

    Object.entries(categoricalOptions).forEach(([field, opts]) => {
      const val = (rawDefaults[field] ?? '').toString()
      opts.forEach(opt => {
        const key = `cat__${field}_${opt}`
        features[key] = val === opt ? 1 : 0
      })
    })

    // include some context tokens for module / session as fallback simple features
    if (currentModule?.difficulty) {
      const diff = currentModule.difficulty.toString().toLowerCase()
      features[`cat__module_difficulty_${diff}`] = 1
    }

    // Keep raw perf for debugging on server
    features['raw_performance_json'] = JSON.stringify(perf || {})

    return features
  }

  const requestModelRecommendation = async () => {
    setRecLoading(true)
    try {
      // Build raw feature defaults expected by backend pipeline (best-effort from user profile)
      const rawDefaults = {
        age: user?.age ?? 16,
        Medu: user?.Medu ?? 2,
        Fedu: user?.Fedu ?? 2,
        traveltime: 1,
        studytime: 2,
        failures: 0,
        famrel: 4,
        freetime: 3,
        goout: 3,
        Dalc: 1,
        Walc: 1,
        health: 5,
        absences: 0,
        school: user?.school ?? 'GP',
        sex: user?.sex ?? (user?.gender || 'F'),
        address: user?.address ?? 'U',
        famsize: user?.famsize ?? 'GT3',
        Pstatus: user?.Pstatus ?? 'T',
        Mjob: user?.Mjob ?? 'at_home',
        Fjob: user?.Fjob ?? 'teacher',
        reason: user?.reason ?? 'course',
        guardian: user?.guardian ?? 'mother',
        schoolsup: user?.schoolsup ?? 'no',
        famsup: user?.famsup ?? 'no',
        paid: user?.paid ?? 'no',
        activities: user?.activities ?? 'yes',
        nursery: user?.nursery ?? 'yes',
        higher: user?.higher ?? 'yes',
        internet: user?.internet ?? 'yes',
        romantic: user?.romantic ?? 'no'
      }

      // runtime session metrics
      const perf = {
        score: learningMetrics.averageScore ?? 0,
        time_taken: sessionTime ?? 0,
        mistake_count: sessionAnalytics.performanceHistory?.slice(-1)?.[0]?.mistakes ?? 0
      }

      // normalize keys to lowercase as before
      const perfNormalized = {}
      Object.entries(perf).forEach(([k,v]) => { perfNormalized[String(k).toLowerCase()] = v })

      // build model-ready features
      const modelFeatures = buildModelFeatures(rawDefaults, perfNormalized)

      const payload = {
        user_id: user?.id || null,
        // send the model-ready feature tokens in `performance` so backend can feed the pipeline directly
        performance: modelFeatures,
        raw_performance: perfNormalized,
        cognitive_history: sessionAnalytics.cognitiveHistory?.slice(-100) || [],
        current_module: currentModule ? { id: currentModule.id, title: currentModule.title, difficulty: currentModule.difficulty } : null
      }

      // POST to python recommendation endpoint
      const resp = await pythonAPI.post('/api/learning/recommend', payload)
      if (resp && resp.data) {
        setRecommendation(resp.data.recommendation || resp.data)
      }
      return resp?.data
    } catch (err) {
      console.error('Model recommendation failed:', err)
      return null
    } finally {
      setRecLoading(false)
    }
  }

  // Apply a recommendation action to the UI / session
  const handleApplyRecommendation = (rec) => {
    if (!rec) return
    const r = rec?.recommendation ?? rec?.data?.recommendation ?? rec
    const action = r?.action || r?.type || null
    const specific = r?.specific || null

    // Map known actions to handlers
    switch (action) {
      case 'break':
      case 'take_break':
        if (window.toast) window.toast.info('Scheduling short break...')
        handleShortBreathingBreak()
        break
      case 'lower_difficulty':
      case 'easier':
        if (window.toast) window.toast.info('Applying lower difficulty...')
        handleLowerDifficulty()
        break
      case 'review':
      case 'open_review':
        if (window.toast) window.toast.info('Opening review content...')
        // attempt to locate module by id or title
        if (specific) {
          const target = modules.find(m => String(m.id) === String(specific) || (m.title && m.title.toLowerCase().includes(String(specific).toLowerCase())))
          if (target) {
            setCurrentModule(target)
            if (window.toast) window.toast.success(`Opened module: ${target.title}`)
            return
          }
        }
        if (window.toast) window.toast.success('Review suggestion applied')
        break
      case 'open_content':
      case 'open_module':
        if (specific) {
          const target2 = modules.find(m => String(m.id) === String(specific) || (m.title && m.title.toLowerCase().includes(String(specific).toLowerCase())))
          if (target2) {
            setCurrentModule(target2)
            if (window.toast) window.toast.success(`Opened module: ${target2.title}`)
            return
          }
        }
        if (window.toast) window.toast.info('Open content requested')
        break
      default:
        if (window.toast) window.toast.info('Recommendation applied')
        console.log('Unhandled recommendation action:', action, rec)
    }
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
              <SecondaryBtn onClick={() => setShowPredictiveAnalytics(!showPredictiveAnalytics)} className={`${showPredictiveAnalytics ? 'bg-primary-500 text-white' : ''}`}>
                <BarChart3 className="w-4 h-4 mr-2" />
                <span>Predictive Analytics</span>
              </SecondaryBtn>
              
              <SecondaryBtn onClick={() => setShowAIInsights(!showAIInsights)} className={`${showAIInsights ? 'bg-secondary-500 text-white' : ''}`}>
                <Brain className="w-4 h-4 mr-2" />
                <span>AI Insights</span>
              </SecondaryBtn>
              
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  AI Score: {Math.round(learningMetrics.averageScore)} • {aiState.activeFeatures.size} features
                </span>
              </div>
              {/* Wellness badge */}
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Wellness</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getPersistedWellnessScore() !== null ? `${Math.round(getPersistedWellnessScore())}%` : '—'}
                  </span>
                </div>
                <div className="ml-2 w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              {/* Privacy toggle: on-device only processing */}
              <div className="flex items-center space-x-2">
                <SecondaryBtn
                  onClick={() => setOnDeviceOnly(v => {
                    const next = !v
                    try { localStorage.setItem('el:onDeviceOnly', JSON.stringify(next)) } catch {}
                    userAPI.saveSettings?.({ onDeviceOnly: next }).catch(() => {})
                    return next
                  })}
                  title="On-device only: when enabled, derived signals stay local and network calls are minimized"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  {onDeviceOnly ? 'On-device' : 'Network'}
                </SecondaryBtn>
              </div>
              {/* header area - saved badge moved next to module Start button */}
            </div>
          </div>
        </motion.div>
        {/* Quick Actions */}
            <div className="mb-6">
          <div className="flex items-center gap-3">
            <PrimaryBtn onClick={handleQuickMicroQuiz} disabled={quickActionLoading}><Target className="w-4 h-4 mr-2" />Micro-quiz</PrimaryBtn>
            <PrimaryBtn onClick={handleLowerDifficulty} disabled={quickActionLoading}><Settings className="w-4 h-4 mr-2" />Lower difficulty</PrimaryBtn>
            <SecondaryBtn onClick={handleShortBreathingBreak}><Timer className="w-4 h-4 mr-2" />2-min break</SecondaryBtn>
            <SecondaryBtn onClick={handleRegenerateContent} disabled={quickActionLoading}>{quickActionLoading ? <Spinner className="w-4 h-4 mr-2 text-gray-700" /> : <RotateCcw className="w-4 h-4 mr-2" />}Regenerate</SecondaryBtn>
          </div>
        </div>

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
              onDeviceOnly={onDeviceOnly}
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

              {/* Add Module (recorded locally) */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Module title"
                  value={newModuleTitle}
                  onChange={e => setNewModuleTitle(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-lg border dark:bg-gray-900 dark:border-gray-700"
                />
                <select
                  value={newModuleDifficulty}
                  onChange={e => setNewModuleDifficulty(e.target.value)}
                  className="px-3 py-2 rounded-lg border dark:bg-gray-900 dark:border-gray-700"
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModuleDuration}
                    onChange={e => setNewModuleDuration(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border dark:bg-gray-900 dark:border-gray-700"
                  />
                  <button
                    className="btn-primary"
                    onClick={async () => {
                      if (!newModuleTitle.trim()) return
                      const modulePayload = {
                        title: newModuleTitle.trim(),
                        description: 'User added module',
                        category: 'user',
                        difficulty: newModuleDifficulty,
                        duration: parseInt(newModuleDuration) || 60,
                        topics: []
                      }
                      try {
                        const resp = await learningAPI.createModule(modulePayload)
                        if (resp && resp.module) {
                          setModules(prev => [...prev, resp.module])
                          setNewModuleTitle('')
                          if (window.toast) window.toast.success('Module saved')
                        } else {
                          const mod = { id: Date.now(), title: newModuleTitle.trim(), description: 'User added module', difficulty: newModuleDifficulty, duration: newModuleDuration }
                          setModules(prev => [...prev, mod])
                          setNewModuleTitle('')
                        }
                      } catch (err) {
                        console.error('Create module failed:', err)
                        const mod = { id: Date.now(), title: newModuleTitle.trim(), description: 'User added module', difficulty: newModuleDifficulty, duration: newModuleDuration }
                        setModules(prev => [...prev, mod])
                        setNewModuleTitle('')
                        if (window.toast) window.toast.warning('Could not persist module, saved locally')
                      }
                    }}
                  >Add</button>
                </div>
              </div>

              {/* Module search */}
              <div className="mb-4">
                <input
                  type="search"
                  placeholder="Search modules..."
                  value={moduleQuery}
                  onChange={e => setModuleQuery(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border dark:bg-gray-900 dark:border-gray-700"
                />
              </div>

              <div className="space-y-4">
                {modules.length === 0 && (
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400">
                    No modules yet. Add a module to start a recorded session.
                  </div>
                )}
                {modules.filter(m => m.title.toLowerCase().includes(moduleQuery.toLowerCase())).map((module) => (
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
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {/* Thumbnail or initials */}
                            {module.thumbnail ? (
                              <img src={module.thumbnail} alt={module.title} className="w-full h-full object-cover" />
                            ) : (
                              <img src={generateAvatarDataUrl(module.title, 64)} alt={module.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {module.title}
                            </h3>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{module.recommendationCopy || `Recommended for you — matches your learning interests`}</div>
                          </div>
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
                          {typeof module.estimatedScore === 'number' && (
                            <span>Est. Score: {module.estimatedScore}%</span>
                          )}
                        </div>
                        
                        {/* AI Features */}
                        {Array.isArray(module.aiFeatures) && module.aiFeatures.length > 0 && (
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
                        )}
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-3">
                        <PrimaryBtn onClick={() => startEnhancedLearningSession(module)}>
                          <Play className="w-4 h-4 mr-2" />
                          <span>Start Enhanced</span>
                        </PrimaryBtn>
                        {lastSavedModuleId === module.id && (
                          <div className="px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs flex items-center space-x-1 animate-bounce">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            <span>Saved</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    {Array.isArray(module.topics) && module.topics.length > 0 && (
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
                    )}

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

            {/* Recommendation panel (model-backed) */}
            <div className="mt-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personalized Recommendation</h3>
                    <p className="text-sm text-gray-500 mt-1">Model-backed suggestion to help the learner now.</p>
                  </div>
                  <div>
                    <button
                      onClick={requestModelRecommendation}
                      disabled={recLoading}
                      className="inline-flex items-center space-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                    >
                      {recLoading ? <Spinner className="w-4 h-4 text-white" /> : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      <span>{recLoading ? 'Requesting...' : 'Get Recommendation'}</span>
                    </button>
                  </div>
                </div>

                {recommendation ? (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="col-span-1 flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                        <Lightbulb className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{recommendation?.recommendation?.action ?? recommendation?.data?.recommendation?.action ?? 'Suggested action'}</div>
                        <div className="text-xs text-gray-500 mt-1">{recommendation?.recommendation?.content_type ?? recommendation?.data?.recommendation?.content_type ?? ''}</div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="mb-2 text-xs text-gray-500">Confidence</div>
                      <ConfidenceBar value={(recommendation?.recommendation?.confidence ?? recommendation?.data?.recommendation?.confidence) || 0} />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">Model: {String(recommendation?.model_based ?? recommendation?.data?.model_based ?? false)}</span>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">Type: {recommendation?.recommendation?.content_type ?? recommendation?.data?.recommendation?.content_type ?? '—'}</span>
                      </div>
                    </div>

                    <div className="col-span-1 flex items-start space-x-2 md:justify-end">
                      <button onClick={() => handleApplyRecommendation(recommendation)} className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500">
                        Apply
                      </button>
                      <button onClick={() => setShowRecDetails(d => !d)} className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {showRecDetails ? 'Hide details' : 'Details'}
                      </button>
                    </div>

                    {showRecDetails && (
                      <div className="col-span-full mt-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded">
                        <div className="mb-2"><strong>Specific:</strong> {recommendation?.recommendation?.specific ?? recommendation?.data?.recommendation?.specific ?? '—'}</div>
                        <div><strong>Explanation:</strong> {recommendation?.explanation ?? recommendation?.data?.explanation ?? 'No explanation provided.'}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-gray-500">No recommendation yet — click Get Recommendation or end session to request automatically.</div>
                )}
              </div>
            </div>

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
                {/* Prediction Result & Session Saved Indicator */}
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {predictionResult ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Predicted Outcome</div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">{predictionResult.label || 'Result'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Confidence</div>
                          <div className="text-lg font-mono text-primary-500">{Math.round((predictionResult.confidence || 0) * 100)}%</div>
                        </div>
                      </div>
                      <div>
                        <button onClick={() => setShowPredictionExplanation(s => !s)} className="text-sm text-primary-600 hover:underline">
                          {showPredictionExplanation ? 'Hide explanation' : 'Show explanation'}
                        </button>
                        {showPredictionExplanation && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {predictionResult.explanation || predictionResult.details || 'No explanation available.'}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No prediction available for this module yet.</div>
                  )}

                  {sessionSavedAt && (
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">Last saved: {new Date(sessionSavedAt).toLocaleString()}</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Predictive Analytics Panel */}
            {showPredictiveAnalytics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Correlation alert: low persisted wellness + low attention */}
                {(() => {
                  const pws = getPersistedWellnessScore()
                  const attention = Math.round(cognitiveState.attention || 0)
                  if (pws !== null && pws < 50 && attention < 50) {
                    return (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-red-700 dark:text-red-300">Wellness + Learning Risk</div>
                            <div className="text-xs text-red-600 dark:text-red-400">Persisted wellness is low ({Math.round(pws)}) and attention appears reduced ({attention}%) — consider a short break or review.</div>
                          </div>
                          <div>
                            <button onClick={handleShowCorrelationRecommendations} className="btn-primary">Get recommendations</button>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
                <PredictiveAnalytics
                  userProfile={user}
                  learningHistory={sessionAnalytics}
                  cognitiveState={cognitiveState}
                  wellnessData={{
                    averageStress: Math.round((cognitiveState.fatigue + cognitiveState.cognitiveLoad) / 2 / 10) || 0,
                    averageMood: Math.round((cognitiveState.emotionalStability + cognitiveState.engagement) / 2 / 10) || 0
                  }}
                  persistedWellness={persistedWellness}
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
                wellnessData={{
                  averageStress: Math.round((cognitiveState.fatigue + cognitiveState.cognitiveLoad) / 2 / 10) || 0,
                  averageMood: Math.round((cognitiveState.emotionalStability + cognitiveState.engagement) / 2 / 10) || 0
                }}
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
            wellnessData={{
              averageStress: Math.round((cognitiveState.fatigue + cognitiveState.cognitiveLoad) / 2 / 10) || 0,
              averageMood: Math.round((cognitiveState.emotionalStability + cognitiveState.engagement) / 2 / 10) || 0
            }}
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
      {/* Create Module Modal (inline, not alert) */}
      {showCreateModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => { setShowCreateModuleModal(false); setPendingAction(null) }} />
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 z-50 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Create a module to continue</h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 rounded border dark:bg-gray-900" placeholder="Module title" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} />
              <div className="flex gap-2">
                <select value={newModuleDifficulty} onChange={e => setNewModuleDifficulty(e.target.value)} className="flex-1 px-3 py-2 rounded border dark:bg-gray-900">
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
                <input className="w-32 px-3 py-2 rounded border dark:bg-gray-900" value={newModuleDuration} onChange={e => setNewModuleDuration(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button onClick={() => { setShowCreateModuleModal(false); setPendingAction(null) }} className="px-3 py-2 rounded bg-gray-100 dark:bg-gray-700">Cancel</button>
                <button onClick={submitCreateModuleFromModal} className="px-3 py-2 rounded bg-indigo-600 text-white">Create & Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

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

export default EnhancedLearning