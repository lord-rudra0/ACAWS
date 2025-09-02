import React, { useState, useEffect, useRef, useCallback } from 'react'
// import Webcam from 'react-webcam' // Removed for performance
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Award,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Eye,
  Heart,
  Zap,
  Camera,
  RefreshCw
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { learningAPI } from '../services/api'
import CameraAnalysis from '../components/CameraAnalysis'
import Roadmap from '../components/tutor/Roadmap'
import Chapter from '../components/tutor/Chapter'
import Quiz from '../components/tutor/Quiz'
import ProgressChart from '../components/tutor/ProgressChart'
import ModulePicker from '../components/tutor/ModulePicker'
import { tutorAPI } from '../services/api'
import useWebSocket from '../hooks/useWebSocket'
import useErrorHandler from '../hooks/useErrorHandler'

const Learning = () => {
  // State for learning session
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [sessionDuration, setSessionDuration] = useState(0)
  const [currentModule, setCurrentModule] = useState(null)
  const [learningProgress, setLearningProgress] = useState(0)
  
  // State for cognitive analysis
  const [cognitiveState, setCognitiveState] = useState({
    attention: 75,
    engagement: 70,
    fatigue: 30,
    mood: 'neutral',
    confusion: 20
  })
  
  // State for learning analytics
  const [learningStats, setLearningStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    totalTime: 0,
    modulesCompleted: 0
  })
  
  // State for camera analysis
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  
  // State for learning modules
  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState(null)
  const [moduleLoading, setModuleLoading] = useState(false)
  // Tutor specific
  const [roadmaps, setRoadmaps] = useState([])
  const [selectedRoadmap, setSelectedRoadmap] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [userId] = useState(() => localStorage.getItem('user_id') || null)
  
  // State for performance tracking
  const [performanceHistory, setPerformanceHistory] = useState([])
  const [currentPerformance, setCurrentPerformance] = useState({
    accuracy: 0,
    speed: 0,
    comprehension: 0
  })
  
  // State for adaptive learning
  const [learningRecommendations, setLearningRecommendations] = useState([])
  const [difficultyLevel, setDifficultyLevel] = useState('medium')
  
  // Refs and hooks
  const sessionTimerRef = useRef(null)
  const { error, handleAsync, clearError } = useErrorHandler()
  
  // WebSocket for real-time cognitive updates
  const { sendMessage, lastMessage, readyState } = useWebSocket(
    `ws://localhost:5000/ws/learning/${Date.now()}`,
    {
      onMessage: (data) => {
        if (data.type === 'cognitive_update') {
          setCognitiveState(data.cognitiveState)
        } else if (data.type === 'performance_update') {
          setCurrentPerformance(data.performance)
        }
      }
    }
  )

  // Load learning modules on mount
  useEffect(() => {
    loadLearningModules()
    loadLearningStats()
    // hydrate tutor state if user is known
    ;(async () => {
      try {
        if (userId) {
          const res = await tutorAPI.getUserState(userId)
          if (res && res.data) {
            const st = res.data
            if (st.roadmap) setSelectedRoadmap(st.roadmap)
            if (st.nextChapter) setSelectedChapter(st.nextChapter)
            if (st.nextQuiz) setActiveQuiz(st.nextQuiz)
            if (st.progress) setLearningProgress(st.progress.percent || 0)
          }
        } else {
          loadRoadmaps()
        }
      } catch (e) {
        console.error('Hydration failed', e)
        loadRoadmaps()
      }
    })()
  }, [])

  // Session timer effect
  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      sessionTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000)
        setSessionDuration(elapsed)
      }, 1000)
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
        sessionTimerRef.current = null
      }
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current)
      }
    }
  }, [isSessionActive, sessionStartTime])

  // Load learning modules
  const loadLearningModules = async () => {
    try {
      setModuleLoading(true)
      const response = await learningAPI.getModules()
      setModules(response.data || [])
    } catch (error) {
      console.error('Failed to load learning modules:', error)
    } finally {
      setModuleLoading(false)
    }
  }

  // Load learning statistics
  const loadLearningStats = async () => {
    try {
      const response = await learningAPI.getStats()
      setLearningStats(response.data || {})
    } catch (error) {
      console.error('Failed to load learning stats:', error)
    }
  }

  // Load tutor roadmaps
  const loadRoadmaps = async () => {
    try {
      const res = await tutorAPI.listRoadmaps()
      setRoadmaps(res.data || [])
      if ((res.data || []).length > 0 && !selectedRoadmap) setSelectedRoadmap(res.data[0])
    } catch (err) {
      console.error('Failed to load roadmaps', err)
    }
  }

  const handleModuleCreated = (created) => {
    // Accept server response shape variations
    const roadmap = created.roadmap || created.data || created
    if (!roadmap) return
    setRoadmaps(prev => [roadmap, ...prev])
    setSelectedRoadmap(roadmap)
  }

  // Start learning session
  const startSession = useCallback(() => {
    setIsSessionActive(true)
    setSessionStartTime(Date.now())
    setSessionDuration(0)
    setLearningProgress(0)
    
    // Activate camera analysis
    setCameraActive(true)
    
    // Send session start message
    if (readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'session_start',
        timestamp: new Date().toISOString(),
        moduleId: selectedModule?.id
      })
    }
  }, [selectedModule, readyState, sendMessage])

  // Pause learning session
  const pauseSession = useCallback(() => {
    setIsSessionActive(false)
    
    // Send session pause message
    if (readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'session_pause',
        timestamp: new Date().toISOString(),
        duration: sessionDuration
      })
    }
  }, [readyState, sendMessage, sessionDuration])

  // End learning session
  const endSession = useCallback(async () => {
    setIsSessionActive(false)
    
    // Send session end message
    if (readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'session_end',
        timestamp: new Date().toISOString(),
        duration: sessionDuration,
        progress: learningProgress
      })
    }
    
    // Save session data
    try {
      await learningAPI.saveSession({
        moduleId: selectedModule?.id,
        duration: sessionDuration,
        progress: learningProgress,
        cognitiveState,
        performance: currentPerformance
      })
      
      // Reload stats
      loadLearningStats()
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }, [readyState, sendMessage, sessionDuration, learningProgress, selectedModule, cognitiveState, currentPerformance])

  // Handle cognitive state updates
  const handleCognitiveStateUpdate = useCallback((newState) => {
    setCognitiveState(newState)
    
    // Send cognitive update
    if (readyState === WebSocket.OPEN) {
      sendMessage({
        type: 'cognitive_update',
        timestamp: new Date().toISOString(),
        cognitiveState: newState
      })
    }
    
    // Generate learning recommendations based on cognitive state
    generateLearningRecommendations(newState)
  }, [readyState, sendMessage])

  // Generate learning recommendations
  const generateLearningRecommendations = useCallback((cognitiveState) => {
    const recommendations = []
    
    if (cognitiveState.attention < 50) {
      recommendations.push({
        type: 'attention',
        message: 'Your attention is low. Try taking a short break or switching to a different topic.',
        priority: 'high'
      })
    }
    
    if (cognitiveState.fatigue > 70) {
      recommendations.push({
        type: 'fatigue',
        message: 'You appear fatigued. Consider ending the session or taking a longer break.',
        priority: 'high'
      })
    }
    
    if (cognitiveState.confusion > 60) {
      recommendations.push({
        type: 'confusion',
        message: 'High confusion detected. Review previous concepts or ask for clarification.',
        priority: 'medium'
      })
    }
    
    if (cognitiveState.engagement < 40) {
      recommendations.push({
        type: 'engagement',
        message: 'Low engagement. Try interactive exercises or change your study environment.',
        priority: 'medium'
      })
    }
    
    setLearningRecommendations(recommendations)
  }, [])

  // Handle camera errors
  const handleCameraError = useCallback((error) => {
    setCameraError(error)
    setCameraActive(false)
  }, [])

  // Format session duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Mock performance data for charts
  const performanceData = [
    { time: '0m', attention: 75, engagement: 70, fatigue: 30 },
    { time: '5m', attention: 80, engagement: 75, fatigue: 35 },
    { time: '10m', attention: 85, engagement: 80, fatigue: 40 },
    { time: '15m', attention: 70, engagement: 65, fatigue: 50 },
    { time: '20m', attention: 75, engagement: 70, fatigue: 45 },
    { time: '25m', attention: 80, engagement: 75, fatigue: 40 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <BookOpen className="w-8 h-8 text-primary-500" />
            <span>Learning Dashboard</span>
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your learning progress with AI-powered cognitive analysis
          </p>
        </div>

        {/* Learning Session Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Learning Session
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isSessionActive ? (
                  <span className="text-green-500 font-medium">Active</span>
                ) : (
                  <span className="text-gray-500">Inactive</span>
                )}
              </div>
              {isSessionActive && (
                <div className="text-lg font-mono text-primary-600 dark:text-primary-400">
                  {formatDuration(sessionDuration)}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Module Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Learning Module
              </label>
              <select
                value={selectedModule?.id || ''}
                onChange={(e) => {
                  const module = modules.find(m => m.id === e.target.value)
                  setSelectedModule(module)
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={isSessionActive}
              >
                <option value="">Choose a module...</option>
                {modules.map(module => (
                  <option key={module.id} value={module.id}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Controls */}
            <div className="flex items-end space-x-3">
              {!isSessionActive ? (
                <button
                  onClick={startSession}
                  disabled={!selectedModule}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Session</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseSession}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={endSession}
                    className="btn-danger flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>End</span>
                  </button>
                </>
              )}
              <button onClick={async () => {
                try {
                  const gen = await tutorAPI.generateRoadmap({ subject: 'Foundations of AI', difficulty: 'beginner', chapters: 4 })
                  if (gen && gen.data && gen.data.roadmap) {
                    // hydrate using user-state
                    if (userId) {
                      const st = await tutorAPI.getUserState(userId)
                      if (st && st.data) {
                        const s = st.data
                        setSelectedRoadmap(s.roadmap)
                        setSelectedChapter(s.nextChapter)
                        setActiveQuiz(s.nextQuiz)
                        setLearningProgress(s.progress?.percent || 0)
                      }
                    }
                  }
                } catch (e) { console.error('Generate failed', e); alert('AI generation failed') }
              }} className="btn-secondary ml-2">Generate AI Roadmap</button>
            </div>

            {/* Progress Display */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                {learningProgress}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${learningProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Learning Content */}
          <div className="lg:col-span-2 space-y-6">
              {/* Module Picker */}
              <ModulePicker onCreated={handleModuleCreated} />
            {/* Current Module / Chapter Display */}
            {selectedRoadmap && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{selectedRoadmap.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedRoadmap.description}</p>
                    <Chapter chapter={selectedChapter || (selectedRoadmap.chapters && selectedRoadmap.chapters[0])} onStartQuiz={(ch) => setActiveQuiz((ch.quizzes && ch.quizzes[0]) || null)} />
                  </div>
                  <div>
                    <Roadmap roadmap={selectedRoadmap} onSelectChapter={(ch) => setSelectedChapter(ch)} selectedChapterId={selectedChapter?._id || selectedChapter?.id} />
                  </div>
                </div>
              </div>
            )}

            {/* Performance Charts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Learning Performance
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="attention" stroke="#8884d8" strokeWidth={2} name="Attention" />
                    <Line type="monotone" dataKey="engagement" stroke="#82ca9d" strokeWidth={2} name="Engagement" />
                    <Line type="monotone" dataKey="fatigue" stroke="#ffc658" strokeWidth={2} name="Fatigue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Active Quiz */}
            {activeQuiz && (
              <Quiz quiz={activeQuiz} onSubmit={({ score }) => {
                setLearningProgress(prev => Math.min(100, prev + Math.round(score / 10)))
                // close quiz
                setActiveQuiz(null)
                // refresh recommendations
                if (selectedRoadmap && userId) tutorAPI.recommendNext(selectedRoadmap._id || selectedRoadmap.id, userId).catch(() => {})
              }} />
            )}

            {/* Learning Recommendations */}
            {learningRecommendations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Learning Recommendations
                </h3>
                <div className="space-y-3">
                  {learningRecommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-l-4 ${
                        rec.priority === 'high'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-400'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} Alert
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {rec.message}
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          rec.priority === 'high'
                            ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                        }`}>
                          {rec.priority}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Roadmap Progress Chart */}
            {selectedRoadmap && (
              <ProgressChart percent={learningProgress} />
            )}
            {/* Cognitive State */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cognitive State
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Attention', value: cognitiveState.attention, icon: Eye, color: 'primary' },
                  { label: 'Engagement', value: cognitiveState.engagement, icon: Zap, color: 'success' },
                  { label: 'Fatigue', value: cognitiveState.fatigue, icon: Brain, color: 'warning' },
                  { label: 'Mood', value: cognitiveState.mood, icon: Heart, color: 'secondary', isText: true },
                  { label: 'Confusion', value: cognitiveState.confusion, icon: Target, color: 'danger' }
                ].map((metric) => {
                  const Icon = metric.icon
                  return (
                    <div key={metric.label} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 bg-${metric.color}-100 dark:bg-${metric.color}-900/30 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 text-${metric.color}-500`} />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {metric.label}
                        </span>
                      </div>
                      <div className={`text-lg font-semibold text-${metric.color}-600 dark:text-${metric.color}-400`}>
                        {metric.isText ? metric.value : `${metric.value}%`}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Learning Statistics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Learning Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Sessions</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {learningStats.totalSessions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Score</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {learningStats.averageScore}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Time</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(learningStats.totalTime / 60)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Modules Completed</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {learningStats.modulesCompleted}
                  </span>
                </div>
              </div>
            </div>

            {/* Camera Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cognitive Analysis
              </h3>
              <div className="text-center">
                <div className="w-full h-32 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-3">
                  <Camera className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Camera analysis placeholder
                </p>
                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    cameraActive
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  }`}
                >
                  {cameraActive ? 'Stop Analysis' : 'Start Analysis'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Learning