class VoiceInteractionService {
  constructor() {
    this.recognition = null
    this.synthesis = null
    this.isListening = false
    this.isSpeaking = false
    this.voiceCommands = new Map()
    this.conversationMode = false
    this.voiceSettings = {
      language: 'en-US',
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8,
      voice: null
    }
    
    this.initializeVoiceServices()
    this.setupVoiceCommands()
  }

  initializeVoiceServices() {
    try {
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()
        
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = this.voiceSettings.language
        this.recognition.maxAlternatives = 3
        
        this.setupRecognitionHandlers()
      }
      
      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis
        this.loadVoices()
        
        // Load voices when they become available
        if (speechSynthesis.onvoiceschanged !== undefined) {
          speechSynthesis.onvoiceschanged = () => this.loadVoices()
        }
      }
      
      console.log('✅ Voice interaction services initialized')
    } catch (error) {
      console.error('❌ Voice services initialization failed:', error)
    }
  }

  setupRecognitionHandlers() {
    if (!this.recognition) return

    this.recognition.onstart = () => {
      this.isListening = true
      console.log('🎤 Voice recognition started')
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        this.processVoiceInput(finalTranscript)
      }
      
      // Emit interim results for real-time feedback
      if (this.onInterimResult) {
        this.onInterimResult(interimTranscript)
      }
    }

    this.recognition.onerror = (event) => {
      console.error('Voice recognition error:', event.error)
      this.isListening = false
      
      if (this.onError) {
        this.onError(event.error)
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('🎤 Voice recognition ended')
      
      if (this.onRecognitionEnd) {
        this.onRecognitionEnd()
      }
    }
  }

  loadVoices() {
    if (!this.synthesis) return

    const voices = this.synthesis.getVoices()
    
    // Prefer high-quality voices
    const preferredVoices = voices.filter(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Alex') ||
      voice.name.includes('Samantha')
    )
    
    if (preferredVoices.length > 0) {
      this.voiceSettings.voice = preferredVoices[0]
    } else if (voices.length > 0) {
      this.voiceSettings.voice = voices[0]
    }
    
    console.log(`🔊 Loaded ${voices.length} voices, selected: ${this.voiceSettings.voice?.name || 'default'}`)
  }

  setupVoiceCommands() {
    // Learning commands
    this.voiceCommands.set('start learning session', () => this.executeCommand('start_session'))
    this.voiceCommands.set('pause session', () => this.executeCommand('pause_session'))
    this.voiceCommands.set('end session', () => this.executeCommand('end_session'))
    this.voiceCommands.set('take a break', () => this.executeCommand('take_break'))
    
    // Content commands
    this.voiceCommands.set('explain this concept', () => this.executeCommand('explain_concept'))
    this.voiceCommands.set('give me an example', () => this.executeCommand('provide_example'))
    this.voiceCommands.set('make it simpler', () => this.executeCommand('simplify_content'))
    this.voiceCommands.set('make it harder', () => this.executeCommand('increase_difficulty'))
    
    // Assessment commands
    this.voiceCommands.set('quiz me', () => this.executeCommand('generate_quiz'))
    this.voiceCommands.set('check my understanding', () => this.executeCommand('check_understanding'))
    this.voiceCommands.set('show my progress', () => this.executeCommand('show_progress'))
    
    // Wellness commands
    this.voiceCommands.set('how am i doing', () => this.executeCommand('wellness_check'))
    this.voiceCommands.set('i need help', () => this.executeCommand('request_help'))
    this.voiceCommands.set('i feel confused', () => this.executeCommand('confusion_support'))
    
    // Navigation commands
    this.voiceCommands.set('go to dashboard', () => this.executeCommand('navigate_dashboard'))
    this.voiceCommands.set('open ai assistant', () => this.executeCommand('open_ai_assistant'))
    this.voiceCommands.set('show insights', () => this.executeCommand('show_insights'))
  }

  startListening(options = {}) {
    if (!this.recognition) {
      throw new Error('Speech recognition not available')
    }

    if (this.isListening) {
      this.stopListening()
      return
    }

    try {
      // Configure recognition for this session
      this.recognition.continuous = options.continuous || false
      this.recognition.interimResults = options.interimResults !== false
      
      // Set callbacks
      this.onInterimResult = options.onInterimResult
      this.onFinalResult = options.onFinalResult
      this.onError = options.onError
      this.onRecognitionEnd = options.onRecognitionEnd
      
      this.recognition.start()
      
      return {
        success: true,
        message: 'Voice recognition started'
      }
    } catch (error) {
      console.error('Failed to start voice recognition:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  processVoiceInput(transcript) {
    try {
      const cleanTranscript = transcript.trim().toLowerCase()
      
      // Check for direct voice commands
      const matchedCommand = this.findMatchingCommand(cleanTranscript)
      
      if (matchedCommand) {
        console.log(`🎯 Voice command executed: ${matchedCommand}`)
        this.voiceCommands.get(matchedCommand)()
        return {
          type: 'command',
          command: matchedCommand,
          transcript
        }
      }
      
      // Process as conversational input
      if (this.conversationMode && this.onConversationalInput) {
        this.onConversationalInput(transcript)
        return {
          type: 'conversation',
          transcript
        }
      }
      
      // Process as general input
      if (this.onVoiceInput) {
        this.onVoiceInput(transcript)
      }
      
      return {
        type: 'input',
        transcript
      }
      
    } catch (error) {
      console.error('Voice input processing failed:', error)
      return {
        type: 'error',
        error: error.message
      }
    }
  }

  findMatchingCommand(transcript) {
    // Exact match first
    if (this.voiceCommands.has(transcript)) {
      return transcript
    }
    
    // Fuzzy matching
    for (const command of this.voiceCommands.keys()) {
      if (this.calculateSimilarity(transcript, command) > 0.8) {
        return command
      }
    }
    
    // Partial matching
    for (const command of this.voiceCommands.keys()) {
      if (transcript.includes(command) || command.includes(transcript)) {
        return command
      }
    }
    
    return null
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.calculateEditDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  calculateEditDistance(str1, str2) {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not available')
    }

    if (this.isSpeaking) {
      this.stopSpeaking()
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      
      // Apply settings
      utterance.rate = options.rate || this.voiceSettings.rate
      utterance.pitch = options.pitch || this.voiceSettings.pitch
      utterance.volume = options.volume || this.voiceSettings.volume
      utterance.voice = options.voice || this.voiceSettings.voice
      
      // Set up event handlers
      utterance.onstart = () => {
        this.isSpeaking = true
        if (options.onStart) options.onStart()
      }
      
      utterance.onend = () => {
        this.isSpeaking = false
        if (options.onEnd) options.onEnd()
      }
      
      utterance.onerror = (event) => {
        this.isSpeaking = false
        console.error('Speech synthesis error:', event.error)
        if (options.onError) options.onError(event.error)
      }
      
      // Speak the text
      this.synthesis.speak(utterance)
      
      return {
        success: true,
        message: 'Speech started'
      }
    } catch (error) {
      console.error('Speech synthesis failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel()
      this.isSpeaking = false
    }
  }

  executeCommand(commandType) {
    try {
      const commandHandlers = {
        start_session: () => this.triggerEvent('start_learning_session'),
        pause_session: () => this.triggerEvent('pause_learning_session'),
        end_session: () => this.triggerEvent('end_learning_session'),
        take_break: () => this.triggerEvent('take_break'),
        explain_concept: () => this.triggerEvent('explain_current_concept'),
        provide_example: () => this.triggerEvent('provide_example'),
        simplify_content: () => this.triggerEvent('simplify_content'),
        increase_difficulty: () => this.triggerEvent('increase_difficulty'),
        generate_quiz: () => this.triggerEvent('generate_quiz'),
        check_understanding: () => this.triggerEvent('check_understanding'),
        show_progress: () => this.triggerEvent('show_progress'),
        wellness_check: () => this.triggerEvent('wellness_check'),
        request_help: () => this.triggerEvent('request_help'),
        confusion_support: () => this.triggerEvent('confusion_support'),
        navigate_dashboard: () => this.triggerEvent('navigate', { target: 'dashboard' }),
        open_ai_assistant: () => this.triggerEvent('open_ai_assistant'),
        show_insights: () => this.triggerEvent('show_insights')
      }
      
      const handler = commandHandlers[commandType]
      if (handler) {
        handler()
        
        // Provide voice feedback
        this.speak(`Command executed: ${commandType.replace(/_/g, ' ')}`, {
          rate: 1.1,
          onEnd: () => console.log('Command feedback completed')
        })
      } else {
        console.warn(`Unknown command type: ${commandType}`)
      }
    } catch (error) {
      console.error('Command execution failed:', error)
    }
  }

  triggerEvent(eventType, data = {}) {
    const event = new CustomEvent('voiceCommand', {
      detail: { type: eventType, data, timestamp: new Date() }
    })
    
    window.dispatchEvent(event)
  }

  enableConversationMode(onConversationalInput) {
    this.conversationMode = true
    this.onConversationalInput = onConversationalInput
    
    // Start continuous listening
    this.startListening({
      continuous: true,
      onFinalResult: (transcript) => {
        if (this.onConversationalInput) {
          this.onConversationalInput(transcript)
        }
      }
    })
  }

  disableConversationMode() {
    this.conversationMode = false
    this.onConversationalInput = null
    this.stopListening()
  }

  addCustomCommand(phrase, handler) {
    this.voiceCommands.set(phrase.toLowerCase(), handler)
  }

  removeCustomCommand(phrase) {
    this.voiceCommands.delete(phrase.toLowerCase())
  }

  updateVoiceSettings(newSettings) {
    this.voiceSettings = { ...this.voiceSettings, ...newSettings }
    
    if (this.recognition) {
      this.recognition.lang = this.voiceSettings.language
    }
  }

  getAvailableVoices() {
    if (!this.synthesis) return []
    
    return this.synthesis.getVoices().map(voice => ({
      name: voice.name,
      lang: voice.lang,
      gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
      quality: voice.name.includes('Google') || voice.name.includes('Microsoft') ? 'high' : 'standard'
    }))
  }

  testVoice(text = 'Hello! This is a voice test.') {
    return this.speak(text, {
      onStart: () => console.log('Voice test started'),
      onEnd: () => console.log('Voice test completed'),
      onError: (error) => console.error('Voice test failed:', error)
    })
  }

  getVoiceCapabilities() {
    return {
      speechRecognition: !!this.recognition,
      speechSynthesis: !!this.synthesis,
      continuousListening: !!this.recognition,
      voiceCommands: this.voiceCommands.size,
      availableVoices: this.getAvailableVoices().length,
      conversationMode: this.conversationMode,
      currentlyListening: this.isListening,
      currentlySpeaking: this.isSpeaking
    }
  }

  // Advanced voice features
  async transcribeAudio(audioBlob) {
    try {
      // This would integrate with a transcription service
      // For now, return a mock transcription
      return {
        transcript: 'Mock transcription of audio content',
        confidence: 0.85,
        language: 'en-US'
      }
    } catch (error) {
      console.error('Audio transcription failed:', error)
      throw new Error('Audio transcription failed')
    }
  }

  async generateSpeechFromText(text, options = {}) {
    try {
      // Enhanced speech generation with emotion and emphasis
      const enhancedText = this.addSpeechEnhancements(text, options)
      
      return this.speak(enhancedText, {
        ...options,
        onStart: () => console.log('Enhanced speech started'),
        onEnd: () => console.log('Enhanced speech completed')
      })
    } catch (error) {
      console.error('Enhanced speech generation failed:', error)
      return this.speak(text, options)
    }
  }

  addSpeechEnhancements(text, options) {
    let enhancedText = text
    
    // Add pauses for better comprehension
    enhancedText = enhancedText.replace(/\. /g, '. <break time="500ms"/> ')
    enhancedText = enhancedText.replace(/\, /g, ', <break time="200ms"/> ')
    
    // Add emphasis for important words
    if (options.emphasizeKeywords) {
      const keywords = ['important', 'key', 'remember', 'crucial', 'essential']
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        enhancedText = enhancedText.replace(regex, `<emphasis level="strong">${keyword}</emphasis>`)
      })
    }
    
    // Adjust for emotional tone
    if (options.emotionalTone === 'encouraging') {
      enhancedText = `<prosody rate="0.9" pitch="+10%">${enhancedText}</prosody>`
    } else if (options.emotionalTone === 'calm') {
      enhancedText = `<prosody rate="0.8" pitch="-5%">${enhancedText}</prosody>`
    }
    
    return enhancedText
  }

  createVoiceProfile(userId, preferences = {}) {
    const profile = {
      userId,
      preferences: {
        preferredVoice: preferences.voice || this.voiceSettings.voice?.name,
        speechRate: preferences.rate || this.voiceSettings.rate,
        speechPitch: preferences.pitch || this.voiceSettings.pitch,
        speechVolume: preferences.volume || this.voiceSettings.volume,
        language: preferences.language || this.voiceSettings.language
      },
      customCommands: preferences.customCommands || [],
      conversationStyle: preferences.conversationStyle || 'friendly',
      accessibilityNeeds: preferences.accessibilityNeeds || [],
      createdAt: new Date(),
      lastUpdated: new Date()
    }
    
    // Store profile (in production, this would be saved to backend)
    localStorage.setItem(`voiceProfile_${userId}`, JSON.stringify(profile))
    
    return profile
  }

  loadVoiceProfile(userId) {
    try {
      const stored = localStorage.getItem(`voiceProfile_${userId}`)
      if (stored) {
        const profile = JSON.parse(stored)
        this.applyVoiceProfile(profile)
        return profile
      }
    } catch (error) {
      console.error('Voice profile loading failed:', error)
    }
    
    return null
  }

  applyVoiceProfile(profile) {
    if (profile.preferences) {
      this.updateVoiceSettings(profile.preferences)
    }
    
    if (profile.customCommands) {
      profile.customCommands.forEach(cmd => {
        this.addCustomCommand(cmd.phrase, cmd.handler)
      })
    }
  }

  // Accessibility features
  enableAccessibilityMode(accessibilityNeeds = []) {
    if (accessibilityNeeds.includes('slow_speech')) {
      this.voiceSettings.rate = 0.7
    }
    
    if (accessibilityNeeds.includes('high_contrast_audio')) {
      this.voiceSettings.pitch = 1.2
      this.voiceSettings.volume = 0.9
    }
    
    if (accessibilityNeeds.includes('simple_commands')) {
      this.setupSimpleCommands()
    }
    
    if (accessibilityNeeds.includes('audio_descriptions')) {
      this.enableAudioDescriptions()
    }
  }

  setupSimpleCommands() {
    // Add simplified voice commands
    this.voiceCommands.set('help', () => this.executeCommand('request_help'))
    this.voiceCommands.set('stop', () => this.executeCommand('pause_session'))
    this.voiceCommands.set('continue', () => this.executeCommand('start_session'))
    this.voiceCommands.set('repeat', () => this.executeCommand('repeat_last'))
  }

  enableAudioDescriptions() {
    // Enable audio descriptions of visual elements
    this.audioDescriptionsEnabled = true
  }

  describeVisualElement(element, description) {
    if (this.audioDescriptionsEnabled) {
      this.speak(`Visual element: ${description}`, {
        rate: 0.8,
        pitch: 0.9
      })
    }
  }

  // Voice analytics
  getVoiceAnalytics() {
    return {
      totalCommands: this.voiceCommands.size,
      recognitionAccuracy: this.calculateRecognitionAccuracy(),
      averageResponseTime: this.calculateAverageResponseTime(),
      mostUsedCommands: this.getMostUsedCommands(),
      voiceInteractionTime: this.getTotalVoiceInteractionTime(),
      errorRate: this.calculateErrorRate()
    }
  }

  calculateRecognitionAccuracy() {
    // Mock calculation - in production would track actual accuracy
    return 0.92
  }

  calculateAverageResponseTime() {
    // Mock calculation
    return 1200 // milliseconds
  }

  getMostUsedCommands() {
    // Mock data - in production would track usage
    return [
      { command: 'explain this concept', usage: 45 },
      { command: 'quiz me', usage: 32 },
      { command: 'take a break', usage: 28 }
    ]
  }

  getTotalVoiceInteractionTime() {
    // Mock calculation
    return 1847 // seconds
  }

  calculateErrorRate() {
    // Mock calculation
    return 0.08
  }
}

export default new VoiceInteractionService()