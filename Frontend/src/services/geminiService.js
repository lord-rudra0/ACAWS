import { GoogleGenerativeAI } from '@google/generative-ai'

class GeminiService {
  constructor() {
    this.useBackend = String(import.meta.env.VITE_USE_BACKEND_GEMINI).toLowerCase() === 'true'
    this.apiBase = import.meta.env.VITE_API_URL

    if (!this.useBackend) {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.error('GeminiService: Missing/invalid VITE_GEMINI_API_KEY. Either set it in Frontend/.env or enable VITE_USE_BACKEND_GEMINI=true to proxy via Express.')
        throw new Error('Gemini API key not configured')
      }
      this.genAI = new GoogleGenerativeAI(apiKey)
      // Use unified modern model IDs; 1.5-flash supports text and multimodal
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }
    this.conversationHistory = new Map()

    // Client-side rate limiting (token bucket)
    this.rate = {
      capacity: Number(import.meta.env.VITE_GEMINI_RATE_CAPACITY) || 5, // max requests per window
      refillIntervalMs: Number(import.meta.env.VITE_GEMINI_RATE_INTERVAL_MS) || 10000, // window size
      tokens: Number(import.meta.env.VITE_GEMINI_RATE_CAPACITY) || 5,
      lastRefill: Date.now()
    }
  }

  // Token bucket acquire; waits when empty to spread requests
  async _acquireToken() {
    const now = Date.now()
    const elapsed = now - this.rate.lastRefill
    if (elapsed >= this.rate.refillIntervalMs) {
      this.rate.tokens = this.rate.capacity
      this.rate.lastRefill = now
    }
    if (this.rate.tokens > 0) {
      this.rate.tokens -= 1
      return
    }
    // Wait until next window
    const waitMs = Math.max(50, this.rate.refillIntervalMs - elapsed)
    await this._wait(waitMs)
    return this._acquireToken()
  }

  _wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

  async _requestWithRetry(fn, { maxRetries = 3, baseDelay = 500 } = {}) {
    let attempt = 0
    let lastErr
    while (attempt <= maxRetries) {
      try {
        return await fn()
      } catch (err) {
        lastErr = err
        const status = err?.status || err?.response?.status
        const isRateLimited = status === 429 || /rate limit/i.test(String(err))
        const isRetryable = isRateLimited || (status >= 500 && status < 600)
        if (!isRetryable || attempt === maxRetries) break
        // Respect Retry-After when available
        const retryAfter = Number(err?.headers?.get?.('retry-after'))
        const delay = Number.isFinite(retryAfter)
          ? retryAfter * 1000
          : Math.min(8000, baseDelay * Math.pow(2, attempt)) + Math.floor(Math.random() * 200)
        await this._wait(delay)
        attempt += 1
      }
    }
    throw lastErr || new Error('Request failed')
  }

  getTimeoutMs() {
    const val = Number(import.meta.env.VITE_GEMINI_TIMEOUT_MS)
    return Number.isFinite(val) && val > 0 ? val : 30000
  }

  // Unified text generation path: uses backend proxy when enabled
  async generateText(prompt, { model = 'gemini-1.5-flash', systemInstruction, generationConfig } = {}) {
    await this._acquireToken()
    if (this.useBackend) {
      if (!this.apiBase) {
        throw new Error('VITE_API_URL not set. Required when VITE_USE_BACKEND_GEMINI=true')
      }
      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const doFetch = async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.getTimeoutMs())
        try {
          const res = await fetch(`${this.apiBase}/api/ai/gemini`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt, model, generationConfig, systemInstruction }),
            signal: controller.signal
          })
          if (!res.ok) {
            const text = await res.text().catch(() => '')
            const error = new Error(`Backend Gemini call failed: ${res.status} ${res.statusText} ${text}`)
            error.status = res.status
            error.headers = res.headers
            throw error
          }
          const data = await res.json()
          return data?.output || ''
        } finally {
          clearTimeout(timeoutId)
        }
      }
      return this._requestWithRetry(doFetch)
    }

    // Fallback to direct SDK usage when not proxying
    const callSDK = async () => {
      const result = await Promise.race([
        this.model.generateContent(prompt),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini request timed out')), this.getTimeoutMs()))
      ])
      const response = await result.response
      return response.text()
    }
    return this._requestWithRetry(callSDK)
  }

  async generatePersonalizedExplanation(topic, userProfile, cognitiveState) {
    try {
      const prompt = this.buildExplanationPrompt(topic, userProfile, cognitiveState)
      const text = await this.generateText(prompt)
      
      return {
        explanation: text,
        adaptations: this.extractAdaptations(text),
        confidence: 0.9,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Gemini explanation generation failed:', error)
      throw new Error('Failed to generate personalized explanation')
    }
  }

  async generateLearningPath(subject, currentLevel, goals, learningStyle) {
    try {
      const prompt = `
        Create a comprehensive, personalized learning path for ${subject}.
        
        Student Profile:
        - Current Level: ${currentLevel}
        - Learning Goals: ${goals}
        - Learning Style: ${learningStyle}
        
        Generate a structured learning path with:
        1. Sequential modules with clear prerequisites
        2. Estimated time for each module
        3. Difficulty progression
        4. Assessment checkpoints
        5. Practical projects
        6. Adaptive milestones
        
        Format as JSON with detailed module descriptions.
      `
      const text = await this.generateText(prompt)
      
      return {
        learningPath: this.parseLearningPath(text),
        estimatedDuration: this.calculatePathDuration(text),
        adaptiveCheckpoints: this.extractCheckpoints(text),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Learning path generation failed:', error)
      throw new Error('Failed to generate learning path')
    }
  }

  async analyzeStudentProgress(progressData, cognitiveHistory) {
    try {
      const prompt = `
        Analyze this student's learning progress and provide insights:
        
        Progress Data: ${JSON.stringify(progressData)}
        Cognitive History: ${JSON.stringify(cognitiveHistory)}
        
        Provide:
        1. Strengths and areas for improvement
        2. Learning pattern analysis
        3. Personalized recommendations
        4. Risk factors and mitigation strategies
        5. Optimal study schedule suggestions
        
        Be specific and actionable in your recommendations.
      `
      const text = await this.generateText(prompt)
      
      return {
        analysis: text,
        insights: this.extractInsights(text),
        recommendations: this.extractRecommendations(text),
        riskFactors: this.extractRiskFactors(text),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Progress analysis failed:', error)
      throw new Error('Failed to analyze student progress')
    }
  }

  async generateQuizQuestions(topic, difficulty, cognitiveState, count = 5) {
    try {
      const adaptivePrompt = this.buildQuizPrompt(topic, difficulty, cognitiveState, count)
      const text = await this.generateText(adaptivePrompt)
      
      return {
        questions: this.parseQuizQuestions(text),
        adaptedDifficulty: this.determineDifficulty(cognitiveState),
        explanations: this.extractExplanations(text),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Quiz generation failed:', error)
      throw new Error('Failed to generate quiz questions')
    }
  }

  async provideTutoringSupport(question, context, studentProfile) {
    try {
      const conversationId = context.conversationId || 'default'
      const history = this.conversationHistory.get(conversationId) || []
      
      const prompt = `
        You are an expert AI tutor for the ACAWS system. Provide personalized tutoring support.
        
        Student Question: ${question}
        Context: ${JSON.stringify(context)}
        Student Profile: ${JSON.stringify(studentProfile)}
        Conversation History: ${JSON.stringify(history.slice(-5))}
        
        Provide:
        1. Clear, adaptive explanation
        2. Follow-up questions to check understanding
        3. Additional resources or examples
        4. Encouragement and motivation
        
        Adapt your response based on the student's cognitive state and learning style.
      `
      const text = await this.generateText(prompt)
      
      // Update conversation history
      history.push({ question, response: text, timestamp: new Date() })
      this.conversationHistory.set(conversationId, history)
      
      return {
        response: text,
        followUpQuestions: this.extractFollowUpQuestions(text),
        resources: this.extractResources(text),
        confidence: 0.85,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Tutoring support failed:', error)
      throw new Error('Failed to provide tutoring support')
    }
  }

  async analyzeImageContent(imageData, context) {
    try {
      await this._acquireToken()
      if (this.useBackend) {
        if (!this.apiBase) {
          throw new Error('VITE_API_URL not set. Required when VITE_USE_BACKEND_GEMINI=true')
        }
        const token = localStorage.getItem('token')
        const headers = { 'Content-Type': 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`

        const doFetch = async () => {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), this.getTimeoutMs())
          try {
            const res = await fetch(`${this.apiBase}/api/ai/gemini-vision`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ imageData, context, model: 'gemini-1.5-flash' }),
              signal: controller.signal
            })
            if (!res.ok) {
              const text = await res.text().catch(() => '')
              const error = new Error(`Backend Gemini vision call failed: ${res.status} ${res.statusText} ${text}`)
              error.status = res.status
              error.headers = res.headers
              throw error
            }
            const data = await res.json()
            return data?.output || ''
          } finally {
            clearTimeout(timeoutId)
          }
        }
        const analysisText = await this._requestWithRetry(doFetch)
        return {
          analysis: analysisText,
          concepts: this.extractConcepts(analysisText),
          discussionPoints: this.extractDiscussionPoints(analysisText),
          relatedTopics: this.extractRelatedTopics(analysisText),
          timestamp: new Date().toISOString()
        }
      }
      const prompt = `
        Analyze this educational image and provide learning insights:
        
        Context: ${JSON.stringify(context)}
        
        Provide:
        1. Description of key concepts shown
        2. Educational value assessment
        3. Suggested discussion points
        4. Related topics to explore
        5. Difficulty level assessment
      `
      
      const imagePart = {
        inlineData: {
          data: imageData.split(',')[1],
          mimeType: 'image/jpeg'
        }
      }
      
      const callSDK = async () => {
        const result = await Promise.race([
          this.visionModel.generateContent([prompt, imagePart]),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini vision request timed out')), this.getTimeoutMs()))
        ])
        const response = await result.response
        return response.text()
      }
      const analysisText = await this._requestWithRetry(callSDK)
      return {
        analysis: analysisText,
        concepts: this.extractConcepts(analysisText),
        discussionPoints: this.extractDiscussionPoints(analysisText),
        relatedTopics: this.extractRelatedTopics(analysisText),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Image analysis failed:', error)
      throw new Error('Failed to analyze image content')
    }
  }

  async generateWellnessInsights(wellnessData, cognitivePatterns) {
    try {
      const prompt = `
        Analyze wellness data and cognitive patterns to provide personalized insights:
        
        Wellness Data: ${JSON.stringify(wellnessData)}
        Cognitive Patterns: ${JSON.stringify(cognitivePatterns)}
        
        Provide:
        1. Wellness trend analysis
        2. Correlation between wellness and learning performance
        3. Personalized wellness recommendations
        4. Early warning signs to watch for
        5. Optimal study-wellness balance strategies
      `
      const text = await this.generateText(prompt)
      
      return {
        insights: text,
        recommendations: this.extractWellnessRecommendations(text),
        correlations: this.extractCorrelations(text),
        warnings: this.extractWarnings(text),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Wellness insights generation failed:', error)
      throw new Error('Failed to generate wellness insights')
    }
  }

  buildExplanationPrompt(topic, userProfile, cognitiveState) {
    const attention = cognitiveState.attention || 50
    const confusion = cognitiveState.confusion || 0
    const fatigue = cognitiveState.fatigue || 0
    
    let adaptationInstructions = ""
    
    if (confusion > 60) {
      adaptationInstructions += "Use very simple language and break down concepts into small steps. "
    }
    if (attention < 40) {
      adaptationInstructions += "Make the explanation engaging and interactive. "
    }
    if (fatigue > 70) {
      adaptationInstructions += "Keep the explanation concise and energizing. "
    }
    
    return `
      Explain "${topic}" to a student with the following profile:
      
      Learning Style: ${userProfile.learningStyle || 'visual'}
      Experience Level: ${userProfile.experienceLevel || 'intermediate'}
      Current Cognitive State:
      - Attention: ${attention}%
      - Confusion: ${confusion}%
      - Fatigue: ${fatigue}%
      
      Adaptation Instructions: ${adaptationInstructions}
      
      Provide a clear, engaging explanation that:
      1. Matches their learning style
      2. Adapts to their cognitive state
      3. Includes practical examples
      4. Suggests next steps for learning
      
      Format with clear sections and use appropriate complexity level.
    `
  }

  buildQuizPrompt(topic, difficulty, cognitiveState, count) {
    const attention = cognitiveState.attention || 50
    const confusion = cognitiveState.confusion || 0
    
    let difficultyAdjustment = difficulty
    
    if (confusion > 60) {
      difficultyAdjustment = 'easy'
    } else if (attention > 80 && confusion < 20) {
      difficultyAdjustment = 'challenging'
    }
    
    return `
      Generate ${count} quiz questions about "${topic}" with ${difficultyAdjustment} difficulty.
      
      Student's Current State:
      - Attention: ${attention}%
      - Confusion: ${confusion}%
      
      Requirements:
      1. Questions should be ${difficultyAdjustment} level
      2. Include multiple choice and short answer questions
      3. Provide detailed explanations for each answer
      4. Add hints for struggling students
      5. Include follow-up questions for advanced students
      
      Format as JSON with question, options, correct_answer, explanation, and difficulty_level.
    `
  }

  // Helper methods for parsing responses
  extractAdaptations(text) {
    const adaptations = []
    if (text.includes('simplified') || text.includes('basic')) {
      adaptations.push('simplified_explanation')
    }
    if (text.includes('interactive') || text.includes('engaging')) {
      adaptations.push('increased_interactivity')
    }
    if (text.includes('visual') || text.includes('diagram')) {
      adaptations.push('visual_enhancement')
    }
    return adaptations
  }

  parseLearningPath(text) {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback parsing
      return this.parseTextualLearningPath(text)
    } catch (error) {
      console.error('Learning path parsing failed:', error)
      return this.getDefaultLearningPath()
    }
  }

  parseTextualLearningPath(text) {
    const modules = []
    const lines = text.split('\n')
    
    let currentModule = null
    
    lines.forEach(line => {
      if (line.includes('Module') || line.includes('Chapter')) {
        if (currentModule) modules.push(currentModule)
        currentModule = {
          title: line.trim(),
          duration: 45,
          difficulty: 'intermediate',
          topics: []
        }
      } else if (currentModule && line.trim()) {
        currentModule.topics.push(line.trim())
      }
    })
    
    if (currentModule) modules.push(currentModule)
    return modules
  }

  getDefaultLearningPath() {
    return [
      {
        title: "Foundation Concepts",
        duration: 30,
        difficulty: "beginner",
        topics: ["Basic principles", "Key terminology", "Core concepts"]
      },
      {
        title: "Intermediate Applications",
        duration: 45,
        difficulty: "intermediate", 
        topics: ["Practical applications", "Problem solving", "Case studies"]
      },
      {
        title: "Advanced Topics",
        duration: 60,
        difficulty: "advanced",
        topics: ["Complex scenarios", "Integration", "Best practices"]
      }
    ]
  }

  extractInsights(text) {
    const insights = []
    const sentences = text.split('.')
    
    sentences.forEach(sentence => {
      if (sentence.includes('strength') || sentence.includes('good at')) {
        insights.push({ type: 'strength', text: sentence.trim() })
      } else if (sentence.includes('improve') || sentence.includes('challenge')) {
        insights.push({ type: 'improvement', text: sentence.trim() })
      } else if (sentence.includes('recommend') || sentence.includes('suggest')) {
        insights.push({ type: 'recommendation', text: sentence.trim() })
      }
    })
    
    return insights
  }

  extractRecommendations(text) {
    const recommendations = []
    const lines = text.split('\n')
    
    lines.forEach(line => {
      if (line.includes('recommend') || line.includes('suggest') || line.includes('should')) {
        recommendations.push({
          text: line.trim(),
          priority: line.includes('important') || line.includes('critical') ? 'high' : 'medium',
          category: this.categorizeRecommendation(line)
        })
      }
    })
    
    return recommendations
  }

  categorizeRecommendation(text) {
    if (text.includes('break') || text.includes('rest')) return 'wellness'
    if (text.includes('practice') || text.includes('exercise')) return 'practice'
    if (text.includes('review') || text.includes('study')) return 'study_method'
    if (text.includes('schedule') || text.includes('time')) return 'scheduling'
    return 'general'
  }

  extractRiskFactors(text) {
    const risks = []
    const riskKeywords = ['risk', 'concern', 'warning', 'decline', 'struggle']
    
    const sentences = text.split('.')
    sentences.forEach(sentence => {
      if (riskKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        risks.push({
          description: sentence.trim(),
          severity: sentence.includes('high') || sentence.includes('critical') ? 'high' : 'medium',
          category: this.categorizeRisk(sentence)
        })
      }
    })
    
    return risks
  }

  categorizeRisk(text) {
    if (text.includes('performance') || text.includes('grade')) return 'academic'
    if (text.includes('stress') || text.includes('fatigue')) return 'wellness'
    if (text.includes('attention') || text.includes('focus')) return 'cognitive'
    return 'general'
  }

  parseQuizQuestions(text) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return this.parseTextualQuiz(text)
    } catch (error) {
      console.error('Quiz parsing failed:', error)
      return this.getDefaultQuiz()
    }
  }

  parseTextualQuiz(text) {
    const questions = []
    const questionBlocks = text.split(/\d+\./).slice(1)
    
    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n')
      if (lines.length > 0) {
        questions.push({
          id: index + 1,
          question: lines[0].trim(),
          options: lines.slice(1, 5).map(line => line.trim()),
          correct_answer: 0,
          explanation: "Detailed explanation would be provided here.",
          difficulty: 'medium'
        })
      }
    })
    
    return questions
  }

  getDefaultQuiz() {
    return [
      {
        id: 1,
        question: "What is the main concept we're studying?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: 0,
        explanation: "This tests basic understanding of the core concept.",
        difficulty: 'easy'
      }
    ]
  }

  extractFollowUpQuestions(text) {
    const questions = []
    const lines = text.split('\n')
    
    lines.forEach(line => {
      if (line.includes('?') && (line.includes('follow') || line.includes('next') || line.includes('also'))) {
        questions.push(line.trim())
      }
    })
    
    return questions.slice(0, 3)
  }

  extractResources(text) {
    const resources = []
    const lines = text.split('\n')
    
    lines.forEach(line => {
      if (line.includes('resource') || line.includes('reference') || line.includes('read more')) {
        resources.push({
          title: line.trim(),
          type: 'reference',
          priority: 'medium'
        })
      }
    })
    
    return resources
  }

  extractWellnessRecommendations(text) {
    const recommendations = []
    const wellnessKeywords = ['break', 'rest', 'exercise', 'sleep', 'stress', 'relax']
    
    const sentences = text.split('.')
    sentences.forEach(sentence => {
      if (wellnessKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        recommendations.push({
          text: sentence.trim(),
          category: this.categorizeWellnessRecommendation(sentence),
          urgency: sentence.includes('immediate') || sentence.includes('now') ? 'high' : 'medium'
        })
      }
    })
    
    return recommendations
  }

  categorizeWellnessRecommendation(text) {
    if (text.includes('break') || text.includes('rest')) return 'break'
    if (text.includes('exercise') || text.includes('movement')) return 'physical'
    if (text.includes('sleep') || text.includes('rest')) return 'sleep'
    if (text.includes('stress') || text.includes('anxiety')) return 'mental_health'
    return 'general'
  }

  extractCorrelations(text) {
    const correlations = []
    const correlationKeywords = ['correlate', 'relationship', 'connected', 'linked']
    
    const sentences = text.split('.')
    sentences.forEach(sentence => {
      if (correlationKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        correlations.push({
          description: sentence.trim(),
          strength: sentence.includes('strong') ? 'strong' : 'moderate',
          type: 'wellness_performance'
        })
      }
    })
    
    return correlations
  }

  extractWarnings(text) {
    const warnings = []
    const warningKeywords = ['warning', 'caution', 'watch', 'monitor', 'alert']
    
    const sentences = text.split('.')
    sentences.forEach(sentence => {
      if (warningKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        warnings.push({
          message: sentence.trim(),
          severity: sentence.includes('urgent') || sentence.includes('immediate') ? 'high' : 'medium',
          category: 'wellness'
        })
      }
    })
    
    return warnings
  }

  calculatePathDuration(text) {
    const durationMatches = text.match(/(\d+)\s*(hour|minute|week|day)/g)
    if (durationMatches) {
      let totalMinutes = 0
      durationMatches.forEach(match => {
        const [, number, unit] = match.match(/(\d+)\s*(hour|minute|week|day)/)
        const num = parseInt(number)
        
        switch (unit) {
          case 'minute': totalMinutes += num; break
          case 'hour': totalMinutes += num * 60; break
          case 'day': totalMinutes += num * 60 * 8; break
          case 'week': totalMinutes += num * 60 * 8 * 5; break
        }
      })
      return totalMinutes
    }
    return 180 // Default 3 hours
  }

  extractCheckpoints(text) {
    const checkpoints = []
    const lines = text.split('\n')
    
    lines.forEach((line, index) => {
      if (line.includes('checkpoint') || line.includes('milestone') || line.includes('assessment')) {
        checkpoints.push({
          id: index,
          title: line.trim(),
          type: 'assessment',
          position: Math.floor((index / lines.length) * 100)
        })
      }
    })
    
    return checkpoints
  }

  extractConcepts(text) {
    const concepts = []
    const conceptKeywords = ['concept', 'principle', 'theory', 'method', 'technique']
    
    const sentences = text.split('.')
    sentences.forEach(sentence => {
      if (conceptKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        concepts.push({
          text: sentence.trim(),
          importance: sentence.includes('key') || sentence.includes('important') ? 'high' : 'medium'
        })
      }
    })
    
    return concepts
  }

  extractDiscussionPoints(text) {
    const points = []
    const lines = text.split('\n')
    
    lines.forEach(line => {
      if (line.includes('discuss') || line.includes('consider') || line.includes('think about')) {
        points.push(line.trim())
      }
    })
    
    return points.slice(0, 5)
  }

  extractRelatedTopics(text) {
    const topics = []
    const lines = text.split('\n')
    
    lines.forEach(line => {
      if (line.includes('related') || line.includes('similar') || line.includes('also explore')) {
        topics.push(line.trim())
      }
    })
    
    return topics.slice(0, 3)
  }

  determineDifficulty(cognitiveState) {
    const attention = cognitiveState.attention || 50
    const confusion = cognitiveState.confusion || 0
    
    if (confusion > 60) return 'easy'
    if (attention > 80 && confusion < 20) return 'hard'
    return 'medium'
  }

  extractExplanations(text) {
    const explanations = []
    const explanationKeywords = ['because', 'explanation', 'reason', 'this is correct']
    
    const sentences = text.split('.')
    sentences.forEach(sentence => {
      if (explanationKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
        explanations.push(sentence.trim())
      }
    })
    
    return explanations
  }
}

export default new GeminiService()