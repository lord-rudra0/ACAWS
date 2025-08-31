import geminiService from './geminiService'
import aiOrchestrator from './aiOrchestrator'

class IntelligentTutoringService {
  constructor() {
    this.tutoringSessions = new Map()
    this.learningProfiles = new Map()
    this.adaptiveStrategies = new Map()
    this.conversationContexts = new Map()
  }

  async startIntelligentTutoringSession(userId, context) {
    const sessionId = `tutor_${userId}_${Date.now()}`
    
    try {
      // Initialize tutoring session
      const session = {
        sessionId,
        userId,
        startTime: Date.now(),
        context,
        conversationHistory: [],
        adaptations: [],
        learningProgress: {},
        aiInsights: []
      }
      
      this.tutoringSessions.set(sessionId, session)
      
      // Generate initial assessment
      const initialAssessment = await this.assessLearningNeeds(userId, context)
      
      // Create personalized tutoring strategy
      const tutoringStrategy = await this.createTutoringStrategy(initialAssessment, context)
      
      // Generate welcome message with personalization
      const welcomeMessage = await this.generatePersonalizedWelcome(userId, tutoringStrategy)
      
      session.strategy = tutoringStrategy
      session.conversationHistory.push(welcomeMessage)
      
      return {
        sessionId,
        welcomeMessage,
        tutoringStrategy,
        initialAssessment,
        capabilities: this.getTutoringCapabilities()
      }
      
    } catch (error) {
      console.error('Intelligent tutoring session start failed:', error)
      throw new Error('Failed to start intelligent tutoring session')
    }
  }

  async assessLearningNeeds(userId, context) {
    try {
      const assessment = {
        cognitiveNeeds: this.assessCognitiveNeeds(context.cognitiveState),
        knowledgeGaps: await this.identifyKnowledgeGaps(context.learningHistory),
        learningStyle: this.inferLearningStyle(context.userProfile, context.learningHistory),
        motivationalFactors: this.assessMotivationalFactors(context),
        supportNeeds: this.identifySupportNeeds(context)
      }
      
      // Enhanced assessment with AI
      const aiAssessment = await geminiService.analyzeStudentProgress(
        {
          userProfile: context.userProfile,
          learningHistory: context.learningHistory,
          cognitiveState: context.cognitiveState
        },
        context.learningHistory.sessions || []
      )
      
      assessment.aiInsights = aiAssessment.insights || []
      assessment.riskFactors = aiAssessment.riskFactors || []
      assessment.confidence = aiAssessment.confidence || 0.8
      
      return assessment
    } catch (error) {
      console.error('Learning needs assessment failed:', error)
      return { error: error.message }
    }
  }

  assessCognitiveNeeds(cognitiveState) {
    const needs = []
    
    if (cognitiveState.attention < 60) {
      needs.push({
        type: 'attention_support',
        severity: 'medium',
        description: 'Attention enhancement techniques needed'
      })
    }
    
    if (cognitiveState.confusion > 50) {
      needs.push({
        type: 'comprehension_support',
        severity: 'high',
        description: 'Additional explanations and examples required'
      })
    }
    
    if (cognitiveState.fatigue > 70) {
      needs.push({
        type: 'energy_management',
        severity: 'high',
        description: 'Break and energy management strategies needed'
      })
    }
    
    return needs
  }

  async identifyKnowledgeGaps(learningHistory) {
    const gaps = []
    
    // Analyze performance by topic
    const topicPerformance = {}
    
    learningHistory.sessions?.forEach(session => {
      const topic = session.topic || 'general'
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = []
      }
      topicPerformance[topic].push(session.score || 70)
    })
    
    // Identify topics with low performance
    Object.entries(topicPerformance).forEach(([topic, scores]) => {
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
      
      if (averageScore < 60) {
        gaps.push({
          topic,
          averageScore,
          severity: averageScore < 40 ? 'high' : 'medium',
          recommendedAction: 'review_and_practice'
        })
      }
    })
    
    return gaps
  }

  inferLearningStyle(userProfile, learningHistory) {
    // Start with profile preference
    let inferredStyle = userProfile.learningStyle || 'visual'
    
    // Analyze performance with different content types
    const contentTypePerformance = {}
    
    learningHistory.sessions?.forEach(session => {
      const contentType = session.contentType || 'mixed'
      if (!contentTypePerformance[contentType]) {
        contentTypePerformance[contentType] = []
      }
      contentTypePerformance[contentType].push(session.score || 70)
    })
    
    // Find best performing content type
    let bestType = 'visual'
    let bestScore = 0
    
    Object.entries(contentTypePerformance).forEach(([type, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avgScore > bestScore) {
        bestScore = avgScore
        bestType = type
      }
    })
    
    return {
      primary: bestType,
      confidence: bestScore > 75 ? 'high' : 'medium',
      preferences: this.generateStylePreferences(bestType),
      adaptations: this.generateStyleAdaptations(bestType)
    }
  }

  generateStylePreferences(style) {
    const preferences = {
      visual: ['diagrams', 'charts', 'infographics', 'mind_maps', 'color_coding'],
      auditory: ['explanations', 'discussions', 'audio_content', 'verbal_feedback'],
      kinesthetic: ['hands_on_exercises', 'simulations', 'interactive_demos', 'real_world_applications'],
      reading: ['text_based_content', 'detailed_explanations', 'written_exercises']
    }
    
    return preferences[style] || preferences.visual
  }

  generateStyleAdaptations(style) {
    const adaptations = {
      visual: {
        contentFormat: 'visual_heavy',
        explanationStyle: 'diagram_supported',
        assessmentType: 'visual_questions'
      },
      auditory: {
        contentFormat: 'audio_enhanced',
        explanationStyle: 'verbal_detailed',
        assessmentType: 'spoken_questions'
      },
      kinesthetic: {
        contentFormat: 'interactive',
        explanationStyle: 'hands_on_examples',
        assessmentType: 'practical_exercises'
      }
    }
    
    return adaptations[style] || adaptations.visual
  }

  assessMotivationalFactors(context) {
    const factors = {
      intrinsicMotivation: this.assessIntrinsicMotivation(context),
      extrinsicMotivation: this.assessExtrinsicMotivation(context),
      goalAlignment: this.assessGoalAlignment(context),
      selfEfficacy: this.assessSelfEfficacy(context)
    }
    
    return factors
  }

  assessIntrinsicMotivation(context) {
    const engagement = context.cognitiveState.engagement || 50
    const curiosity = context.userProfile.curiosityLevel || 50
    
    return {
      level: (engagement + curiosity) / 2,
      indicators: engagement > 70 ? ['high_engagement', 'self_directed'] : ['needs_stimulation'],
      enhancement_strategies: engagement < 50 ? ['gamification', 'choice_provision', 'relevance_connection'] : []
    }
  }

  assessExtrinsicMotivation(context) {
    const achievementOrientation = context.userProfile.achievementOrientation || 50
    
    return {
      level: achievementOrientation,
      indicators: achievementOrientation > 70 ? ['goal_oriented', 'achievement_focused'] : ['needs_external_validation'],
      enhancement_strategies: ['progress_tracking', 'achievement_badges', 'leaderboards']
    }
  }

  assessGoalAlignment(context) {
    const hasGoals = context.userProfile.learningGoals && context.userProfile.learningGoals.length > 0
    
    return {
      alignment: hasGoals ? 'high' : 'low',
      clarity: hasGoals ? 'clear' : 'needs_definition',
      recommendations: hasGoals ? ['maintain_focus'] : ['goal_setting_session', 'vision_clarification']
    }
  }

  assessSelfEfficacy(context) {
    const averageScore = context.learningHistory.averageScore || 70
    const completionRate = context.learningHistory.completionRate || 80
    
    const efficacy = (averageScore + completionRate) / 2
    
    return {
      level: efficacy,
      category: efficacy > 80 ? 'high' : efficacy > 60 ? 'medium' : 'low',
      buildingStrategies: efficacy < 70 ? ['success_highlighting', 'incremental_challenges', 'positive_feedback'] : []
    }
  }

  identifySupportNeeds(context) {
    const needs = []
    
    if (context.cognitiveState.confusion > 60) {
      needs.push({
        type: 'conceptual_support',
        description: 'Additional explanations and examples needed',
        urgency: 'high'
      })
    }
    
    if (context.learningHistory.averageScore < 60) {
      needs.push({
        type: 'academic_support',
        description: 'Foundational knowledge reinforcement needed',
        urgency: 'medium'
      })
    }
    
    if (context.wellnessData?.averageStress > 7) {
      needs.push({
        type: 'emotional_support',
        description: 'Stress management and emotional support needed',
        urgency: 'high'
      })
    }
    
    return needs
  }

  async createTutoringStrategy(assessment, context) {
    try {
      const strategy = {
        approach: this.determineTutoringApproach(assessment),
        techniques: this.selectTutoringTechniques(assessment),
        adaptationRules: this.createAdaptationRules(assessment),
        progressMonitoring: this.setupProgressMonitoring(assessment),
        interventionTriggers: this.defineInterventionTriggers(assessment)
      }
      
      // Enhance with AI-generated strategy
      const aiStrategy = await geminiService.generatePersonalizedExplanation(
        'Create a tutoring strategy',
        context.userProfile,
        context.cognitiveState
      )
      
      strategy.aiEnhancements = aiStrategy.adaptations || []
      strategy.confidence = aiStrategy.confidence || 0.8
      
      return strategy
    } catch (error) {
      console.error('Tutoring strategy creation failed:', error)
      return { error: error.message }
    }
  }

  determineTutoringApproach(assessment) {
    const cognitiveNeeds = assessment.cognitiveNeeds || []
    const knowledgeGaps = assessment.knowledgeGaps || []
    
    if (knowledgeGaps.length > 2) {
      return 'remedial_focused'
    } else if (cognitiveNeeds.some(need => need.severity === 'high')) {
      return 'support_intensive'
    } else {
      return 'enhancement_focused'
    }
  }

  selectTutoringTechniques(assessment) {
    const techniques = []
    
    // Based on learning style
    const learningStyle = assessment.learningStyle?.primary || 'visual'
    
    switch (learningStyle) {
      case 'visual':
        techniques.push('visual_explanations', 'concept_mapping', 'diagram_creation')
        break
      case 'auditory':
        techniques.push('verbal_explanations', 'discussion_based', 'audio_feedback')
        break
      case 'kinesthetic':
        techniques.push('hands_on_activities', 'simulation_based', 'practical_applications')
        break
    }
    
    // Based on cognitive needs
    assessment.cognitiveNeeds?.forEach(need => {
      switch (need.type) {
        case 'attention_support':
          techniques.push('attention_focusing', 'distraction_management', 'engagement_boosters')
          break
        case 'comprehension_support':
          techniques.push('scaffolding', 'analogies', 'step_by_step_breakdown')
          break
        case 'energy_management':
          techniques.push('pacing_control', 'break_scheduling', 'energy_monitoring')
          break
      }
    })
    
    return [...new Set(techniques)] // Remove duplicates
  }

  createAdaptationRules(assessment) {
    return {
      attentionRules: {
        low_attention: 'increase_interactivity',
        very_low_attention: 'suggest_break',
        high_attention: 'maintain_current_approach'
      },
      confusionRules: {
        high_confusion: 'simplify_explanation',
        moderate_confusion: 'provide_examples',
        low_confusion: 'advance_to_next_concept'
      },
      fatigueRules: {
        high_fatigue: 'immediate_break',
        moderate_fatigue: 'reduce_cognitive_load',
        low_fatigue: 'maintain_pace'
      },
      engagementRules: {
        low_engagement: 'increase_interactivity',
        moderate_engagement: 'add_variety',
        high_engagement: 'provide_challenges'
      }
    }
  }

  setupProgressMonitoring(assessment) {
    return {
      cognitiveMetrics: ['attention', 'confusion', 'engagement', 'fatigue'],
      learningMetrics: ['comprehension_rate', 'retention_score', 'application_ability'],
      wellnessMetrics: ['stress_level', 'mood_score', 'energy_level'],
      monitoringFrequency: {
        cognitive: 'real_time',
        learning: 'per_concept',
        wellness: 'per_session'
      },
      alertThresholds: {
        attention: 40,
        confusion: 70,
        fatigue: 80,
        comprehension: 50
      }
    }
  }

  defineInterventionTriggers(assessment) {
    return {
      immediate_interventions: [
        { condition: 'fatigue > 80', action: 'force_break' },
        { condition: 'confusion > 80', action: 'simplify_immediately' },
        { condition: 'attention < 20', action: 'engagement_intervention' }
      ],
      session_interventions: [
        { condition: 'average_confusion > 60', action: 'review_prerequisites' },
        { condition: 'engagement_declining', action: 'change_teaching_method' },
        { condition: 'multiple_mistakes', action: 'provide_additional_support' }
      ],
      long_term_interventions: [
        { condition: 'consistent_low_performance', action: 'comprehensive_review' },
        { condition: 'motivation_declining', action: 'goal_realignment' },
        { condition: 'wellness_concerns', action: 'holistic_support' }
      ]
    }
  }

  async generatePersonalizedWelcome(userId, strategy) {
    try {
      const welcomeContext = {
        tutoringApproach: strategy.approach,
        learningStyle: strategy.techniques,
        personalizedGreeting: true
      }
      
      const welcomeResponse = await geminiService.provideTutoringSupport(
        'Generate a personalized welcome message for this tutoring session',
        welcomeContext,
        { id: userId }
      )
      
      return {
        id: Date.now(),
        text: welcomeResponse.response,
        sender: 'ai_tutor',
        timestamp: new Date(),
        type: 'welcome',
        personalized: true,
        strategy: strategy.approach
      }
    } catch (error) {
      console.error('Personalized welcome generation failed:', error)
      return {
        id: Date.now(),
        text: "Hello! I'm your intelligent AI tutor, ready to provide personalized learning support tailored specifically to your needs and learning style.",
        sender: 'ai_tutor',
        timestamp: new Date(),
        type: 'welcome'
      }
    }
  }

  async processIntelligentTutoringRequest(sessionId, message, context) {
    try {
      const session = this.tutoringSessions.get(sessionId)
      if (!session) {
        throw new Error('Tutoring session not found')
      }

      // Analyze message intent and complexity
      const messageAnalysis = await this.analyzeMessageIntent(message, context)
      
      // Generate contextual response using AI orchestration
      const response = await this.generateContextualResponse(
        message,
        messageAnalysis,
        session,
        context
      )
      
      // Apply tutoring strategy adaptations
      const adaptedResponse = await this.applyTutoringAdaptations(
        response,
        session.strategy,
        context.cognitiveState
      )
      
      // Update session history
      session.conversationHistory.push(
        { text: message, sender: 'user', timestamp: new Date() },
        adaptedResponse
      )
      
      // Update learning progress
      this.updateLearningProgress(session, messageAnalysis, adaptedResponse)
      
      // Generate follow-up insights
      const followUpInsights = await this.generateFollowUpInsights(session, adaptedResponse)
      
      return {
        response: adaptedResponse,
        followUpInsights,
        sessionProgress: this.calculateSessionProgress(session),
        nextRecommendations: this.generateNextStepRecommendations(session, context)
      }
      
    } catch (error) {
      console.error('Intelligent tutoring request processing failed:', error)
      throw new Error('Failed to process tutoring request')
    }
  }

  async analyzeMessageIntent(message, context) {
    try {
      const analysis = {
        intent: this.classifyIntent(message),
        complexity: this.assessComplexity(message),
        emotionalTone: this.detectEmotionalTone(message),
        knowledgeLevel: this.inferKnowledgeLevel(message, context),
        supportNeeded: this.identifyRequiredSupport(message)
      }
      
      // Enhanced analysis with AI
      const aiAnalysis = await geminiService.provideTutoringSupport(
        `Analyze this student message for intent and needs: "${message}"`,
        { analysisMode: true },
        context.userProfile
      )
      
      analysis.aiInsights = aiAnalysis.followUpQuestions || []
      analysis.confidence = aiAnalysis.confidence || 0.8
      
      return analysis
    } catch (error) {
      console.error('Message intent analysis failed:', error)
      return { intent: 'general_question', confidence: 0.5 }
    }
  }

  classifyIntent(message) {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
      return 'explanation_request'
    } else if (lowerMessage.includes('how to') || lowerMessage.includes('how do')) {
      return 'procedure_request'
    } else if (lowerMessage.includes('why') || lowerMessage.includes('reason')) {
      return 'reasoning_request'
    } else if (lowerMessage.includes('example') || lowerMessage.includes('show me')) {
      return 'example_request'
    } else if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
      return 'help_request'
    } else if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
      return 'assessment_request'
    } else {
      return 'general_question'
    }
  }

  assessComplexity(message) {
    const wordCount = message.split(' ').length
    const technicalTerms = this.countTechnicalTerms(message)
    const questionDepth = this.assessQuestionDepth(message)
    
    let complexity = 'medium'
    
    if (wordCount > 50 || technicalTerms > 3 || questionDepth > 2) {
      complexity = 'high'
    } else if (wordCount < 10 && technicalTerms === 0) {
      complexity = 'low'
    }
    
    return complexity
  }

  countTechnicalTerms(message) {
    const technicalTerms = [
      'algorithm', 'neural', 'network', 'machine learning', 'deep learning',
      'classification', 'regression', 'optimization', 'gradient', 'backpropagation'
    ]
    
    return technicalTerms.filter(term => 
      message.toLowerCase().includes(term)
    ).length
  }

  assessQuestionDepth(message) {
    const depthIndicators = ['why', 'how', 'what if', 'compare', 'analyze', 'evaluate']
    return depthIndicators.filter(indicator => 
      message.toLowerCase().includes(indicator)
    ).length
  }

  detectEmotionalTone(message) {
    const positiveWords = ['great', 'awesome', 'love', 'excited', 'amazing']
    const negativeWords = ['confused', 'frustrated', 'difficult', 'hard', 'stuck']
    const neutralWords = ['understand', 'learn', 'know', 'explain']
    
    const lowerMessage = message.toLowerCase()
    
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  inferKnowledgeLevel(message, context) {
    const technicalTermsUsed = this.countTechnicalTerms(message)
    const averageScore = context.learningHistory?.averageScore || 70
    
    if (technicalTermsUsed > 2 && averageScore > 80) {
      return 'advanced'
    } else if (technicalTermsUsed > 0 || averageScore > 60) {
      return 'intermediate'
    } else {
      return 'beginner'
    }
  }

  identifyRequiredSupport(message) {
    const supportTypes = []
    
    if (message.toLowerCase().includes('confused') || message.toLowerCase().includes("don't understand")) {
      supportTypes.push('conceptual_clarification')
    }
    
    if (message.toLowerCase().includes('example') || message.toLowerCase().includes('show')) {
      supportTypes.push('concrete_examples')
    }
    
    if (message.toLowerCase().includes('practice') || message.toLowerCase().includes('exercise')) {
      supportTypes.push('practice_opportunities')
    }
    
    return supportTypes
  }

  async generateContextualResponse(message, messageAnalysis, session, context) {
    try {
      const responseContext = {
        message,
        messageAnalysis,
        sessionHistory: session.conversationHistory.slice(-5),
        tutoringStrategy: session.strategy,
        cognitiveState: context.cognitiveState,
        userProfile: context.userProfile
      }
      
      // Generate response using AI orchestration
      const orchestratedResponse = await aiOrchestrator.orchestrateIntelligentLearning(
        session.userId,
        responseContext
      )
      
      // Create tutoring response
      const tutoringResponse = {
        id: Date.now(),
        text: orchestratedResponse.personalizedContent?.content?.explanation || 'Let me help you with that...',
        sender: 'ai_tutor',
        timestamp: new Date(),
        type: messageAnalysis.intent,
        adaptations: orchestratedResponse.personalizedContent?.adaptations || [],
        recommendations: orchestratedResponse.recommendations || [],
        confidence: orchestratedResponse.cognitiveAnalysis?.confidence || 0.8,
        orchestrationData: orchestratedResponse
      }
      
      return tutoringResponse
    } catch (error) {
      console.error('Contextual response generation failed:', error)
      return this.generateFallbackResponse(message, messageAnalysis)
    }
  }

  generateFallbackResponse(message, messageAnalysis) {
    const fallbackResponses = {
      explanation_request: "I'd be happy to explain that concept. Let me break it down into simpler parts...",
      help_request: "I understand you need help with this. Let's work through it step by step...",
      example_request: "Great question! Here's a practical example that should clarify this concept...",
      assessment_request: "I can create a personalized quiz to test your understanding..."
    }
    
    return {
      id: Date.now(),
      text: fallbackResponses[messageAnalysis.intent] || "I'm here to help! Could you tell me more about what you'd like to learn?",
      sender: 'ai_tutor',
      timestamp: new Date(),
      type: 'fallback',
      confidence: 0.6
    }
  }

  async applyTutoringAdaptations(response, strategy, cognitiveState) {
    try {
      const adaptedResponse = { ...response }
      
      // Apply strategy-based adaptations
      if (strategy.approach === 'support_intensive') {
        adaptedResponse.text = this.addSupportiveLanguage(adaptedResponse.text)
        adaptedResponse.encouragement = true
      }
      
      // Apply cognitive state adaptations
      if (cognitiveState.confusion > 60) {
        adaptedResponse.text = this.simplifyLanguage(adaptedResponse.text)
        adaptedResponse.additionalExamples = true
      }
      
      if (cognitiveState.attention < 50) {
        adaptedResponse.interactiveElements = this.addInteractiveElements(adaptedResponse)
        adaptedResponse.engagementBoosters = true
      }
      
      if (cognitiveState.fatigue > 70) {
        adaptedResponse.text = this.makeMoreConcise(adaptedResponse.text)
        adaptedResponse.breakSuggestion = true
      }
      
      return adaptedResponse
    } catch (error) {
      console.error('Tutoring adaptations failed:', error)
      return response
    }
  }

  addSupportiveLanguage(text) {
    const supportivePhrases = [
      "You're doing great! ",
      "This is a challenging concept, and you're handling it well. ",
      "I believe in your ability to understand this. ",
      "Let's work through this together. "
    ]
    
    const randomPhrase = supportivePhrases[Math.floor(Math.random() * supportivePhrases.length)]
    return randomPhrase + text
  }

  simplifyLanguage(text) {
    // Simplified language processing
    return text
      .replace(/utilize/g, 'use')
      .replace(/demonstrate/g, 'show')
      .replace(/comprehend/g, 'understand')
      .replace(/facilitate/g, 'help')
  }

  addInteractiveElements(response) {
    return [
      {
        type: 'quick_poll',
        question: 'Does this explanation make sense so far?',
        options: ['Yes, clear!', 'Somewhat', 'Need more help']
      },
      {
        type: 'concept_check',
        question: 'Can you think of a real-world example?',
        inputType: 'text'
      }
    ]
  }

  makeMoreConcise(text) {
    // Simplify and shorten text for fatigued users
    const sentences = text.split('. ')
    const conciseSentences = sentences.slice(0, Math.ceil(sentences.length / 2))
    return conciseSentences.join('. ') + (conciseSentences.length < sentences.length ? '...' : '')
  }

  updateLearningProgress(session, messageAnalysis, response) {
    try {
      const progress = session.learningProgress
      
      // Update concept understanding
      if (messageAnalysis.intent === 'explanation_request') {
        progress.conceptsExplored = (progress.conceptsExplored || 0) + 1
      }
      
      // Update interaction quality
      progress.interactionQuality = this.calculateInteractionQuality(messageAnalysis, response)
      
      // Update learning velocity
      progress.learningVelocity = this.calculateLearningVelocity(session)
      
      // Update comprehension indicators
      progress.comprehensionIndicators = this.updateComprehensionIndicators(
        progress.comprehensionIndicators || {},
        messageAnalysis,
        response
      )
      
    } catch (error) {
      console.error('Learning progress update failed:', error)
    }
  }

  calculateInteractionQuality(messageAnalysis, response) {
    let quality = 50 // Base quality
    
    if (messageAnalysis.complexity === 'high') quality += 20
    if (response.confidence > 0.8) quality += 15
    if (response.adaptations?.length > 0) quality += 10
    if (messageAnalysis.emotionalTone === 'positive') quality += 5
    
    return Math.min(100, quality)
  }

  calculateLearningVelocity(session) {
    const sessionDuration = Date.now() - session.startTime
    const conceptsCovered = session.learningProgress.conceptsExplored || 0
    
    if (sessionDuration === 0) return 0
    
    return (conceptsCovered / (sessionDuration / 60000)) * 60 // Concepts per hour
  }

  updateComprehensionIndicators(indicators, messageAnalysis, response) {
    const updated = { ...indicators }
    
    // Update based on question types
    if (messageAnalysis.intent === 'explanation_request') {
      updated.explanationRequests = (updated.explanationRequests || 0) + 1
    }
    
    if (messageAnalysis.intent === 'help_request') {
      updated.helpRequests = (updated.helpRequests || 0) + 1
    }
    
    // Update based on response quality
    if (response.confidence > 0.8) {
      updated.highConfidenceResponses = (updated.highConfidenceResponses || 0) + 1
    }
    
    return updated
  }

  async generateFollowUpInsights(session, response) {
    try {
      const insights = []
      
      // Analyze session patterns
      const sessionAnalysis = this.analyzeSessionPatterns(session)
      
      if (sessionAnalysis.confusionTrend === 'increasing') {
        insights.push({
          type: 'confusion_alert',
          message: 'Confusion levels are increasing - consider simplifying approach',
          priority: 'medium',
          actionable: true
        })
      }
      
      if (sessionAnalysis.engagementTrend === 'decreasing') {
        insights.push({
          type: 'engagement_alert',
          message: 'Engagement is declining - try more interactive content',
          priority: 'medium',
          actionable: true
        })
      }
      
      // Generate AI-powered insights
      const aiInsights = await geminiService.analyzeStudentProgress(
        {
          sessionData: session,
          recentResponse: response
        },
        session.conversationHistory
      )
      
      insights.push(...(aiInsights.insights || []).map(insight => ({
        type: 'ai_insight',
        message: insight.text || insight,
        priority: 'low',
        source: 'ai_analysis'
      })))
      
      return insights
    } catch (error) {
      console.error('Follow-up insights generation failed:', error)
      return []
    }
  }

  analyzeSessionPatterns(session) {
    const history = session.conversationHistory
    
    if (history.length < 4) {
      return { insufficient_data: true }
    }
    
    // Analyze trends in the last few interactions
    const recentInteractions = history.slice(-6)
    const userMessages = recentInteractions.filter(msg => msg.sender === 'user')
    
    return {
      confusionTrend: this.detectConfusionTrend(userMessages),
      engagementTrend: this.detectEngagementTrend(userMessages),
      questionComplexity: this.analyzeQuestionComplexity(userMessages),
      learningProgression: this.assessLearningProgression(recentInteractions)
    }
  }

  detectConfusionTrend(userMessages) {
    const confusionIndicators = ['confused', "don't understand", 'unclear', 'lost']
    
    let confusionCount = 0
    userMessages.forEach(msg => {
      const lowerText = msg.text.toLowerCase()
      if (confusionIndicators.some(indicator => lowerText.includes(indicator))) {
        confusionCount++
      }
    })
    
    const confusionRate = confusionCount / userMessages.length
    
    if (confusionRate > 0.5) return 'increasing'
    if (confusionRate > 0.2) return 'moderate'
    return 'low'
  }

  detectEngagementTrend(userMessages) {
    const engagementIndicators = ['interesting', 'cool', 'awesome', 'more', 'tell me']
    
    let engagementCount = 0
    userMessages.forEach(msg => {
      const lowerText = msg.text.toLowerCase()
      if (engagementIndicators.some(indicator => lowerText.includes(indicator))) {
        engagementCount++
      }
    })
    
    const engagementRate = engagementCount / userMessages.length
    
    if (engagementRate > 0.3) return 'increasing'
    if (engagementRate > 0.1) return 'stable'
    return 'decreasing'
  }

  analyzeQuestionComplexity(userMessages) {
    const complexities = userMessages.map(msg => this.assessComplexity(msg.text))
    
    const complexityScores = complexities.map(c => 
      c === 'high' ? 3 : c === 'medium' ? 2 : 1
    )
    
    const averageComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length
    
    return averageComplexity > 2.5 ? 'increasing' : averageComplexity > 1.5 ? 'stable' : 'decreasing'
  }

  assessLearningProgression(interactions) {
    // Analyze if student is progressing through concepts
    const aiResponses = interactions.filter(msg => msg.sender === 'ai_tutor')
    
    const conceptsIntroduced = aiResponses.filter(response => 
      response.type === 'explanation_request' || response.type === 'new_concept'
    ).length
    
    return {
      conceptsIntroduced,
      progressionRate: conceptsIntroduced / (interactions.length / 2), // Concepts per exchange
      readinessForAdvancement: conceptsIntroduced > 2 && this.detectConfusionTrend(interactions) === 'low'
    }
  }

  calculateSessionProgress(session) {
    const progress = session.learningProgress
    
    return {
      timeElapsed: Date.now() - session.startTime,
      conceptsExplored: progress.conceptsExplored || 0,
      interactionQuality: progress.interactionQuality || 50,
      learningVelocity: progress.learningVelocity || 0,
      overallProgress: this.calculateOverallProgress(progress),
      nextMilestone: this.identifyNextMilestone(progress)
    }
  }

  calculateOverallProgress(progress) {
    const factors = [
      progress.conceptsExplored || 0,
      progress.interactionQuality || 50,
      (progress.learningVelocity || 0) * 10
    ]
    
    return factors.reduce((a, b) => a + b, 0) / factors.length
  }

  identifyNextMilestone(progress) {
    const conceptsExplored = progress.conceptsExplored || 0
    
    if (conceptsExplored < 3) {
      return 'Complete basic concept exploration'
    } else if (conceptsExplored < 6) {
      return 'Demonstrate understanding through examples'
    } else {
      return 'Apply concepts to practical problems'
    }
  }

  generateNextStepRecommendations(session, context) {
    const recommendations = []
    
    const progress = session.learningProgress
    const cognitiveState = context.cognitiveState
    
    // Based on learning progress
    if (progress.conceptsExplored > 3 && progress.interactionQuality > 70) {
      recommendations.push({
        type: 'advancement',
        message: 'Ready for more advanced concepts',
        action: 'introduce_advanced_topic',
        priority: 'medium'
      })
    }
    
    // Based on cognitive state
    if (cognitiveState.fatigue > 70) {
      recommendations.push({
        type: 'wellness',
        message: 'Take a break to maintain learning effectiveness',
        action: 'suggest_break',
        priority: 'high'
      })
    }
    
    if (cognitiveState.engagement < 40) {
      recommendations.push({
        type: 'engagement',
        message: 'Try a different learning approach to boost engagement',
        action: 'change_method',
        priority: 'medium'
      })
    }
    
    return recommendations
  }

  getTutoringCapabilities() {
    return {
      aiPowered: {
        personalizedExplanations: true,
        adaptiveQuestioning: true,
        intelligentFeedback: true,
        contextualSupport: true
      },
      mlEnhanced: {
        performancePrediction: true,
        learningPathOptimization: true,
        cognitiveStateAnalysis: true,
        adaptiveContentGeneration: true
      },
      realTimeAdaptation: {
        difficultyAdjustment: true,
        explanationStyle: true,
        interactivityLevel: true,
        pacingControl: true
      },
      comprehensiveSupport: {
        conceptualHelp: true,
        proceduralGuidance: true,
        motivationalSupport: true,
        wellnessIntegration: true
      }
    }
  }

  async endTutoringSession(sessionId) {
    try {
      const session = this.tutoringSessions.get(sessionId)
      if (!session) {
        throw new Error('Session not found')
      }
      
      // Generate session summary
      const sessionSummary = await this.generateSessionSummary(session)
      
      // Update learning profile
      await this.updateLearningProfile(session.userId, session)
      
      // Clean up session
      this.tutoringSessions.delete(sessionId)
      
      return {
        sessionSummary,
        learningProgress: session.learningProgress,
        recommendations: sessionSummary.recommendations,
        nextSessionPreparation: sessionSummary.nextSessionPrep
      }
      
    } catch (error) {
      console.error('Tutoring session end failed:', error)
      throw new Error('Failed to end tutoring session')
    }
  }

  async generateSessionSummary(session) {
    try {
      const summary = {
        sessionDuration: Date.now() - session.startTime,
        conceptsCovered: session.learningProgress.conceptsExplored || 0,
        interactionQuality: session.learningProgress.interactionQuality || 50,
        adaptationsMade: session.adaptations.length,
        keyInsights: session.aiInsights.slice(-3),
        learningOutcomes: this.identifyLearningOutcomes(session),
        recommendations: this.generateSessionRecommendations(session),
        nextSessionPrep: this.prepareNextSession(session)
      }
      
      // Enhanced summary with AI
      const aiSummary = await geminiService.analyzeStudentProgress(
        { sessionData: session },
        session.conversationHistory
      )
      
      summary.aiGeneratedSummary = aiSummary.analysis || 'Session completed successfully'
      summary.aiRecommendations = aiSummary.recommendations || []
      
      return summary
    } catch (error) {
      console.error('Session summary generation failed:', error)
      return { error: error.message }
    }
  }

  identifyLearningOutcomes(session) {
    const outcomes = []
    
    const conceptsExplored = session.learningProgress.conceptsExplored || 0
    const interactionQuality = session.learningProgress.interactionQuality || 50
    
    if (conceptsExplored > 0) {
      outcomes.push(`Explored ${conceptsExplored} new concepts`)
    }
    
    if (interactionQuality > 70) {
      outcomes.push('High-quality learning interactions achieved')
    }
    
    if (session.adaptations.length > 0) {
      outcomes.push(`${session.adaptations.length} personalized adaptations applied`)
    }
    
    return outcomes
  }

  generateSessionRecommendations(session) {
    const recommendations = []
    
    const progress = session.learningProgress
    
    if (progress.conceptsExplored > 3) {
      recommendations.push('Practice applying concepts to real-world scenarios')
    }
    
    if (progress.interactionQuality < 60) {
      recommendations.push('Focus on asking more specific questions')
    }
    
    if (session.adaptations.length > 5) {
      recommendations.push('Consider adjusting study environment or schedule')
    }
    
    return recommendations
  }

  prepareNextSession(session) {
    return {
      suggestedTopics: this.suggestNextTopics(session),
      preparationActivities: this.suggestPreparationActivities(session),
      optimalTiming: this.suggestOptimalTiming(session),
      environmentOptimization: this.suggestEnvironmentOptimization(session)
    }
  }

  suggestNextTopics(session) {
    const conceptsExplored = session.learningProgress.conceptsExplored || 0
    
    if (conceptsExplored < 3) {
      return ['Continue with foundational concepts', 'Review current material']
    } else {
      return ['Advanced applications', 'Practical exercises', 'Integration concepts']
    }
  }

  suggestPreparationActivities(session) {
    return [
      'Review key concepts from this session',
      'Prepare specific questions about challenging topics',
      'Gather any materials or examples you want to discuss'
    ]
  }

  suggestOptimalTiming(session) {
    const sessionDuration = Date.now() - session.startTime
    const optimalDuration = 45 * 60 * 1000 // 45 minutes in milliseconds
    
    if (sessionDuration > optimalDuration * 1.5) {
      return 'Consider shorter sessions for better focus'
    } else if (sessionDuration < optimalDuration * 0.5) {
      return 'Longer sessions might allow for deeper exploration'
    } else {
      return 'Current session length is optimal'
    }
  }

  suggestEnvironmentOptimization(session) {
    const adaptations = session.adaptations
    
    const suggestions = []
    
    if (adaptations.some(a => a.type === 'attention_support')) {
      suggestions.push('Minimize distractions in study environment')
    }
    
    if (adaptations.some(a => a.type === 'fatigue_management')) {
      suggestions.push('Ensure proper lighting and comfortable seating')
    }
    
    return suggestions
  }

  async updateLearningProfile(userId, session) {
    try {
      const profile = this.learningProfiles.get(userId) || this.createLearningProfile(userId)
      
      // Update with session data
      profile.totalSessions++
      profile.totalInteractions += session.conversationHistory.length
      profile.averageSessionDuration = (profile.averageSessionDuration + (Date.now() - session.startTime)) / 2
      profile.conceptsLearned += session.learningProgress.conceptsExplored || 0
      
      // Update learning patterns
      this.updateLearningPatterns(profile, session)
      
      // Update adaptive strategies
      this.updateAdaptiveStrategies(userId, session)
      
      this.learningProfiles.set(userId, profile)
      
    } catch (error) {
      console.error('Learning profile update failed:', error)
    }
  }

  createLearningProfile(userId) {
    return {
      userId,
      totalSessions: 0,
      totalInteractions: 0,
      averageSessionDuration: 0,
      conceptsLearned: 0,
      learningPatterns: {},
      adaptiveStrategies: {},
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  }

  updateLearningPatterns(profile, session) {
    const patterns = profile.learningPatterns
    
    // Update question patterns
    const userMessages = session.conversationHistory.filter(msg => msg.sender === 'user')
    const questionTypes = userMessages.map(msg => this.classifyIntent(msg.text))
    
    questionTypes.forEach(type => {
      patterns[type] = (patterns[type] || 0) + 1
    })
    
    // Update interaction quality patterns
    patterns.averageInteractionQuality = (
      (patterns.averageInteractionQuality || 50) + 
      (session.learningProgress.interactionQuality || 50)
    ) / 2
  }

  updateAdaptiveStrategies(userId, session) {
    const strategies = this.adaptiveStrategies.get(userId) || {}
    
    // Record which adaptations were effective
    session.adaptations.forEach(adaptation => {
      if (!strategies[adaptation.type]) {
        strategies[adaptation.type] = { attempts: 0, successes: 0 }
      }
      
      strategies[adaptation.type].attempts++
      
      // Mock effectiveness assessment - in production would use actual feedback
      if (Math.random() > 0.3) { // 70% success rate
        strategies[adaptation.type].successes++
      }
    })
    
    this.adaptiveStrategies.set(userId, strategies)
  }

  getTutoringStats() {
    return {
      activeSessions: this.tutoringSessions.size,
      totalProfiles: this.learningProfiles.size,
      averageSessionDuration: this.calculateAverageSessionDuration(),
      mostEffectiveStrategies: this.getMostEffectiveStrategies(),
      userSatisfaction: this.calculateUserSatisfaction()
    }
  }

  calculateAverageSessionDuration() {
    const profiles = Array.from(this.learningProfiles.values())
    if (profiles.length === 0) return 0
    
    const totalDuration = profiles.reduce((sum, profile) => sum + profile.averageSessionDuration, 0)
    return totalDuration / profiles.length
  }

  getMostEffectiveStrategies() {
    const allStrategies = Array.from(this.adaptiveStrategies.values())
    const strategyEffectiveness = {}
    
    allStrategies.forEach(userStrategies => {
      Object.entries(userStrategies).forEach(([strategy, data]) => {
        if (!strategyEffectiveness[strategy]) {
          strategyEffectiveness[strategy] = { attempts: 0, successes: 0 }
        }
        
        strategyEffectiveness[strategy].attempts += data.attempts
        strategyEffectiveness[strategy].successes += data.successes
      })
    })
    
    return Object.entries(strategyEffectiveness)
      .map(([strategy, data]) => ({
        strategy,
        effectiveness: data.attempts > 0 ? data.successes / data.attempts : 0,
        totalAttempts: data.attempts
      }))
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, 5)
  }

  calculateUserSatisfaction() {
    // Mock calculation - in production would use actual user feedback
    return 0.85
  }
}

export default new IntelligentTutoringService()