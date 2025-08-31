// AI-powered optimization utilities for enhanced learning experience

class AIOptimizationEngine {
  constructor() {
    this.optimizationHistory = []
    this.userPreferences = new Map()
    this.performanceBaselines = new Map()
    this.adaptationStrategies = new Map()
  }

  async optimizeLearningExperience(userId, currentState, historicalData) {
    try {
      const optimizations = {
        contentOptimization: await this.optimizeContent(currentState, historicalData),
        scheduleOptimization: await this.optimizeSchedule(userId, historicalData),
        cognitiveOptimization: await this.optimizeCognitiveLoad(currentState),
        wellnessOptimization: await this.optimizeWellness(currentState, historicalData),
        socialOptimization: await this.optimizeSocialLearning(userId, historicalData)
      }

      // Record optimization
      this.recordOptimization(userId, optimizations, currentState)

      return {
        optimizations,
        expectedImprovements: this.calculateExpectedImprovements(optimizations),
        implementationPlan: this.createImplementationPlan(optimizations),
        confidence: this.calculateOptimizationConfidence(optimizations)
      }
    } catch (error) {
      console.error('Learning experience optimization failed:', error)
      throw new Error('Failed to optimize learning experience')
    }
  }

  async optimizeContent(currentState, historicalData) {
    const optimizations = []

    // Difficulty optimization
    const optimalDifficulty = this.calculateOptimalDifficulty(currentState, historicalData)
    if (optimalDifficulty !== currentState.currentDifficulty) {
      optimizations.push({
        type: 'difficulty_adjustment',
        from: currentState.currentDifficulty,
        to: optimalDifficulty,
        reasoning: this.getDifficultyReasoning(currentState, optimalDifficulty),
        expectedImpact: this.estimateDifficultyImpact(optimalDifficulty, currentState)
      })
    }

    // Content format optimization
    const optimalFormat = this.determineOptimalFormat(currentState, historicalData)
    optimizations.push({
      type: 'format_optimization',
      recommendedFormat: optimalFormat,
      reasoning: 'Based on attention patterns and learning style',
      expectedImpact: '+15% engagement'
    })

    // Pacing optimization
    const optimalPacing = this.calculateOptimalPacing(currentState)
    optimizations.push({
      type: 'pacing_adjustment',
      recommendedPacing: optimalPacing,
      reasoning: 'Optimized for cognitive load and fatigue levels',
      expectedImpact: '+10% retention'
    })

    return optimizations
  }

  async optimizeSchedule(userId, historicalData) {
    const optimizations = []

    // Find optimal study times
    const optimalTimes = this.findOptimalStudyTimes(historicalData)
    optimizations.push({
      type: 'schedule_optimization',
      optimalTimes,
      reasoning: 'Based on historical performance patterns',
      expectedImpact: '+20% efficiency'
    })

    // Session length optimization
    const optimalLength = this.calculateOptimalSessionLength(historicalData)
    optimizations.push({
      type: 'session_length',
      recommendedLength: optimalLength,
      reasoning: 'Balances attention span with learning objectives',
      expectedImpact: '+12% focus'
    })

    // Break frequency optimization
    const optimalBreaks = this.calculateOptimalBreakFrequency(historicalData)
    optimizations.push({
      type: 'break_optimization',
      recommendedFrequency: optimalBreaks,
      reasoning: 'Prevents fatigue while maintaining momentum',
      expectedImpact: '+8% sustained attention'
    })

    return optimizations
  }

  async optimizeCognitiveLoad(currentState) {
    const optimizations = []

    const currentLoad = currentState.cognitiveLoad || 50
    const optimalLoad = this.calculateOptimalCognitiveLoad(currentState)

    if (Math.abs(currentLoad - optimalLoad) > 10) {
      optimizations.push({
        type: 'cognitive_load_adjustment',
        currentLoad,
        optimalLoad,
        adjustmentStrategy: currentLoad > optimalLoad ? 'reduce_complexity' : 'increase_challenge',
        reasoning: 'Optimize for peak learning efficiency',
        expectedImpact: '+18% learning efficiency'
      })
    }

    // Attention optimization
    if (currentState.attention < 70) {
      optimizations.push({
        type: 'attention_enhancement',
        strategies: [
          'Increase interactivity',
          'Add visual elements',
          'Implement micro-breaks',
          'Gamify content'
        ],
        reasoning: 'Low attention detected',
        expectedImpact: '+25% attention'
      })
    }

    return optimizations
  }

  async optimizeWellness(currentState, historicalData) {
    const optimizations = []

    // Stress optimization
    if (currentState.stress > 6) {
      optimizations.push({
        type: 'stress_reduction',
        interventions: [
          'Breathing exercises',
          'Progressive muscle relaxation',
          'Mindfulness meditation',
          'Environmental adjustments'
        ],
        timing: 'immediate',
        expectedImpact: '-30% stress, +15% focus'
      })
    }

    // Energy optimization
    if (currentState.energy < 5) {
      optimizations.push({
        type: 'energy_enhancement',
        strategies: [
          'Light physical exercise',
          'Hydration reminder',
          'Healthy snack suggestion',
          'Power nap (10-15 min)'
        ],
        timing: 'before_next_session',
        expectedImpact: '+40% energy, +20% engagement'
      })
    }

    // Mood optimization
    const moodTrend = this.analyzeMoodTrend(historicalData)
    if (moodTrend === 'declining') {
      optimizations.push({
        type: 'mood_enhancement',
        activities: [
          'Gratitude practice',
          'Achievement review',
          'Social connection',
          'Enjoyable learning activities'
        ],
        reasoning: 'Declining mood trend detected',
        expectedImpact: '+25% mood, +15% motivation'
      })
    }

    return optimizations
  }

  async optimizeSocialLearning(userId, historicalData) {
    const optimizations = []

    const socialEngagement = this.calculateSocialEngagement(historicalData)
    
    if (socialEngagement < 0.3) {
      optimizations.push({
        type: 'social_engagement',
        recommendations: [
          'Join study groups',
          'Participate in discussions',
          'Peer tutoring',
          'Collaborative projects'
        ],
        reasoning: 'Low social engagement detected',
        expectedImpact: '+30% motivation, +20% retention'
      })
    }

    // Peer learning optimization
    const learningStyle = this.inferLearningStyle(historicalData)
    if (learningStyle.collaborativePreference > 0.7) {
      optimizations.push({
        type: 'collaborative_learning',
        strategies: [
          'Group problem solving',
          'Peer explanation exercises',
          'Collaborative note-taking',
          'Study buddy matching'
        ],
        reasoning: 'High collaborative learning preference',
        expectedImpact: '+22% understanding, +18% engagement'
      })
    }

    return optimizations
  }

  calculateOptimalDifficulty(currentState, historicalData) {
    const attention = currentState.attention || 50
    const confusion = currentState.confusion || 0
    const performance = historicalData.averageScore || 70

    if (confusion > 60 || attention < 40) {
      return 'easy'
    } else if (performance > 85 && attention > 80 && confusion < 20) {
      return 'challenging'
    } else {
      return 'medium'
    }
  }

  getDifficultyReasoning(currentState, optimalDifficulty) {
    const reasons = []
    
    if (currentState.confusion > 60) {
      reasons.push('High confusion indicates need for simpler content')
    }
    if (currentState.attention < 40) {
      reasons.push('Low attention suggests cognitive overload')
    }
    if (currentState.performance > 85) {
      reasons.push('High performance indicates readiness for challenge')
    }
    
    return reasons.join('; ')
  }

  estimateDifficultyImpact(difficulty, currentState) {
    const impacts = {
      'easy': '+20% comprehension, -10% engagement',
      'medium': 'Balanced learning experience',
      'challenging': '+15% skill development, +5% engagement'
    }
    
    return impacts[difficulty] || 'Neutral impact'
  }

  determineOptimalFormat(currentState, historicalData) {
    const learningStyle = this.inferLearningStyle(historicalData)
    const attention = currentState.attention || 50
    
    if (learningStyle.visual > 0.7 || currentState.confusion > 50) {
      return 'visual_heavy'
    } else if (attention < 50) {
      return 'interactive'
    } else if (learningStyle.auditory > 0.7) {
      return 'audio_enhanced'
    } else {
      return 'mixed_media'
    }
  }

  calculateOptimalPacing(currentState) {
    const fatigue = currentState.fatigue || 0
    const cognitiveLoad = currentState.cognitiveLoad || 50
    
    if (fatigue > 70 || cognitiveLoad > 80) {
      return 'slow'
    } else if (fatigue < 30 && cognitiveLoad < 40) {
      return 'fast'
    } else {
      return 'moderate'
    }
  }

  findOptimalStudyTimes(historicalData) {
    // Mock analysis - in production would analyze actual performance by time
    const timeSlots = [
      { time: '09:00', performance: 85, attention: 90 },
      { time: '11:00', performance: 82, attention: 85 },
      { time: '14:00', performance: 78, attention: 75 },
      { time: '16:00', performance: 80, attention: 80 },
      { time: '19:00', performance: 70, attention: 65 }
    ]
    
    return timeSlots
      .sort((a, b) => (b.performance + b.attention) - (a.performance + a.attention))
      .slice(0, 3)
      .map(slot => slot.time)
  }

  calculateOptimalSessionLength(historicalData) {
    // Analyze historical data to find optimal session length
    const sessionLengths = historicalData.sessions?.map(s => s.duration) || [45]
    const performances = historicalData.sessions?.map(s => s.performance) || [70]
    
    // Find length with best performance
    const lengthPerformance = {}
    sessionLengths.forEach((length, index) => {
      const bucket = Math.floor(length / 15) * 15 // Group into 15-minute buckets
      if (!lengthPerformance[bucket]) {
        lengthPerformance[bucket] = []
      }
      lengthPerformance[bucket].push(performances[index])
    })
    
    // Find bucket with highest average performance
    let bestLength = 45
    let bestPerformance = 0
    
    Object.entries(lengthPerformance).forEach(([length, perfs]) => {
      const avgPerf = perfs.reduce((a, b) => a + b, 0) / perfs.length
      if (avgPerf > bestPerformance) {
        bestPerformance = avgPerf
        bestLength = parseInt(length)
      }
    })
    
    return bestLength
  }

  calculateOptimalBreakFrequency(historicalData) {
    // Analyze attention patterns to determine optimal break frequency
    const attentionData = historicalData.cognitiveHistory?.map(h => h.attention) || []
    
    if (attentionData.length === 0) return 25 // Default Pomodoro
    
    // Find when attention typically drops
    const attentionDropPoint = this.findAttentionDropPoint(attentionData)
    
    return Math.max(15, Math.min(45, attentionDropPoint - 5)) // 5 minutes before drop
  }

  findAttentionDropPoint(attentionData) {
    // Simplified analysis - find when attention drops below 70%
    for (let i = 0; i < attentionData.length; i++) {
      if (attentionData[i] < 70) {
        return (i + 1) * 5 // Assuming 5-minute intervals
      }
    }
    return 25 // Default
  }

  calculateOptimalCognitiveLoad(currentState) {
    const attention = currentState.attention || 50
    const engagement = currentState.engagement || 50
    const fatigue = currentState.fatigue || 0
    
    // Optimal cognitive load is 60-75% for most learners
    const baseOptimal = 67.5
    
    // Adjust based on current state
    let adjustment = 0
    
    if (attention > 80) adjustment += 10 // Can handle more
    if (attention < 50) adjustment -= 15 // Reduce load
    if (fatigue > 60) adjustment -= 20 // Significantly reduce
    if (engagement < 40) adjustment -= 10 // Reduce to prevent overwhelm
    
    return Math.max(30, Math.min(85, baseOptimal + adjustment))
  }

  analyzeMoodTrend(historicalData) {
    const moodData = historicalData.wellnessHistory?.map(w => w.mood) || []
    
    if (moodData.length < 5) return 'stable'
    
    const recent = moodData.slice(-5)
    const older = moodData.slice(-10, -5)
    
    if (older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    
    if (change > 10) return 'improving'
    if (change < -10) return 'declining'
    return 'stable'
  }

  calculateSocialEngagement(historicalData) {
    const socialMetrics = [
      historicalData.communityPosts || 0,
      historicalData.discussionParticipation || 0,
      historicalData.peerInteractions || 0,
      historicalData.groupActivities || 0
    ]
    
    const maxPossible = 20 // Assume max 20 activities per metric
    const totalEngagement = socialMetrics.reduce((a, b) => a + b, 0)
    
    return Math.min(1, totalEngagement / (maxPossible * socialMetrics.length))
  }

  inferLearningStyle(historicalData) {
    // Mock learning style inference
    return {
      visual: 0.8,
      auditory: 0.4,
      kinesthetic: 0.6,
      collaborativePreference: 0.7,
      independentPreference: 0.5
    }
  }

  calculateExpectedImprovements(optimizations) {
    const improvements = {
      performance: 0,
      engagement: 0,
      retention: 0,
      satisfaction: 0,
      efficiency: 0
    }

    Object.values(optimizations).flat().forEach(opt => {
      // Parse expected impact and add to improvements
      const impact = opt.expectedImpact || ''
      
      if (impact.includes('performance')) {
        const match = impact.match(/\+(\d+)%.*performance/)
        if (match) improvements.performance += parseInt(match[1])
      }
      
      if (impact.includes('engagement')) {
        const match = impact.match(/\+(\d+)%.*engagement/)
        if (match) improvements.engagement += parseInt(match[1])
      }
      
      if (impact.includes('retention')) {
        const match = impact.match(/\+(\d+)%.*retention/)
        if (match) improvements.retention += parseInt(match[1])
      }
      
      if (impact.includes('efficiency')) {
        const match = impact.match(/\+(\d+)%.*efficiency/)
        if (match) improvements.efficiency += parseInt(match[1])
      }
    })

    return improvements
  }

  createImplementationPlan(optimizations) {
    const plan = {
      immediate: [], // 0-1 day
      shortTerm: [], // 1-7 days
      mediumTerm: [], // 1-4 weeks
      longTerm: [] // 1+ months
    }

    Object.values(optimizations).flat().forEach(opt => {
      const timeframe = this.determineImplementationTimeframe(opt)
      plan[timeframe].push({
        optimization: opt,
        steps: this.generateImplementationSteps(opt),
        resources: this.identifyRequiredResources(opt),
        successMetrics: this.defineSuccessMetrics(opt)
      })
    })

    return plan
  }

  determineImplementationTimeframe(optimization) {
    const immediateTypes = ['stress_reduction', 'fatigue_management', 'attention_enhancement']
    const shortTermTypes = ['difficulty_adjustment', 'format_optimization', 'pacing_adjustment']
    const mediumTermTypes = ['schedule_optimization', 'social_engagement']
    
    if (immediateTypes.includes(optimization.type)) return 'immediate'
    if (shortTermTypes.includes(optimization.type)) return 'shortTerm'
    if (mediumTermTypes.includes(optimization.type)) return 'mediumTerm'
    return 'longTerm'
  }

  generateImplementationSteps(optimization) {
    const stepMap = {
      difficulty_adjustment: [
        'Assess current comprehension level',
        'Adjust content complexity',
        'Monitor understanding',
        'Fine-tune as needed'
      ],
      attention_enhancement: [
        'Identify attention patterns',
        'Implement focus techniques',
        'Monitor attention metrics',
        'Adjust strategies based on results'
      ],
      stress_reduction: [
        'Identify stress triggers',
        'Implement stress reduction techniques',
        'Monitor stress levels',
        'Adjust techniques as needed'
      ]
    }
    
    return stepMap[optimization.type] || ['Plan implementation', 'Execute changes', 'Monitor results', 'Adjust as needed']
  }

  identifyRequiredResources(optimization) {
    const resourceMap = {
      difficulty_adjustment: ['Content library access', 'Assessment tools'],
      attention_enhancement: ['Focus training materials', 'Environment optimization guide'],
      stress_reduction: ['Relaxation audio', 'Breathing exercise guide'],
      schedule_optimization: ['Calendar integration', 'Reminder system']
    }
    
    return resourceMap[optimization.type] || ['Standard learning resources']
  }

  defineSuccessMetrics(optimization) {
    const metricMap = {
      difficulty_adjustment: ['Comprehension rate', 'Completion time', 'Error rate'],
      attention_enhancement: ['Attention score', 'Focus duration', 'Distraction frequency'],
      stress_reduction: ['Stress level', 'Heart rate variability', 'Self-reported wellness'],
      schedule_optimization: ['Session attendance', 'Performance consistency', 'Satisfaction rating']
    }
    
    return metricMap[optimization.type] || ['General performance metrics']
  }

  calculateOptimizationConfidence(optimizations) {
    let totalConfidence = 0
    let count = 0

    Object.values(optimizations).flat().forEach(opt => {
      if (opt.confidence) {
        totalConfidence += opt.confidence
        count++
      } else {
        // Assign default confidence based on optimization type
        const defaultConfidences = {
          difficulty_adjustment: 0.85,
          attention_enhancement: 0.75,
          stress_reduction: 0.9,
          schedule_optimization: 0.7,
          format_optimization: 0.8
        }
        
        totalConfidence += defaultConfidences[opt.type] || 0.7
        count++
      }
    })

    return count > 0 ? totalConfidence / count : 0.7
  }

  recordOptimization(userId, optimizations, currentState) {
    const record = {
      userId,
      timestamp: new Date(),
      optimizations,
      currentState,
      expectedImprovements: this.calculateExpectedImprovements(optimizations),
      implemented: false,
      results: null
    }

    this.optimizationHistory.push(record)
    
    // Keep only last 50 records
    if (this.optimizationHistory.length > 50) {
      this.optimizationHistory.shift()
    }
  }

  async evaluateOptimizationEffectiveness(userId, optimizationId, actualResults) {
    try {
      const optimization = this.optimizationHistory.find(opt => 
        opt.userId === userId && opt.timestamp.getTime() === optimizationId
      )

      if (!optimization) {
        throw new Error('Optimization record not found')
      }

      // Compare expected vs actual results
      const effectiveness = this.compareResults(optimization.expectedImprovements, actualResults)
      
      // Update optimization record
      optimization.results = actualResults
      optimization.effectiveness = effectiveness
      optimization.implemented = true

      // Learn from results to improve future optimizations
      this.updateOptimizationStrategies(optimization, effectiveness)

      return {
        effectiveness,
        insights: this.generateEffectivenessInsights(optimization, effectiveness),
        recommendations: this.generateFutureOptimizationRecommendations(effectiveness)
      }
    } catch (error) {
      console.error('Optimization evaluation failed:', error)
      throw new Error('Failed to evaluate optimization effectiveness')
    }
  }

  compareResults(expected, actual) {
    const comparison = {}
    
    Object.keys(expected).forEach(metric => {
      const expectedValue = expected[metric]
      const actualValue = actual[metric] || 0
      
      comparison[metric] = {
        expected: expectedValue,
        actual: actualValue,
        difference: actualValue - expectedValue,
        effectiveness: actualValue / Math.max(1, expectedValue)
      }
    })

    // Calculate overall effectiveness
    const effectivenessScores = Object.values(comparison).map(c => c.effectiveness)
    comparison.overall = effectivenessScores.reduce((a, b) => a + b, 0) / effectivenessScores.length

    return comparison
  }

  updateOptimizationStrategies(optimization, effectiveness) {
    const strategyKey = optimization.optimizations.type || 'general'
    
    if (!this.adaptationStrategies.has(strategyKey)) {
      this.adaptationStrategies.set(strategyKey, {
        successCount: 0,
        totalAttempts: 0,
        averageEffectiveness: 0,
        bestPractices: [],
        lessonsLearned: []
      })
    }

    const strategy = this.adaptationStrategies.get(strategyKey)
    strategy.totalAttempts++
    
    if (effectiveness.overall > 0.8) {
      strategy.successCount++
      strategy.bestPractices.push(optimization.optimizations)
    } else if (effectiveness.overall < 0.5) {
      strategy.lessonsLearned.push({
        optimization: optimization.optimizations,
        issue: 'Low effectiveness',
        improvement: 'Adjust parameters or approach'
      })
    }

    strategy.averageEffectiveness = (strategy.averageEffectiveness * (strategy.totalAttempts - 1) + effectiveness.overall) / strategy.totalAttempts
    
    this.adaptationStrategies.set(strategyKey, strategy)
  }

  generateEffectivenessInsights(optimization, effectiveness) {
    const insights = []

    if (effectiveness.overall > 0.9) {
      insights.push('Optimization was highly effective - consider similar approaches')
    } else if (effectiveness.overall > 0.7) {
      insights.push('Optimization was moderately effective - minor adjustments may improve results')
    } else if (effectiveness.overall > 0.5) {
      insights.push('Optimization had limited effectiveness - consider alternative approaches')
    } else {
      insights.push('Optimization was not effective - review strategy and try different approach')
    }

    // Specific metric insights
    Object.entries(effectiveness).forEach(([metric, data]) => {
      if (metric !== 'overall' && data.effectiveness > 1.2) {
        insights.push(`${metric} exceeded expectations by ${Math.round((data.effectiveness - 1) * 100)}%`)
      } else if (data.effectiveness < 0.8) {
        insights.push(`${metric} underperformed - consider targeted improvements`)
      }
    })

    return insights
  }

  generateFutureOptimizationRecommendations(effectiveness) {
    const recommendations = []

    if (effectiveness.overall > 0.8) {
      recommendations.push({
        type: 'continue_approach',
        description: 'Continue with similar optimization strategies',
        confidence: 0.9
      })
    } else {
      recommendations.push({
        type: 'adjust_approach',
        description: 'Modify optimization parameters for better results',
        confidence: 0.7
      })
    }

    // Specific recommendations based on metric performance
    Object.entries(effectiveness).forEach(([metric, data]) => {
      if (metric !== 'overall' && data.effectiveness < 0.6) {
        recommendations.push({
          type: 'metric_focus',
          description: `Focus specifically on improving ${metric}`,
          targetMetric: metric,
          confidence: 0.8
        })
      }
    })

    return recommendations
  }

  getOptimizationStats() {
    return {
      totalOptimizations: this.optimizationHistory.length,
      successRate: this.calculateSuccessRate(),
      averageEffectiveness: this.calculateAverageEffectiveness(),
      topStrategies: this.getTopStrategies(),
      recentTrends: this.analyzeRecentTrends()
    }
  }

  calculateSuccessRate() {
    const implemented = this.optimizationHistory.filter(opt => opt.implemented)
    const successful = implemented.filter(opt => opt.effectiveness?.overall > 0.7)
    
    return implemented.length > 0 ? successful.length / implemented.length : 0
  }

  calculateAverageEffectiveness() {
    const implemented = this.optimizationHistory.filter(opt => opt.implemented && opt.effectiveness)
    
    if (implemented.length === 0) return 0
    
    const totalEffectiveness = implemented.reduce((sum, opt) => sum + opt.effectiveness.overall, 0)
    return totalEffectiveness / implemented.length
  }

  getTopStrategies() {
    const strategies = Array.from(this.adaptationStrategies.entries())
      .sort(([,a], [,b]) => b.averageEffectiveness - a.averageEffectiveness)
      .slice(0, 5)
    
    return strategies.map(([type, data]) => ({
      type,
      effectiveness: data.averageEffectiveness,
      successRate: data.successCount / data.totalAttempts,
      attempts: data.totalAttempts
    }))
  }

  analyzeRecentTrends() {
    const recentOptimizations = this.optimizationHistory.slice(-10)
    
    if (recentOptimizations.length === 0) return {}
    
    const trends = {
      mostCommonType: this.findMostCommonOptimizationType(recentOptimizations),
      effectivenessTrend: this.calculateEffectivenessTrend(recentOptimizations),
      implementationRate: recentOptimizations.filter(opt => opt.implemented).length / recentOptimizations.length
    }
    
    return trends
  }

  findMostCommonOptimizationType(optimizations) {
    const typeCounts = {}
    
    optimizations.forEach(opt => {
      Object.values(opt.optimizations).flat().forEach(o => {
        typeCounts[o.type] = (typeCounts[o.type] || 0) + 1
      })
    })
    
    return Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, 'unknown')
  }

  calculateEffectivenessTrend(optimizations) {
    const implemented = optimizations.filter(opt => opt.implemented && opt.effectiveness)
    
    if (implemented.length < 3) return 'insufficient_data'
    
    const scores = implemented.map(opt => opt.effectiveness.overall)
    const recent = scores.slice(-3)
    const older = scores.slice(0, -3)
    
    if (older.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    const change = (recentAvg - olderAvg) / olderAvg
    
    if (change > 0.1) return 'improving'
    if (change < -0.1) return 'declining'
    return 'stable'
  }
}

// Utility functions for AI optimization
export const optimizeLearningSession = async (sessionData, userProfile, cognitiveState) => {
  const engine = new AIOptimizationEngine()
  
  try {
    const optimizations = await engine.optimizeLearningExperience(
      userProfile.id,
      cognitiveState,
      sessionData
    )
    
    return optimizations
  } catch (error) {
    console.error('Session optimization failed:', error)
    return null
  }
}

export const generatePersonalizedRecommendations = async (userData, preferences) => {
  try {
    const recommendations = await geminiService.analyzeStudentProgress(userData, [])
    
    return {
      recommendations: recommendations.recommendations || [],
      insights: recommendations.insights || [],
      confidence: recommendations.confidence || 0.7
    }
  } catch (error) {
    console.error('Personalized recommendations failed:', error)
    return { recommendations: [], insights: [], confidence: 0.5 }
  }
}

export const predictOptimalLearningPath = async (userProfile, goals, constraints) => {
  try {
    const learningPath = await geminiService.generateLearningPath(
      goals.subject || 'general',
      userProfile.currentLevel || 'intermediate',
      goals.description || 'comprehensive understanding',
      userProfile.learningStyle || 'visual'
    )
    
    return learningPath
  } catch (error) {
    console.error('Learning path prediction failed:', error)
    return null
  }
}

export const analyzePerformancePatterns = (performanceHistory) => {
  if (!performanceHistory || performanceHistory.length < 5) {
    return { error: 'Insufficient data for pattern analysis' }
  }

  const patterns = {
    trends: analyzeTrends(performanceHistory),
    cycles: identifyCycles(performanceHistory),
    anomalies: detectAnomalies(performanceHistory),
    correlations: findPerformanceCorrelations(performanceHistory)
  }

  return patterns
}

const analyzeTrends = (history) => {
  const scores = history.map(h => h.score || h.performance || 0)
  const timePoints = scores.map((_, index) => index)
  
  // Simple linear regression
  const n = scores.length
  const sumX = timePoints.reduce((a, b) => a + b, 0)
  const sumY = scores.reduce((a, b) => a + b, 0)
  const sumXY = timePoints.reduce((sum, x, i) => sum + x * scores[i], 0)
  const sumX2 = timePoints.reduce((sum, x) => sum + x * x, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  
  return {
    direction: slope > 0.1 ? 'improving' : slope < -0.1 ? 'declining' : 'stable',
    slope,
    strength: Math.abs(slope) > 0.5 ? 'strong' : Math.abs(slope) > 0.2 ? 'moderate' : 'weak'
  }
}

const identifyCycles = (history) => {
  // Simplified cycle detection
  const scores = history.map(h => h.score || h.performance || 0)
  
  // Look for weekly patterns (assuming daily data)
  if (scores.length >= 14) {
    const weeklyAverages = []
    for (let i = 0; i < scores.length - 6; i += 7) {
      const weekScores = scores.slice(i, i + 7)
      weeklyAverages.push(weekScores.reduce((a, b) => a + b, 0) / weekScores.length)
    }
    
    const weeklyVariance = calculateVariance(weeklyAverages)
    
    return {
      weeklyPattern: weeklyVariance < 100 ? 'consistent' : 'variable',
      variance: weeklyVariance,
      averages: weeklyAverages
    }
  }
  
  return { error: 'Insufficient data for cycle analysis' }
}

const detectAnomalies = (history) => {
  const scores = history.map(h => h.score || h.performance || 0)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const stdDev = Math.sqrt(calculateVariance(scores))
  
  const anomalies = []
  
  scores.forEach((score, index) => {
    const zScore = Math.abs((score - mean) / stdDev)
    if (zScore > 2) { // More than 2 standard deviations
      anomalies.push({
        index,
        score,
        zScore,
        type: score > mean ? 'positive_outlier' : 'negative_outlier',
        timestamp: history[index]?.timestamp || new Date()
      })
    }
  })
  
  return anomalies
}

const findPerformanceCorrelations = (history) => {
  // Mock correlation analysis
  return {
    timeOfDay: 0.65,
    dayOfWeek: 0.45,
    sessionLength: -0.32,
    previousPerformance: 0.78
  }
}

const calculateVariance = (values) => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
}

export default new AIOptimizationEngine()