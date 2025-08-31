import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings,
  Play,
  Pause,
  Square,
  Headphones,
  MessageCircle,
  Brain,
  Zap,
  Eye,
  Activity
} from 'lucide-react'
import voiceInteractionService from '../services/voiceInteraction'

const VoiceInterface = ({ 
  onVoiceCommand, 
  onTranscript, 
  isEnabled = true,
  showVisualFeedback = true 
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [voiceSettings, setVoiceSettings] = useState({
    language: 'en-US',
    rate: 0.9,
    pitch: 1.0,
    volume: 0.8
  })
  const [voiceCommands, setVoiceCommands] = useState([])
  const [voiceAnalytics, setVoiceAnalytics] = useState({
    totalCommands: 0,
    successfulCommands: 0,
    averageAccuracy: 0
  })
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    // Initialize voice service
    initializeVoiceService()
    
    // Load voice commands
    loadVoiceCommands()
    
    // Set up event listeners
    setupEventListeners()
    
    return () => {
      cleanupVoiceService()
    }
  }, [])

  const initializeVoiceService = () => {
    try {
      voiceInteractionService.updateVoiceSettings(voiceSettings)
      
      // Set up callbacks
      voiceInteractionService.onVoiceInput = handleVoiceInput
      voiceInteractionService.onConversationalInput = handleConversationalInput
      
      console.log('✅ Voice interface initialized')
    } catch (error) {
      console.error('❌ Voice interface initialization failed:', error)
    }
  }

  const loadVoiceCommands = () => {
    const commands = [
      { phrase: 'start learning session', description: 'Begin a new learning session' },
      { phrase: 'pause session', description: 'Pause the current session' },
      { phrase: 'take a break', description: 'Start a break timer' },
      { phrase: 'explain this concept', description: 'Get an explanation of current topic' },
      { phrase: 'quiz me', description: 'Generate a personalized quiz' },
      { phrase: 'show my progress', description: 'Display learning progress' },
      { phrase: 'how am i doing', description: 'Get wellness and performance update' },
      { phrase: 'open ai assistant', description: 'Open the AI assistant' },
      { phrase: 'show insights', description: 'Display AI-generated insights' }
    ]
    
    setVoiceCommands(commands)
  }

  const setupEventListeners = () => {
    // Listen for voice commands from the service
    window.addEventListener('voiceCommand', handleVoiceCommandEvent)
    
    return () => {
      window.removeEventListener('voiceCommand', handleVoiceCommandEvent)
    }
  }

  const cleanupVoiceService = () => {
    voiceInteractionService.stopListening()
    voiceInteractionService.stopSpeaking()
  }

  const handleVoiceInput = (transcript) => {
    setCurrentTranscript(transcript)
    
    if (onTranscript) {
      onTranscript(transcript)
    }
    
    // Update analytics
    setVoiceAnalytics(prev => ({
      ...prev,
      totalCommands: prev.totalCommands + 1
    }))
  }

  const handleConversationalInput = (transcript) => {
    setCurrentTranscript(transcript)
    
    // Process as conversational input for AI assistant
    if (onVoiceCommand) {
      onVoiceCommand({
        type: 'conversation',
        transcript,
        timestamp: new Date()
      })
    }
  }

  const handleVoiceCommandEvent = (event) => {
    const { type, data } = event.detail
    
    if (onVoiceCommand) {
      onVoiceCommand({
        type,
        data,
        timestamp: new Date()
      })
    }
    
    // Update analytics
    setVoiceAnalytics(prev => ({
      ...prev,
      successfulCommands: prev.successfulCommands + 1
    }))
  }

  const startListening = () => {
    if (!isEnabled || !voiceEnabled) return
    
    try {
      const result = voiceInteractionService.startListening({
        continuous: false,
        interimResults: true,
        onInterimResult: (transcript) => {
          setInterimTranscript(transcript)
        },
        onFinalResult: (transcript) => {
          setCurrentTranscript(transcript)
          setInterimTranscript('')
        },
        onError: (error) => {
          console.error('Voice recognition error:', error)
          setIsListening(false)
          if (window.toast) {
            window.toast.error('Voice recognition failed')
          }
        },
        onRecognitionEnd: () => {
          setIsListening(false)
        }
      })
      
      if (result.success) {
        setIsListening(true)
      }
    } catch (error) {
      console.error('Failed to start listening:', error)
      if (window.toast) {
        window.toast.error('Voice input not available')
      }
    }
  }

  const stopListening = () => {
    voiceInteractionService.stopListening()
    setIsListening(false)
    setInterimTranscript('')
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const speakText = (text) => {
    if (!voiceEnabled) return
    
    try {
      const result = voiceInteractionService.speak(text, {
        ...voiceSettings,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (error) => {
          console.error('Speech failed:', error)
          setIsSpeaking(false)
        }
      })
      
      if (!result.success) {
        console.error('Speech synthesis failed:', result.error)
      }
    } catch (error) {
      console.error('Text-to-speech failed:', error)
    }
  }

  const stopSpeaking = () => {
    voiceInteractionService.stopSpeaking()
    setIsSpeaking(false)
  }

  const testVoice = () => {
    speakText('Hello! This is your AI assistant. Voice interaction is working correctly.')
  }

  const updateSettings = (newSettings) => {
    const updatedSettings = { ...voiceSettings, ...newSettings }
    setVoiceSettings(updatedSettings)
    voiceInteractionService.updateVoiceSettings(updatedSettings)
  }

  if (!isEnabled) return null

  return (
    <div className="voice-interface">
      {/* Main Voice Controls */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleListening}
          disabled={!voiceEnabled}
          className={`p-3 rounded-full transition-all duration-300 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg'
              : voiceEnabled
              ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`p-2 rounded-lg transition-colors ${
            voiceEnabled
              ? 'bg-green-100 text-green-600 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="Toggle voice responses"
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            title="Stop speaking"
          >
            <Square className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          title="Voice settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Visual Feedback */}
      {showVisualFeedback && (
        <AnimatePresence>
          {(isListening || isSpeaking || currentTranscript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {/* Listening Indicator */}
              {isListening && (
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-6 bg-red-500 rounded animate-pulse"></div>
                    <div className="w-2 h-4 bg-red-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-8 bg-red-500 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-3 bg-red-400 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Listening...</span>
                </div>
              )}

              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="flex items-center space-x-3 mb-3">
                  <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Speaking...</span>
                </div>
              )}

              {/* Transcript Display */}
              {(currentTranscript || interimTranscript) && (
                <div className="space-y-2">
                  {interimTranscript && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                      {interimTranscript}
                    </div>
                  )}
                  {currentTranscript && (
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      "{currentTranscript}"
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Voice Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Voice Settings</h4>
            
            <div className="space-y-4">
              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speech Rate: {voiceSettings.rate}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.rate}
                  onChange={(e) => updateSettings({ rate: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Speech Pitch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speech Pitch: {voiceSettings.pitch}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={voiceSettings.pitch}
                  onChange={(e) => updateSettings({ pitch: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Volume */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Volume: {Math.round(voiceSettings.volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.volume}
                  onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={voiceSettings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  className="w-full input-field text-sm"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                </select>
              </div>

              {/* Test Voice */}
              <button
                onClick={testVoice}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Headphones className="w-4 h-4" />
                <span>Test Voice</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Commands Help */}
      {voiceCommands.length > 0 && (
        <div className="mt-4">
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Available Voice Commands ({voiceCommands.length})
            </summary>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {voiceCommands.map((command, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">
                    "{command.phrase}"
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">
                    {command.description}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Voice Analytics */}
      {voiceAnalytics.totalCommands > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Voice Analytics</h5>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {voiceAnalytics.totalCommands}
              </div>
              <div className="text-xs text-blue-500">Commands</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {voiceAnalytics.successfulCommands}
              </div>
              <div className="text-xs text-green-500">Successful</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {Math.round((voiceAnalytics.successfulCommands / voiceAnalytics.totalCommands) * 100)}%
              </div>
              <div className="text-xs text-purple-500">Accuracy</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VoiceInterface