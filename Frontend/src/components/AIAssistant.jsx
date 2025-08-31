import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  MessageCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  Settings,
  Minimize2,
  Maximize2,
  Download,
  RefreshCw,
  Star,
  Zap,
  Eye,
  Heart,
  BookOpen,
  Users,
  Award,
  Clock,
  Send,
  Copy,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import useAIFeatures from '../hooks/useAIFeatures'
import { useAuth } from '../contexts/AuthContext'

const AIAssistant = ({ 
  isOpen, 
  onToggle, 
  currentContext = {},
  onInsightGenerated,
  onRecommendationApplied 
}) => {
  const { user } = useAuth()
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [assistantMode, setAssistantMode] = useState('comprehensive')
  const [conversationHistory, setConversationHistory] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [assistantPersonality, setAssistantPersonality] = useState({
    helpfulness: 0.9,
    enthusiasm: 0.8,
    patience: 0.9,
    technicality: 0.7
  })
  
  const messagesEndRef = useRef(null)
  const speechRecognition = useRef(null)
  
  const {
    aiState,
    tutoringSession,
    aiInsights,
    recommendations,
    startTutoringSession,
    sendTutoringMessage,
    generateIntelligentContent,
    generatePersonalizedQuiz,
    getAIRecommendations,
    updateContext,
    error,
    clearError
  } = useAIFeatures(user?.id, currentContext)

  const assistantModes = [
    { id: 'comprehensive', label: 'Comprehensive', description: 'Full AI capabilities' },
    { id: 'tutoring', label: 'Tutoring Focus', description: 'Educational support' },
    { id: 'wellness', label: 'Wellness Focus', description: 'Health and wellness' },
    { id: 'performance', label: 'Performance', description: 'Learning optimization' },
    { id: 'creative', label: 'Creative', description: 'Creative learning approaches' }
  ]

  const quickActions = [
    { 
      text: 'Explain this concept simply', 
      icon: Lightbulb, 
      category: 'explanation',
      color: 'yellow',
      aiFeature: 'content_generation'
    },
    { 
      text: 'Generate a personalized quiz', 
      icon: Target, 
      category: 'assessment',
      color: 'blue',
      aiFeature: 'quiz_generation'
    },
    { 
      text: 'Analyze my learning progress', 
      icon: TrendingUp, 
      category: 'analysis',
      color: 'green',
      aiFeature: 'performance_analysis'
    },
    { 
      text: 'Create a learning path', 
      icon: BookOpen, 
      category: 'planning',
      color: 'purple',
      aiFeature: 'path_generation'
    },
    { 
      text: 'Check my wellness state', 
      icon: Heart, 
      category: 'wellness',
      color: 'red',
      aiFeature: 'wellness_analysis'
    },
    { 
      text: 'Optimize my study schedule', 
      icon: Clock, 
      category: 'optimization',
      color: 'orange',
      aiFeature: 'schedule_optimization'
    },
    { 
      text: 'Connect with study groups', 
      icon: Users, 
      category: 'social',
      color: 'teal',
      aiFeature: 'social_learning'
    },
    { 
      text: 'Predict my performance', 
      icon: Brain, 
      category: 'prediction',
      color: 'indigo',
      aiFeature: 'outcome_prediction'
    }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [conversationHistory])

  useEffect(() => {
    updateContext(currentContext)
  }, [currentContext, updateContext])

  useEffect(() => {
    initializeSpeechRecognition()
    return () => {
      if (speechRecognition.current) {
        speechRecognition.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen && conversationHistory.length === 0) {
      initializeConversation()
    }
  }, [isOpen, assistantMode])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    try {
      if (!tutoringSession) {
        const session = await startTutoringSession(currentContext)
        if (session.welcomeMessage) {
          setConversationHistory([session.welcomeMessage])
        }
      }
    } catch (error) {
      console.error('Conversation initialization failed:', error)
      setConversationHistory([{
        id: Date.now(),
        text: "Hello! I'm your AI assistant, ready to help with learning, wellness, and performance optimization. How can I assist you today?",
        sender: 'ai_assistant',
        timestamp: new Date(),
        type: 'welcome'
      }])
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

  const sendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      text: currentMessage,
      sender: 'user',
      timestamp: new Date(),
      mode: assistantMode
    }

    setConversationHistory(prev => [...prev, userMessage])
    const messageToSend = currentMessage
    setCurrentMessage('')
    setIsTyping(true)

    try {
      let response

      if (tutoringSession) {
        response = await sendTutoringMessage(messageToSend, currentContext)
        
        const aiMessage = {
          id: Date.now() + 1,
          text: response.response.text,
          sender: 'ai_assistant',
          timestamp: new Date(),
          type: response.response.type,
          adaptations: response.response.adaptations || [],
          recommendations: response.nextRecommendations || [],
          confidence: response.response.confidence || 0.8,
          insights: response.followUpInsights || [],
          sessionProgress: response.sessionProgress
        }

        setConversationHistory(prev => [...prev, aiMessage])
        
        if (response.followUpInsights && onInsightGenerated) {
          onInsightGenerated(response.followUpInsights)
        }
      } else {
        // Handle without active tutoring session
        response = await handleGeneralAssistance(messageToSend)
        setConversationHistory(prev => [...prev, response])
      }

    } catch (error) {
      console.error('Message sending failed:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm experiencing some technical difficulties. Let me try to help you in a different way.",
        sender: 'ai_assistant',
        timestamp: new Date(),
        type: 'error',
        error: error.message
      }
      setConversationHistory(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleGeneralAssistance = async (message) => {
    try {
      const messageType = analyzeMessageType(message)
      let response

      switch (messageType) {
        case 'content_request':
          response = await generateIntelligentContent(message, { mode: assistantMode })
          break
        case 'quiz_request':
          response = await generatePersonalizedQuiz(
            currentContext.currentTopic || 'current topic',
            'medium',
            5
          )
          break
        case 'recommendations_request':
          response = await getAIRecommendations(currentContext)
          break
        default:
          response = await generateGeneralResponse(message)
      }

      return {
        id: Date.now() + 1,
        text: formatResponseText(response, messageType),
        sender: 'ai_assistant',
        timestamp: new Date(),
        type: messageType,
        data: response,
        confidence: response.confidence || 0.7
      }
    } catch (error) {
      console.error('General assistance failed:', error)
      return {
        id: Date.now() + 1,
        text: "I'm here to help! Could you tell me more about what you need assistance with?",
        sender: 'ai_assistant',
        timestamp: new Date(),
        type: 'fallback',
        confidence: 0.5
      }
    }
  }

  const analyzeMessageType = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('questions')) {
      return 'quiz_request'
    } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('advice')) {
      return 'recommendations_request'
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('teach') || lowerMessage.includes('learn')) {
      return 'content_request'
    } else {
      return 'general_query'
    }
  }

  const formatResponseText = (response, messageType) => {
    switch (messageType) {
      case 'content_request':
        return response.explanation?.explanation || response.content || 'Here\'s what I can tell you about that topic...'
      case 'quiz_request':
        return `I've generated ${response.questions?.length || 0} personalized questions for you!`
      case 'recommendations_request':
        return `I have ${response.length || 0} recommendations based on your current state and learning patterns.`
      default:
        return response.text || response.message || 'I\'m here to help with your learning journey!'
    }
  }

  const generateGeneralResponse = async (message) => {
    const responses = [
      "That's an excellent question! Let me provide you with a comprehensive answer...",
      "I understand what you're looking for. Based on your learning profile, here's my recommendation...",
      "Great topic to explore! This connects to several important concepts in your learning journey...",
      "I can help you with that! Let me break this down in a way that matches your learning style..."
    ]
    
    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      confidence: 0.6
    }
  }

  const handleQuickAction = async (action) => {
    setCurrentMessage(action.text)
    
    // Add visual feedback
    const actionMessage = {
      id: Date.now(),
      text: action.text,
      sender: 'user',
      timestamp: new Date(),
      isQuickAction: true,
      category: action.category,
      aiFeature: action.aiFeature
    }
    
    setConversationHistory(prev => [...prev, actionMessage])
    setCurrentMessage('')
    setIsTyping(true)
    
    try {
      let response
      
      switch (action.aiFeature) {
        case 'content_generation':
          response = await generateIntelligentContent(
            currentContext.currentTopic || 'current topic',
            { simplificationLevel: 'high' }
          )
          break
        case 'quiz_generation':
          response = await generatePersonalizedQuiz(
            currentContext.currentTopic || 'current topic',
            'medium',
            5
          )
          break
        case 'performance_analysis':
          response = await getAIRecommendations(currentContext)
          break
        case 'path_generation':
          response = await generateLearningPath(
            currentContext.currentTopic || 'machine learning',
            'comprehensive understanding'
          )
          break
        default:
          if (tutoringSession) {
            const tutoringResponse = await sendTutoringMessage(action.text, currentContext)
            response = tutoringResponse.response
          } else {
            response = await generateGeneralResponse(action.text)
          }
      }
      
      const aiMessage = {
        id: Date.now() + 1,
        text: formatResponseText(response, action.category),
        sender: 'ai_assistant',
        timestamp: new Date(),
        type: action.category,
        aiFeature: action.aiFeature,
        data: response,
        confidence: response.confidence || 0.7,
        quickActionResponse: true
      }
      
      setConversationHistory(prev => [...prev, aiMessage])
      
    } catch (error) {
      console.error('Quick action failed:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: `I encountered an issue with that request. Let me try a different approach to help you.`,
        sender: 'ai_assistant',
        timestamp: new Date(),
        type: 'error'
      }
      setConversationHistory(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
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

  const rateResponse = (messageId, rating) => {
    setConversationHistory(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, userRating: rating, ratedAt: new Date() }
        : msg
    ))
    
    if (window.toast) {
      window.toast.success(rating === 'positive' ? 'Thanks for the feedback!' : 'I\'ll try to improve!')
    }
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
    const exportData = {
      conversationHistory,
      assistantMode,
      aiState,
      currentContext,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ai-assistant-conversation-${Date.now()}.json`
    link.click()
  }

  const clearConversation = () => {
    setConversationHistory([])
    initializeConversation()
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
        isMinimized ? 'w-80 h-20' : 'w-[500px] h-[700px]'
      } transition-all duration-300`}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                aiState.isInitialized ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {assistantMode.charAt(0).toUpperCase() + assistantMode.slice(1)} Mode
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
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <select
            value={assistantMode}
            onChange={(e) => setAssistantMode(e.target.value)}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            {assistantModes.map(mode => (
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
          {/* AI Status Indicator */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <Brain className="w-3 h-3 text-blue-500" />
                  <span className="text-blue-700 dark:text-blue-300">
                    AI Services: {Object.values(aiState.services).filter(s => s === 'ready').length}/4
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700 dark:text-purple-300">
                    Features: {aiState.activeFeatures.size} active
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round(aiState.performance.accuracy * 100)}% accuracy
                </span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
            <AnimatePresence>
              {conversationHistory.map((message) => (
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
                      {message.sender === 'ai_assistant' && (
                        <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        
                        {/* AI Feature Indicator */}
                        {message.aiFeature && (
                          <div className="mt-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            🤖 {message.aiFeature.replace(/_/g, ' ')}
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
                        
                        {/* Recommendations */}
                        {message.recommendations && message.recommendations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.recommendations.slice(0, 2).map((rec, index) => (
                              <div key={index} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                💡 {rec.message || rec.text || rec}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Session Progress */}
                        {message.sessionProgress && (
                          <div className="mt-2 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            📊 Progress: {Math.round(message.sessionProgress.overallProgress)}% • 
                            Concepts: {message.sessionProgress.conceptsExplored}
                          </div>
                        )}

                        {/* Enhanced Message Actions */}
                        {message.sender === 'ai_assistant' && (
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">AI is processing...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quick Actions */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickActions.slice(0, 6).map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className={`flex items-center space-x-1 px-3 py-1 bg-${action.color}-100 dark:bg-${action.color}-900/20 text-${action.color}-700 dark:text-${action.color}-300 rounded-full text-xs hover:bg-${action.color}-200 dark:hover:bg-${action.color}-900/30 transition-colors`}
                    disabled={isTyping}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{action.text.split(' ').slice(0, 2).join(' ')}</span>
                  </button>
                )
              })}
            </div>
            
            {/* Advanced Controls */}
            <div className="flex justify-between mb-3">
              <div className="flex space-x-2">
                <button
                  onClick={clearConversation}
                  className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  🔄 New Chat
                </button>
                
                <button
                  onClick={exportConversation}
                  className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                >
                  📄 Export
                </button>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {conversationHistory.length} messages • {aiInsights.length} insights
              </div>
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
                placeholder="Ask your AI assistant anything..."
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
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                <span>{Math.round(aiState.performance.responseTime)}ms avg</span>
                {tutoringSession && (
                  <>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Tutoring Active</span>
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

export default AIAssistant