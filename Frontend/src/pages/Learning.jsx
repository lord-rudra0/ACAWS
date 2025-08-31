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
  Zap
} from 'lucide-react'
import Webcam from 'react-webcam'

const Learning = () => {
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [currentModule, setCurrentModule] = useState(null)
  const [cognitiveState, setCognitiveState] = useState({
    attention: 85,
    confusion: 15,
    engagement: 92,
    fatigue: 20
  })
  const [adaptiveContent, setAdaptiveContent] = useState({
    difficulty: 'medium',
    explanation: 'standard',
    interactivity: 'moderate'
  })
  const [sessionTime, setSessionTime] = useState(0)
  const [showAITutor, setShowAITutor] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  
  const webcamRef = useRef(null)
  const intervalRef = useRef(null)

  const learningModules = [
    {
      id: 1,
      title: 'Introduction to Machine Learning',
      description: 'Fundamentals of ML algorithms and applications',
      difficulty: 'beginner',
      duration: '45 min',
      progress: 75,
      topics: ['Supervised Learning', 'Unsupervised Learning', 'Neural Networks']
    },
    {
      id: 2,
      title: 'Deep Learning Fundamentals',
      description: 'Understanding neural networks and deep learning',
      difficulty: 'intermediate',
      duration: '60 min',
      progress: 30,
      topics: ['CNNs', 'RNNs', 'Transformers']
    },
    {
      id: 3,
      title: 'Computer Vision Applications',
      description: 'Image processing and computer vision techniques',
      difficulty: 'advanced',
      duration: '90 min',
      progress: 0,
      topics: ['Image Classification', 'Object Detection', 'Face Recognition']
    }
  ]

  useEffect(() => {
    if (isSessionActive) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1)
        analyzeCognitiveState()
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isSessionActive])

  const analyzeCognitiveState = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        try {
          // Simulate ML analysis - in real implementation, this would call Python backend
          const mockAnalysis = {
            attention: Math.max(0, Math.min(100, cognitiveState.attention + (Math.random() - 0.5) * 10)),
            confusion: Math.max(0, Math.min(100, cognitiveState.confusion + (Math.random() - 0.5) * 8)),
            engagement: Math.max(0, Math.min(100, cognitiveState.engagement + (Math.random() - 0.5) * 6)),
            fatigue: Math.max(0, Math.min(100, cognitiveState.fatigue + (Math.random() - 0.5) * 4))
          }
          
          setCognitiveState(mockAnalysis)
          adaptLearningContent(mockAnalysis)
        } catch (error) {
          console.error('Cognitive analysis failed:', error)
        }
      }
    }
  }

  const adaptLearningContent = (state) => {
    let newContent = { ...adaptiveContent }

    // Adapt based on confusion level
    if (state.confusion > 70) {
      newContent.difficulty = 'easy'
      newContent.explanation = 'detailed'
      newContent.interactivity = 'high'
    } else if (state.confusion < 30) {
      newContent.difficulty = 'hard'
      newContent.explanation = 'concise'
      newContent.interactivity = 'moderate'
    }

    // Adapt based on attention level
    if (state.attention < 50) {
      newContent.interactivity = 'high'
    }

    // Adapt based on fatigue
    if (state.fatigue > 70) {
      // Suggest break
      showBreakReminder()
    }

    setAdaptiveContent(newContent)
  }

  const showBreakReminder = () => {
    // This would trigger a break reminder modal
    console.log('Break reminder triggered')
  }

  const startLearningSession = (module) => {
    setCurrentModule(module)
    setIsSessionActive(true)
    setSessionTime(0)
  }

  const pauseSession = () => {
    setIsSessionActive(false)
  }

  const endSession = () => {
    setIsSessionActive(false)
    setCurrentModule(null)
    setSessionTime(0)
  }

  const sendMessage = () => {
    if (currentMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        text: currentMessage,
        sender: 'user',
        timestamp: new Date()
      }
      
      setChatMessages(prev => [...prev, newMessage])
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          text: generateAIResponse(currentMessage),
          sender: 'ai',
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, aiResponse])
      }, 1000)
      
      setCurrentMessage('')
    }
  }

  const generateAIResponse = (message) => {
    const responses = [
      "That's a great question! Let me break it down for you...",
      "Based on your current learning progress, I'd suggest focusing on...",
      "I notice you might be confused about this concept. Let me explain it differently...",
      "Your attention seems high right now, so this is a perfect time to tackle challenging material!"
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Adaptive Learning Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered learning that adapts to your cognitive state in real-time
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Learning Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cognitive State Monitor */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Real-time Cognitive Analysis
                </h2>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isSessionActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Attention', value: cognitiveState.attention, color: 'primary', icon: Eye },
                  { label: 'Confusion', value: cognitiveState.confusion, color: 'warning', icon: Brain },
                  { label: 'Engagement', value: cognitiveState.engagement, color: 'success', icon: Target },
                  { label: 'Fatigue', value: cognitiveState.fatigue, color: 'error', icon: Timer }
                ].map((metric) => {
                  const Icon = metric.icon
                  return (
                    <div key={metric.label} className="text-center">
                      <div className={`w-12 h-12 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-xl flex items-center justify-center mx-auto mb-2`}>
                        <Icon className={`w-6 h-6 text-${metric.color}-500`} />
                      </div>
                      <div className={`text-2xl font-bold text-${metric.color}-500 mb-1`}>
                        {metric.value}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {metric.label}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Camera Feed */}
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
                  <Camera className="w-4 h-4 inline mr-1" />
                  Cognitive Analysis Active
                </div>
              </div>
            </motion.div>

            {/* Learning Modules */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Available Learning Modules
              </h2>
              
              <div className="space-y-4">
                {learningModules.map((module) => (
                  <div
                    key={module.id}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      currentModule?.id === module.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {module.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {module.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            module.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {module.difficulty}
                          </span>
                          <span>{module.duration}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => startLearningSession(module)}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{module.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${module.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Topics */}
                    <div className="flex flex-wrap gap-2">
                      {module.topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Active Session */}
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

                {/* Adaptive Content Display */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-6 rounded-xl mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-primary-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      Adaptive Content Mode
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                      <div className={`font-medium ${
                        adaptiveContent.difficulty === 'easy' ? 'text-green-600' :
                        adaptiveContent.difficulty === 'medium' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {adaptiveContent.difficulty.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Explanation:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {adaptiveContent.explanation.toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Interactivity:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {adaptiveContent.interactivity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <h3>Machine Learning Fundamentals</h3>
                  <p>
                    Machine learning is a subset of artificial intelligence that enables computers 
                    to learn and make decisions from data without being explicitly programmed for 
                    every scenario.
                  </p>
                  
                  {adaptiveContent.explanation === 'detailed' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
                      <p className="text-blue-800 dark:text-blue-200">
                        <strong>Detailed Explanation:</strong> Think of machine learning like teaching 
                        a child to recognize animals. Instead of describing every feature of every animal, 
                        you show them many pictures of cats and dogs. Eventually, they learn to distinguish 
                        between them on their own.
                      </p>
                    </div>
                  )}

                  {adaptiveContent.interactivity === 'high' && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
                      <h4 className="text-green-800 dark:text-green-200 mb-2">Interactive Quiz</h4>
                      <p className="text-green-700 dark:text-green-300 mb-3">
                        Which of the following is an example of supervised learning?
                      </p>
                      <div className="space-y-2">
                        {['Email spam detection', 'Customer segmentation', 'Anomaly detection'].map((option, index) => (
                          <button
                            key={index}
                            className="block w-full text-left p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Tutor */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Tutor
                </h3>
                <button
                  onClick={() => setShowAITutor(!showAITutor)}
                  className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>

              {showAITutor && (
                <div className="space-y-4">
                  <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Ask me anything about your learning!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs p-3 rounded-lg ${
                                message.sender === 'user'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white'
                              }`}
                            >
                              {message.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Ask your AI tutor..."
                      className="flex-1 input-field"
                    />
                    <button
                      onClick={sendMessage}
                      className="btn-primary px-4"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Learning Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Learning
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Timer className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-600 dark:text-gray-400">Study Time</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    2h 34m
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-success-500" />
                    <span className="text-gray-600 dark:text-gray-400">Modules Completed</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    3/5
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-warning-500" />
                    <span className="text-gray-600 dark:text-gray-400">Points Earned</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    1,250
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button className="w-full flex items-center space-x-3 p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                  <Lightbulb className="w-5 h-5" />
                  <span>Simplify Explanation</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors">
                  <BookOpen className="w-5 h-5" />
                  <span>Additional Resources</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 rounded-lg hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors">
                  <TrendingUp className="w-5 h-5" />
                  <span>View Progress</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Learning