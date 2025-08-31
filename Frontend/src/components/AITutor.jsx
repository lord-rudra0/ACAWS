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
  Zap
} from 'lucide-react'
import useErrorHandler from '../hooks/useErrorHandler'

const AITutor = ({ isOpen, onToggle, currentTopic = '', cognitiveState = {}, learningContext = {} }) => {
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [conversationId] = useState(`conv_${Date.now()}`)
  const [tutorPersonality, setTutorPersonality] = useState('adaptive') // adaptive, encouraging, technical
  const messagesEndRef = useRef(null)
  const { error, handleAsync, clearError } = useErrorHandler()

  const quickActions = [
    { text: 'Explain this concept simply', icon: Lightbulb, category: 'explanation' },
    { text: 'Give me a practical example', icon: BookOpen, category: 'example' },
    { text: 'I need help understanding', icon: HelpCircle, category: 'help' },
    { text: 'Make this more interactive', icon: Zap, category: 'interactive' },
    { text: 'Break this down step by step', icon: MessageCircle, category: 'breakdown' },
    { text: 'Quiz me on this topic', icon: Brain, category: 'assessment' }
  ]

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeConversation()
    }
  }, [isOpen, currentTopic, cognitiveState])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = () => {
    const welcomeMessage = generateWelcomeMessage()
    setMessages([welcomeMessage])
  }

  const generateWelcomeMessage = () => {
    const attention = cognitiveState.attention || 50
    const confusion = cognitiveState.confusion || 0
    const fatigue = cognitiveState.fatigue || 0

    let welcomeText = "Hi! I'm your AI tutor, ready to help you learn! 🤖"

    // Adapt welcome based on cognitive state
    if (confusion > 60) {
      welcomeText = "I notice you might be finding this challenging. Don't worry - I'm here to break things down and make them clearer! 💡"
    } else if (attention < 40) {
      welcomeText = "Let's make learning more engaging! I can help make this topic more interactive and fun. ⚡"
    } else if (fatigue > 70) {
      welcomeText = "You seem a bit tired. I'll keep my explanations concise and energizing! 🌟"
    }

    if (currentTopic) {
      welcomeText += ` I see you're working on ${currentTopic}. How can I help you master this topic?`
    } else {
      welcomeText += " What would you like to explore today?"
    }

    return {
      id: Date.now(),
      text: welcomeText,
      sender: 'ai',
      timestamp: new Date(),
      type: 'welcome',
      adaptations: generateCurrentAdaptations()
    }
  }

  const generateCurrentAdaptations = () => {
    const adaptations = []
    const { attention = 50, confusion = 0, fatigue = 0 } = cognitiveState

    if (confusion > 50) adaptations.push("Using simplified explanations")
    if (attention < 50) adaptations.push("Adding interactive elements")
    if (fatigue > 60) adaptations.push("Keeping responses concise")

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

    await handleAsync(async () => {
      // Simulate AI processing with cognitive state awareness
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
      
      const aiResponse = await generateAIResponse(messageToSend, cognitiveState, currentTopic, learningContext)
      
      const aiMessage = {
        id: Date.now() + 1,
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
        adaptations: aiResponse.adaptations,
        confidence: aiResponse.confidence,
        followUpQuestions: aiResponse.followUpQuestions,
        resources: aiResponse.resources
      }

      setMessages(prev => [...prev, aiMessage])
    }, {
      onError: (error) => {
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm experiencing some technical difficulties right now. Let me try a different approach to help you.",
          sender: 'ai',
          timestamp: new Date(),
          type: 'error',
          suggestions: [
            "Try rephrasing your question",
            "Check your internet connection",
            "Refresh the page if issues persist"
          ]
        }
        setMessages(prev => [...prev, errorMessage])
      },
      onFinally: () => {
        setIsTyping(false)
      }
    })
  }

  const handleQuickAction = (actionText) => {
    setCurrentMessage(actionText)
    setTimeout(() => sendMessage(), 100)
  }

  const generateAIResponse = async (message, cognitiveState, topic, context) => {
    const attention = cognitiveState.attention || 50
    const confusion = cognitiveState.confusion || 0
    const fatigue = cognitiveState.fatigue || 0
    const mood = cognitiveState.mood || 'neutral'

    let response = {
      text: '',
      suggestions: [],
      adaptations: [],
      confidence: 0.8,
      followUpQuestions: [],
      resources: []
    }

    // Analyze message intent
    const intent = analyzeMessageIntent(message)
    
    // Adapt response based on cognitive state
    if (confusion > 70) {
      response.text = "I can see this concept is challenging right now. Let me break it down into smaller, easier pieces..."
      response.adaptations.push("Simplified explanation")
      response.adaptations.push("Step-by-step breakdown")
      
      if (intent === 'explanation') {
        response.text += "\n\nLet's start with the most basic idea and build up from there. Think of it like building blocks - we'll add one piece at a time."
      }
    } else if (attention < 40) {
      response.text = "I notice your attention might be wandering. Let's make this more engaging and interactive!"
      response.suggestions.push("Try a hands-on exercise")
      response.suggestions.push("Take a 5-minute movement break")
      response.adaptations.push("Interactive content added")
      
      if (intent === 'explanation') {
        response.text += "\n\n🎯 Quick Challenge: Can you think of a real-world example where this concept applies?"
      }
    } else if (fatigue > 70) {
      response.text = "You seem tired - let me give you a quick, energizing explanation that gets straight to the point!"
      response.suggestions.push("Consider taking a 10-15 minute break")
      response.suggestions.push("Try some light stretching")
      response.adaptations.push("Concise format")
      response.adaptations.push("Energy-boosting tone")
    } else {
      // Generate contextual response based on intent and mood
      response = generateContextualResponse(intent, message, topic, mood, context)
    }

    // Add topic-specific enhancements
    if (topic) {
      response.text += `\n\nSince you're studying ${topic}, I'll connect this to what you've already learned.`
      response.resources.push({
        type: 'related_topic',
        title: `More about ${topic}`,
        description: 'Additional resources and examples'
      })
    }

    // Add follow-up questions based on intent
    response.followUpQuestions = generateFollowUpQuestions(intent, topic)

    // Add learning resources
    response.resources.push(...generateLearningResources(intent, topic))

    return response
  }

  const analyzeMessageIntent = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is') || lowerMessage.includes('how does')) {
      return 'explanation'
    } else if (lowerMessage.includes('example') || lowerMessage.includes('show me')) {
      return 'example'
    } else if (lowerMessage.includes('help') || lowerMessage.includes('stuck') || lowerMessage.includes('confused')) {
      return 'help'
    } else if (lowerMessage.includes('quiz') || lowerMessage.includes('test') || lowerMessage.includes('practice')) {
      return 'assessment'
    } else if (lowerMessage.includes('simple') || lowerMessage.includes('easier')) {
      return 'simplify'
    } else {
      return 'general'
    }
  }

  const generateContextualResponse = (intent, message, topic, mood, context) => {
    const responses = {
      explanation: {
        text: `Great question! Let me explain ${topic || 'this concept'} in a way that builds on your current understanding...`,
        confidence: 0.9
      },
      example: {
        text: "Perfect! Examples are a great way to understand concepts. Here's a practical example that should make this clearer...",
        confidence: 0.85
      },
      help: {
        text: "I'm here to help! Let's work through this together. What specific part is giving you trouble?",
        confidence: 0.8
      },
      assessment: {
        text: "Excellent idea! Testing your knowledge is a great way to reinforce learning. Let me create a quick quiz for you...",
        confidence: 0.9
      },
      simplify: {
        text: "Absolutely! Let me explain this in simpler terms. Sometimes the best understanding comes from the clearest explanations...",
        confidence: 0.85
      },
      general: {
        text: "That's an interesting question! Based on your current learning progress and what I know about your preferences...",
        confidence: 0.7
      }
    }

    const baseResponse = responses[intent] || responses.general
    
    // Enhance based on mood
    if (mood === 'happy' || mood === 'excited') {
      baseResponse.text = "I love your enthusiasm! " + baseResponse.text
    } else if (mood === 'frustrated' || mood === 'confused') {
      baseResponse.text = "I understand this can be frustrating. " + baseResponse.text
    }

    return {
      ...baseResponse,
      suggestions: [],
      adaptations: [],
      followUpQuestions: [],
      resources: []
    }
  }

  const generateFollowUpQuestions = (intent, topic) => {
    const questions = {
      explanation: [
        "Does this explanation make sense so far?",
        "Would you like me to go deeper into any specific part?",
        "Can you think of how this might apply in real life?"
      ],
      example: [
        "Would you like to see another example?",
        "Can you try creating your own example?",
        "How does this example relate to the theory?"
      ],
      help: [
        "What part would you like me to focus on first?",
        "Have you encountered similar concepts before?",
        "Would a visual explanation help?"
      ]
    }

    return questions[intent]?.slice(0, 2) || []
  }

  const generateLearningResources = (intent, topic) => {
    const resources = []

    if (topic) {
      resources.push({
        type: 'documentation',
        title: `${topic} Reference Guide`,
        description: 'Comprehensive documentation and examples'
      })
    }

    if (intent === 'example') {
      resources.push({
        type: 'interactive_demo',
        title: 'Interactive Examples',
        description: 'Hands-on demonstrations you can try'
      })
    }

    return resources
  }

  const rateResponse = (messageId, rating) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, userRating: rating, ratedAt: new Date() }
        : msg
    ))
    
    // Log rating for AI improvement
    console.log('Response rated:', { messageId, rating, conversationId })
  }

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => console.log('Message copied to clipboard'))
      .catch(err => console.error('Failed to copy message:', err))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } transition-all duration-300`}
    >
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Tutor</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {tutorPersonality.charAt(0).toUpperCase() + tutorPersonality.slice(1)} Mode
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={tutorPersonality}
            onChange={(e) => setTutorPersonality(e.target.value)}
            className="text-xs bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="adaptive">Adaptive</option>
            <option value="encouraging">Encouraging</option>
            <option value="technical">Technical</option>
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
          {/* Cognitive State Indicator */}
          {Object.keys(cognitiveState).length > 0 && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-4 text-xs">
                <span className="text-blue-700 dark:text-blue-300">
                  Adapting to: {cognitiveState.attention < 50 ? 'Low attention' : 
                              cognitiveState.confusion > 60 ? 'High confusion' :
                              cognitiveState.fatigue > 70 ? 'High fatigue' : 'Optimal state'}
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
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
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {message.sender === 'ai' && (
                        <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        
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
                                onClick={() => handleQuickAction(question)}
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
                                📚 {resource.title}: {resource.description}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Message Actions */}
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
                            </div>
                            <button
                              onClick={() => copyMessage(message.text)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickActions.slice(0, 4).map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action.text)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
                    disabled={isTyping}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{action.text.split(' ').slice(0, 2).join(' ')}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Enhanced Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && sendMessage()}
                placeholder="Ask your AI tutor anything..."
                className="flex-1 input-field text-sm"
                disabled={isTyping}
                maxLength={500}
              />
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Character Count */}
            <div className="flex items-center justify-between mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentMessage.length}/500 characters
              </div>
              {error && (
                <button
                  onClick={clearError}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
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

export default AITutor