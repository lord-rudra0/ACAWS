import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Lightbulb, 
  BookOpen, 
  HelpCircle,
  Minimize2,
  Maximize2,
  RefreshCw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Zap,
  Brain,
  Camera,
  Mic,
  Volume2,
  Settings,
  Star,
  Target,
  TrendingUp,
  Eye,
  Heart
} from 'lucide-react'
import geminiService from '../services/geminiService'
import advancedMLService from '../services/advancedMLService'
import useErrorHandler from '../hooks/useErrorHandler'

const AITutorEnhanced = ({ 
  isOpen, 
  onToggle, 
  currentTopic = '', 
  cognitiveState = {}, 
  learningContext = {},
  userProfile = {},
  onLearningPathGenerated,
  onQuizGenerated
}) => {
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationId] = useState(`conv_${Date.now()}`)
  const [tutorMode, setTutorMode] = useState('adaptive')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [tutorPersonality, setTutorPersonality] = useState({
    enthusiasm: 0.8,
    patience: 0.9,
    technicality: 0.6,
    encouragement: 0.8
  })
  const [advancedFeatures, setAdvancedFeatures] = useState({
    imageAnalysis: true,
    voiceInteraction: true,
    predictiveInsights: true,
    personalizedQuizzes: true,
    learningPathGeneration: true
  })
  const [tutorAnalytics, setTutorAnalytics] = useState({
    totalInteractions: 0,
    averageResponseTime: 0,
    userSatisfaction: 0,
    topicsDiscussed: [],
    learningProgress: 0
  })
  
  const messagesEndRef = useRef(null)
  const speechRecognition = useRef(null)
  const { error, handleAsync, clearError } = useErrorHandler()

  const enhancedQuickActions = [
    { text: 'Explain this concept with examples', icon: Lightbulb, category: 'explanation', color: 'yellow' },
    { text: 'Generate a quiz on this topic', icon: Target, category: 'assessment', color: 'blue' },
    { text: 'Create a learning path for me', icon: TrendingUp, category: 'planning', color: 'green' },
    { text: 'Analyze my learning progress', icon: Brain, category: 'analysis', color: 'purple' },
    { text: 'Help me understand this better', icon: HelpCircle, category: 'help', color: 'red' },
    { text: 'Make this more interactive', icon: Zap, category: 'interactive', color: 'orange' },
    { text: 'Show me practical applications', icon: BookOpen, category: 'application', color: 'teal' },
    { text: 'Check my wellness and suggest breaks', icon: Heart, category: 'wellness', color: 'pink' }
  ]

  const tutorModes = [
    { id: 'adaptive', label: 'Adaptive', description: 'Adjusts to your cognitive state' },
    { id: 'socratic', label: 'Socratic', description: 'Guides through questions' },
    { id: 'encouraging', label: 'Encouraging', description: 'Motivational and supportive' },
    { id: 'technical', label: 'Technical', description: 'Detailed and precise' },
    { id: 'creative', label: 'Creative', description: 'Uses analogies and stories' }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeEnhancedConversation()
    }
  }, [isOpen, currentTopic, cognitiveState])

  useEffect(() => {
    initializeSpeechRecognition()
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop()
      }
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeEnhancedConversation = async () => {
    const welcomeMessage = await generateEnhancedWelcomeMessage()
    setMessages([welcomeMessage])
  }

  const generateEnhancedWelcomeMessage = async () => {
    try {
      const context = {
        currentTopic,
        cognitiveState,
        learningContext,
        userProfile,
        conversationId
      }
      
      const aiResponse = await geminiService.provideTutoringSupport(
        "Hello! I'm ready to start learning.",
        context,
        userProfile
      )
      
      return {
        id: Date.now(),
        text: aiResponse.response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'welcome',
        adaptations: generateCurrentAdaptations(),
        followUpQuestions: aiResponse.followUpQuestions,
        resources: aiResponse.resources,
        confidence: aiResponse.confidence
      }
    } catch (error) {
      console.error('Enhanced welcome generation failed:', error)
      return generateFallbackWelcome()
    }
  }

  const generateFallbackWelcome = () => {
    return {
      id: Date.now(),
      text: "Hello! I'm your enhanced AI tutor, powered by advanced machine learning and Google's Gemini AI. I can provide personalized explanations, generate custom quizzes, analyze your learning patterns, and much more. How can I help you learn today?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'welcome',
      adaptations: generateCurrentAdaptations()
    }
  }

  const generateCurrentAdaptations = () => {
    const adaptations = []
    const { attention = 50, confusion = 0, fatigue = 0, engagement = 50 } = cognitiveState

    if (confusion > 50) adaptations.push("Using simplified explanations")
    if (attention < 50) adaptations.push("Adding interactive elements")
    if (fatigue > 60) adaptations.push("Keeping responses concise")
    if (engagement < 40) adaptations.push("Increasing engagement strategies")

    return adaptations
  }

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
      conversationId
    }

    setMessages(prev => [...prev, userMessage])
    const messageToSend = currentMessage
    setCurrentMessage('')
    setIsTyping(true)

    // Update analytics
    setTutorAnalytics(prev => ({
      ...prev,
      totalInteractions: prev.totalInteractions + 1
    }))

    await handleAsync(async () => {
      const startTime = Date.now()
      
      // Determine message type and route to appropriate handler
      const messageType = analyzeMessageType(messageToSend)
      let aiResponse
      
      switch (messageType) {
        case 'quiz_request':
          aiResponse = await handleQuizRequest(messageToSend)
          break
        case 'learning_path_request':
          aiResponse = await handleLearningPathRequest(messageToSend)
          break
        case 'progress_analysis':
          aiResponse = await handleProgressAnalysis(messageToSend)
          break
        case 'image_analysis':
          aiResponse = await handleImageAnalysis(messageToSend)
          break
        default:
          aiResponse = await handleGeneralTutoring(messageToSend)
      }
      
      const responseTime = Date.now() - startTime
      
      // Update analytics
      setTutorAnalytics(prev => ({
        ...prev,
        averageResponseTime: (prev.averageResponseTime + responseTime) / 2,
        topicsDiscussed: [...new Set([...prev.topicsDiscussed, currentTopic].filter(Boolean))]
      }))
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse.response || aiResponse.explanation || aiResponse.analysis,
        sender: 'ai',
        timestamp: new Date(),
        type: messageType,
        suggestions: aiResponse.recommendations || [],
        adaptations: aiResponse.adaptations || [],
        confidence: aiResponse.confidence || 0.8,
        followUpQuestions: aiResponse.followUpQuestions || [],
        resources: aiResponse.resources || [],
        responseTime,
        enhancedData: aiResponse.enhancedData
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Handle special responses
      if (messageType === 'quiz_request' && aiResponse.questions) {
        if (onQuizGenerated) onQuizGenerated(aiResponse.questions)
      }
      
      if (messageType === 'learning_path_request' && aiResponse.learningPath) {
        if (onLearningPathGenerated) onLearningPathGenerated(aiResponse.learningPath)
      }
      
    }, {
      onError: (error) => {
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm experiencing some technical difficulties. Let me try a different approach to help you.",
          sender: 'ai',
          timestamp: new Date(),
          type: 'error',
          suggestions: [
            "Try rephrasing your question",
            "Check your internet connection",
            "Switch to a different tutor mode"
          ]
        }
        setMessages(prev => [...prev, errorMessage])
      },
      onFinally: () => {
        setIsTyping(false)
      }
    })
  }

  const analyzeMessageType = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('questions')) {
      return 'quiz_request'
    } else if (lowerMessage.includes('learning path') || lowerMessage.includes('study plan') || lowerMessage.includes('curriculum')) {
      return 'learning_path_request'
    } else if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing') || lowerMessage.includes('analyze')) {
      return 'progress_analysis'
    } else if (lowerMessage.includes('image') || lowerMessage.includes('picture') || lowerMessage.includes('visual')) {
      return 'image_analysis'
    } else {
      return 'general_tutoring'
    }
  }

  const handleQuizRequest = async (message) => {
    try {
      const difficulty = determineDifficultyFromMessage(message)
      const questionCount = extractQuestionCount(message) || 5
      
      const quizResponse = await geminiService.generateQuizQuestions(
        currentTopic || 'current topic',
        difficulty,
        cognitiveState,
        questionCount
      )
      
      return {
        response: `I've generated ${questionCount} ${difficulty} questions about ${currentTopic}. These are adapted to your current cognitive state.`,
        questions: quizResponse.questions,
        adaptations: [`Difficulty: ${quizResponse.adaptedDifficulty}`, 'Personalized to your learning style'],
        confidence: 0.9,
        enhancedData: {
          type: 'quiz',
          questions: quizResponse.questions,
          difficulty: quizResponse.adaptedDifficulty
        }
      }
    } catch (error) {
      console.error('Quiz generation failed:', error)
      return {
        response: "I'd be happy to create a quiz for you! However, I'm having trouble generating questions right now. Let me help you in another way.",
        suggestions: ["Try asking for explanations instead", "Request practice problems", "Ask for concept review"]
      }
    }
  }

  const handleLearningPathRequest = async (message) => {
    try {
      const subject = extractSubjectFromMessage(message) || currentTopic
      const goals = extractGoalsFromMessage(message)
      const currentLevel = userProfile.experienceLevel || 'intermediate'
      const learningStyle = userProfile.learningStyle || 'visual'
      
      const pathResponse = await geminiService.generateLearningPath(
        subject,
        currentLevel,
        goals,
        learningStyle
      )
      
      return {
        response: `I've created a personalized learning path for ${subject}! This path is tailored to your ${learningStyle} learning style and ${currentLevel} level.`,
        learningPath: pathResponse.learningPath,
        adaptations: ['Personalized to your learning style', 'Adapted to your experience level'],
        confidence: 0.85,
        enhancedData: {
          type: 'learning_path',
          path: pathResponse.learningPath,
          duration: pathResponse.estimatedDuration,
          checkpoints: pathResponse.adaptiveCheckpoints
        }
      }
    } catch (error) {
      console.error('Learning path generation failed:', error)
      return {
        response: "I'd love to create a learning path for you! Could you tell me more about what subject you'd like to focus on and your learning goals?",
        followUpQuestions: [
          "What subject would you like to study?",
          "What's your current experience level?",
          "What are your learning goals?"
        ]
      }
    }
  }

  const handleProgressAnalysis = async (message) => {
    try {
      const progressData = {
        averageAttention: cognitiveState.attention || 50,
        averagePerformance: learningContext.averageScore || 70,
        studyStreak: learningContext.studyStreak || 0,
        completedModules: learningContext.completedModules || 0,
        totalStudyTime: learningContext.totalStudyTime || 0
      }
      
      const cognitiveHistory = learningContext.cognitiveHistory || []
      
      const analysisResponse = await geminiService.analyzeStudentProgress(
        progressData,
        cognitiveHistory
      )
      
      return {
        response: analysisResponse.analysis,
        insights: analysisResponse.insights,
        recommendations: analysisResponse.recommendations,
        confidence: 0.85,
        enhancedData: {
          type: 'progress_analysis',
          insights: analysisResponse.insights,
          riskFactors: analysisResponse.riskFactors
        }
      }
    } catch (error) {
      console.error('Progress analysis failed:', error)
      return {
        response: "I can see you're interested in analyzing your progress! Based on your recent activity, you're making good progress. Keep up the consistent effort!",
        suggestions: ["Continue with current study schedule", "Try more challenging content", "Focus on areas needing improvement"]
      }
    }
  }

  const handleImageAnalysis = async (message) => {
    try {
      // This would handle image uploads and analysis
      return {
        response: "I can analyze educational images to help explain concepts! Please upload an image and I'll provide detailed insights about the content.",
        suggestions: ["Upload a diagram or chart", "Share a screenshot of confusing content", "Show me a problem you're working on"]
      }
    } catch (error) {
      return {
        response: "Image analysis is temporarily unavailable, but I can still help explain concepts through text!"
      }
    }
  }

  const handleGeneralTutoring = async (message) => {
    try {
      const context = {
        currentTopic,
        cognitiveState,
        learningContext,
        conversationId,
        tutorMode,
        tutorPersonality
      }
      
      const tutorResponse = await geminiService.provideTutoringSupport(
        message,
        context,
        userProfile
      )
      
      return tutorResponse
    } catch (error) {
      console.error('General tutoring failed:', error)
      return generateFallbackResponse(message)
    }
  }

  const generateFallbackResponse = (message) => {
    const fallbackResponses = [
      "That's a great question! Let me think about the best way to explain this concept to you.",
      "I understand you're looking for help with this topic. Based on your learning style, I'd suggest approaching it this way...",
      "Excellent question! This is actually a key concept that many students find challenging. Let me break it down for you.",
      "I can see you're engaged with this material! Let me provide some additional insights that might help."
    ]
    
    return {
      response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      confidence: 0.6,
      suggestions: ["Try asking more specific questions", "Request examples or analogies", "Ask for step-by-step explanations"]
    }
  }

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      speechRecognition.current = new SpeechRecognition()
      
      speechRecognition.current.continuous = false
      speechRecognition.current.interimResults = false
      speechRecognition.current.lang = 'en-US'
      
      speechRecognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setCurrentMessage(transcript)
        setIsListening(false)
      }
      
      speechRecognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        if (window.toast) {
          window.toast.error('Voice recognition failed. Please try again.')
        }
      }
      
      speechRecognition.current.onend = () => {
        setIsListening(false)
      }
    }
  }

  const toggleVoiceInput = () => {
    if (!speechRecognition.current) {
      if (window.toast) {
        window.toast.warning('Voice input not supported in this browser')
      }
      return
    }
    
    if (isListening) {
      speechRecognition.current.stop()
      setIsListening(false)
    } else {
      speechRecognition.current.start()
      setIsListening(true)
    }
  }

  const speakResponse = (text) => {
    if ('speechSynthesis' in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 0.8
      
      // Try to use a pleasant voice
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || voice.name.includes('Microsoft')
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  const handleQuickAction = async (actionText, category) => {
    setCurrentMessage(actionText)
    
    // Add visual feedback for the selected action
    const actionMessage = {
      id: Date.now(),
      text: actionText,
      sender: 'user',
      timestamp: new Date(),
      category,
      isQuickAction: true
    }
    
    setMessages(prev => [...prev, actionMessage])
    setCurrentMessage('')
    setIsTyping(true)
    
    // Handle special quick actions
    if (category === 'assessment') {
      await handleQuizRequest(actionText)
    } else if (category === 'planning') {
      await handleLearningPathRequest(actionText)
    } else if (category === 'analysis') {
      await handleProgressAnalysis(actionText)
    } else {
      await handleGeneralTutoring(actionText)
    }
    
    setIsTyping(false)
  }

  const generatePersonalizedExplanation = async (topic) => {
    try {
      const explanation = await geminiService.generatePersonalizedExplanation(
        topic,
        userProfile,
        cognitiveState
      )
      
      const explanationMessage = {
        id: Date.now(),
        text: explanation.explanation,
        sender: 'ai',
        timestamp: new Date(),
        type: 'personalized_explanation',
        adaptations: explanation.adaptations,
        confidence: explanation.confidence,
        isPersonalized: true
      }
      
      setMessages(prev => [...prev, explanationMessage])
    } catch (error) {
      console.error('Personalized explanation failed:', error)
    }
  }

  const analyzeCurrentLearningState = async () => {
    try {
      const prediction = await advancedMLService.predictLearningOutcome(
        userProfile,
        learningContext.currentModule || {},
        learningContext.cognitiveHistory || []
      )
      
      const analysisMessage = {
        id: Date.now(),
        text: `Based on my advanced analysis, I predict your performance will be ${Math.round(prediction.predictedScore)}% for this session. Here's what I recommend...`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'learning_analysis',
        enhancedData: prediction,
        recommendations: prediction.recommendations,
        confidence: prediction.confidence
      }
      
      setMessages(prev => [...prev, analysisMessage])
    } catch (error) {
      console.error('Learning state analysis failed:', error)
    }
  }

  const rateResponse = (messageId, rating) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, userRating: rating, ratedAt: new Date() }
        : msg
    ))
    
    // Update satisfaction analytics
    setTutorAnalytics(prev => ({
      ...prev,
      userSatisfaction: rating === 'positive' ? 
        Math.min(5, prev.userSatisfaction + 0.1) : 
        Math.max(1, prev.userSatisfaction - 0.1)
    }))
    
    // Send feedback to improve AI
    console.log('Response rated:', { messageId, rating, conversationId })
  }

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        if (window.toast) {
          window.toast.success('Message copied to clipboard')
        }
      })
      .catch(err => console.error('Failed to copy message:', err))
  }

  const exportConversation = () => {
    const conversationData = {
      conversationId,
      messages: messages.map(msg => ({
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        type: msg.type
      })),
      analytics: tutorAnalytics,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(conversationData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-tutor-conversation-${conversationId}.json`
    link.click()
  }

  // Helper functions
  const determineDifficultyFromMessage = (message) => {
    if (message.includes('easy') || message.includes('simple')) return 'easy'
    if (message.includes('hard') || message.includes('challenging') || message.includes('advanced')) return 'hard'
    return 'medium'
  }

  const extractQuestionCount = (message) => {
    const match = message.match(/(\d+)\s*(question|quiz)/i)
    return match ? parseInt(match[1]) : null
  }

  const extractSubjectFromMessage = (message) => {
    const subjects = ['machine learning', 'computer vision', 'deep learning', 'neural networks', 'ai', 'python', 'javascript']
    return subjects.find(subject => message.toLowerCase().includes(subject))
  }

  const extractGoalsFromMessage = (message) => {
    const goalKeywords = ['learn', 'understand', 'master', 'improve', 'practice']
    const goals = []
    
    goalKeywords.forEach(keyword => {
      if (message.toLowerCase().includes(keyword)) {
        goals.push(`${keyword} the concepts`)
      }
    })
    
    return goals.length > 0 ? goals.join(', ') : 'comprehensive understanding'
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
        isMinimized ? 'w-80 h-20' : 'w-[480px] h-[700px]'
      } transition-all duration-300`}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Enhanced AI Tutor</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tutorMode.charAt(0).toUpperCase() + tutorMode.slice(1)} • Gemini Powered
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              voiceEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
            title="Toggle voice responses"
          >
            <Volume2 className="w-4 h-4" />
          </button>
          
          <select
            value={tutorMode}
            onChange={(e) => setTutorMode(e.target.value)}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            {tutorModes.map(mode => (
              <option key={mode.id} value={mode.id}>{mode.label}</option>
            ))}
          </select>
          
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          
          <button
            onClick={onToggle}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Enhanced Cognitive State Indicator */}
          {Object.keys(cognitiveState).length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-blue-500" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Attention: {Math.round(cognitiveState.attention || 50)}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3 text-purple-500" />
                    <span className="text-purple-700 dark:text-purple-300">
                      Engagement: {Math.round(cognitiveState.engagement || 50)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={analyzeCurrentLearningState}
                  className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  Analyze State
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? message.isQuickAction 
                        ? 'bg-secondary-500 text-white'
                        : 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {message.sender === 'ai' && (
                        <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        
                        {/* Enhanced Data Display */}
                        {message.enhancedData && (
                          <div className="mt-3 p-3 bg-white/10 rounded-lg">
                            {message.enhancedData.type === 'quiz' && (
                              <div>
                                <p className="text-xs font-medium mb-2">📝 Quiz Generated</p>
                                <p className="text-xs">{message.enhancedData.questions?.length || 0} questions • {message.enhancedData.difficulty} difficulty</p>
                              </div>
                            )}
                            
                            {message.enhancedData.type === 'learning_path' && (
                              <div>
                                <p className="text-xs font-medium mb-2">🗺️ Learning Path Created</p>
                                <p className="text-xs">{message.enhancedData.path?.length || 0} modules • {Math.round(message.enhancedData.duration / 60)} hours</p>
                              </div>
                            )}
                            
                            {message.enhancedData.type === 'progress_analysis' && (
                              <div>
                                <p className="text-xs font-medium mb-2">📊 Progress Analysis</p>
                                <p className="text-xs">{message.enhancedData.insights?.length || 0} insights generated</p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Adaptations */}
                        {message.adaptations && message.adaptations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.adaptations.map((adaptation, index) => (
                              <div key={index} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                🔧 {adaptation}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <div key={index} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                💡 {suggestion}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Follow-up Questions */}
                        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.followUpQuestions.map((question, index) => (
                              <button
                                key={index}
                                onClick={() => handleQuickAction(question, 'follow_up')}
                                className="block text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                              >
                                ❓ {question}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Resources */}
                        {message.resources && message.resources.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.resources.map((resource, index) => (
                              <div key={index} className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                📚 {resource.title}: {resource.description || resource.text}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Enhanced Message Actions */}
                        {message.sender === 'ai' && (
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => rateResponse(message.id, 'positive')}
                                className={`p-1 rounded transition-colors ${
                                  message.userRating === 'positive' 
                                    ? 'text-green-500 bg-green-100 dark:bg-green-900/30' 
                                    : 'text-gray-400 hover:text-green-500'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => rateResponse(message.id, 'negative')}
                                className={`p-1 rounded transition-colors ${
                                  message.userRating === 'negative' 
                                    ? 'text-red-500 bg-red-100 dark:bg-red-900/30' 
                                    : 'text-gray-400 hover:text-red-500'
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                              
                              {voiceEnabled && (
                                <button
                                  onClick={() => speakResponse(message.text)}
                                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                  title="Speak response"
                                >
                                  <Volume2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {message.confidence && (
                                <span className="text-xs text-gray-500">
                                  {Math.round(message.confidence * 100)}%
                                </span>
                              )}
                              <button
                                onClick={() => copyMessage(message.text)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Enhanced Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quick Actions */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3">
              {enhancedQuickActions.slice(0, 6).map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text, action.category)}
                    className={`flex items-center space-x-1 px-3 py-1 bg-${action.color}-100 dark:bg-${action.color}-900/20 text-${action.color}-700 dark:text-${action.color}-300 rounded-full text-xs hover:bg-${action.color}-200 dark:hover:bg-${action.color}-900/30 transition-colors`}
                    disabled={isTyping}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{action.text.split(' ').slice(0, 2).join(' ')}</span>
                  </button>
                )
              })}
            </div>
            
            {/* Advanced Actions */}
            <div className="flex justify-between mb-3">
              <button
                onClick={() => generatePersonalizedExplanation(currentTopic)}
                className="text-xs bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full hover:from-primary-200 hover:to-secondary-200 transition-all"
                disabled={isTyping}
              >
                🎯 Personalized Explanation
              </button>
              
              <button
                onClick={exportConversation}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                📄 Export Chat
              </button>
            </div>
          </div>

          {/* Enhanced Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && sendMessage()}
                placeholder="Ask your enhanced AI tutor anything..."
                className="flex-1 input-field text-sm"
                disabled={isTyping}
                maxLength={1000}
              />
              
              {speechRecognition.current && (
                <button
                  onClick={toggleVoiceInput}
                  disabled={isTyping}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
              
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Enhanced Status Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-3">
                <span>{currentMessage.length}/1000</span>
                <span>•</span>
                <span>{tutorAnalytics.totalInteractions} interactions</span>
                {tutorAnalytics.userSatisfaction > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{tutorAnalytics.userSatisfaction.toFixed(1)}</span>
                    </div>
                  </>
                )}
              </div>
              
              {error && (
                <button
                  onClick={clearError}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  Clear Error
                </button>
              )}
            </div>
            
            {error && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300">
                {error.message}
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}

export default AITutorEnhanced