import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Star,
  Zap,
  BookOpen,
  Users,
  Award,
  Eye,
  Heart,
  Settings,
  RefreshCw,
  Filter,
  ChevronRight
} from 'lucide-react'
import geminiService from '../services/geminiService'
import advancedMLService from '../services/advancedMLService'

const SmartRecommendationEngine = ({ 
  userProfile, 
  cognitiveState, 
  learningHistory, 
  wellnessData,
  onRecommendationSelected,
  onSettingsChange 
}) => {
  const [recommendations, setRecommendations] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recommendationSettings, setRecommendationSettings] = useState({
    personalizedLevel: 0.8,
    includeWellness: true,
    includeLearning: true,
    includeSocial: true,
    adaptiveFrequency: 'real-time',
    confidenceThreshold: 0.7
  })
  const [analytics, setAnalytics] = useState({
    totalRecommendations: 0,
    acceptedRecommendations: 0,
    averageRating: 0,
    topCategories: []
  })

  const categories = [
    { id: 'all', label: 'All Recommendations', icon: Star },
    { id: 'learning', label: 'Learning', icon: Brain },
    { id: 'wellness', label: 'Wellness', icon: Heart },
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'performance', label: 'Performance', icon: TrendingUp }
  ]

  useEffect(() => {
    generateRecommendations()
  }, [cognitiveState, userProfile, selectedCategory])

  const generateRecommendations = async () => {
    setIsGenerating(true)
    
    try {
      const allRecommendations = await Promise.all([
        generateLearningRecommendations(),
        generateWellnessRecommendations(),
        generateContentRecommendations(),
        generateSocialRecommendations(),
        generatePerformanceRecommendations()
      ])
      
      const flatRecommendations = allRecommendations.flat()
      const filteredRecommendations = filterRecommendationsByCategory(flatRecommendations)
      const prioritizedRecommendations = prioritizeRecommendations(filteredRecommendations)
      
      setRecommendations(prioritizedRecommendations)
      updateAnalytics(prioritizedRecommendations)
      
    } catch (error) {
      console.error('Recommendation generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateLearningRecommendations = async () => {
    const recommendations = []
    
    try {
      // AI-powered learning recommendations
      const aiRecommendations = await geminiService.analyzeStudentProgress(
        {
          currentPerformance: learningHistory.averageScore || 70,
          studyTime: learningHistory.totalTime || 0,
          completedModules: learningHistory.completedModules || 0,
          cognitiveState
        },
        learningHistory.sessions || []
      )
      
      // ML-powered predictions
      const mlPrediction = await advancedMLService.predictLearningOutcome(
        userProfile,
        learningHistory.currentModule || {},
        learningHistory.cognitiveHistory || []
      )
      
      // Combine AI and ML insights
      recommendations.push({
        id: `learning_${Date.now()}`,
        category: 'learning',
        type: 'ai_insight',
        title: 'Personalized Learning Strategy',
        description: 'AI-generated recommendations based on your learning patterns',
        content: aiRecommendations.insights?.[0]?.text || 'Continue with your current learning approach',
        priority: 'high',
        confidence: aiRecommendations.confidence || 0.8,
        source: 'gemini_ai',
        actions: [
          { label: 'Apply Strategy', action: () => applyLearningStrategy(aiRecommendations) },
          { label: 'Learn More', action: () => showDetailedInsights(aiRecommendations) }
        ],
        metadata: {
          basedOn: ['learning_history', 'cognitive_patterns', 'ai_analysis'],
          estimatedImpact: 'high',
          timeToImplement: '5 minutes'
        }
      })
      
      // ML prediction-based recommendations
      if (mlPrediction.predictedScore < 70) {
        recommendations.push({
          id: `ml_prediction_${Date.now()}`,
          category: 'learning',
          type: 'ml_prediction',
          title: 'Performance Optimization',
          description: `ML models predict ${Math.round(mlPrediction.predictedScore)}% performance`,
          content: mlPrediction.recommendations?.[0]?.message || 'Consider adjusting study approach',
          priority: mlPrediction.riskAssessment.level === 'high' ? 'urgent' : 'medium',
          confidence: mlPrediction.confidence,
          source: 'ml_model',
          actions: [
            { label: 'View Details', action: () => showPredictionDetails(mlPrediction) },
            { label: 'Adjust Approach', action: () => adjustLearningApproach(mlPrediction) }
          ],
          metadata: {
            predictedScore: mlPrediction.predictedScore,
            keyFactors: mlPrediction.factors?.slice(0, 3) || [],
            riskLevel: mlPrediction.riskAssessment.level
          }
        })
      }
      
      // Cognitive state-based recommendations
      if (cognitiveState.attention < 50) {
        recommendations.push({
          id: `attention_${Date.now()}`,
          category: 'learning',
          type: 'cognitive_adaptation',
          title: 'Attention Enhancement',
          description: 'Your attention levels could be improved',
          content: 'Try switching to more interactive content or taking a short break',
          priority: 'medium',
          confidence: 0.9,
          source: 'cognitive_analysis',
          actions: [
            { label: 'Interactive Content', action: () => switchToInteractive() },
            { label: 'Take Break', action: () => suggestBreak() }
          ]
        })
      }
      
      if (cognitiveState.confusion > 60) {
        recommendations.push({
          id: `confusion_${Date.now()}`,
          category: 'learning',
          type: 'cognitive_adaptation',
          title: 'Confusion Resolution',
          description: 'High confusion detected in current topic',
          content: 'Consider requesting simplified explanations or additional examples',
          priority: 'high',
          confidence: 0.85,
          source: 'cognitive_analysis',
          actions: [
            { label: 'Simplify Content', action: () => requestSimplification() },
            { label: 'Get Examples', action: () => requestExamples() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Learning recommendations failed:', error)
    }
    
    return recommendations
  }

  const generateWellnessRecommendations = async () => {
    const recommendations = []
    
    try {
      // AI-powered wellness insights
      const wellnessInsights = await geminiService.generateWellnessInsights(
        wellnessData,
        learningHistory.cognitiveHistory || []
      )
      
      recommendations.push({
        id: `wellness_ai_${Date.now()}`,
        category: 'wellness',
        type: 'ai_wellness',
        title: 'Wellness Optimization',
        description: 'AI-analyzed wellness recommendations',
        content: wellnessInsights.insights || 'Maintain your current wellness practices',
        priority: 'medium',
        confidence: 0.8,
        source: 'gemini_ai',
        actions: [
          { label: 'View Insights', action: () => showWellnessInsights(wellnessInsights) },
          { label: 'Apply Suggestions', action: () => applyWellnessSuggestions(wellnessInsights) }
        ],
        metadata: {
          correlations: wellnessInsights.correlations || [],
          warnings: wellnessInsights.warnings || []
        }
      })
      
      // Fatigue-based recommendations
      if (cognitiveState.fatigue > 70) {
        recommendations.push({
          id: `fatigue_${Date.now()}`,
          category: 'wellness',
          type: 'fatigue_management',
          title: 'Fatigue Management',
          description: 'High fatigue levels detected',
          content: 'Take a 15-20 minute break with light physical activity',
          priority: 'urgent',
          confidence: 0.95,
          source: 'cognitive_analysis',
          actions: [
            { label: 'Start Break Timer', action: () => startBreakTimer(15) },
            { label: 'Breathing Exercise', action: () => startBreathingExercise() }
          ]
        })
      }
      
      // Stress management
      if (wellnessData.averageStress > 7) {
        recommendations.push({
          id: `stress_${Date.now()}`,
          category: 'wellness',
          type: 'stress_management',
          title: 'Stress Reduction',
          description: 'Elevated stress levels detected',
          content: 'Practice stress reduction techniques before continuing study',
          priority: 'high',
          confidence: 0.9,
          source: 'wellness_analysis',
          actions: [
            { label: 'Meditation Guide', action: () => startMeditation() },
            { label: 'Stress Tips', action: () => showStressTips() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Wellness recommendations failed:', error)
    }
    
    return recommendations
  }

  const generateContentRecommendations = async () => {
    const recommendations = []
    
    try {
      // Content difficulty recommendations
      const currentDifficulty = learningHistory.currentModule?.difficulty || 'intermediate'
      const performanceScore = learningHistory.averageScore || 70
      
      if (performanceScore > 85 && cognitiveState.confusion < 30) {
        recommendations.push({
          id: `content_advance_${Date.now()}`,
          category: 'content',
          type: 'difficulty_adjustment',
          title: 'Ready for Advanced Content',
          description: 'Your performance suggests you can handle more challenging material',
          content: 'Consider moving to advanced topics or exploring specialized applications',
          priority: 'medium',
          confidence: 0.8,
          source: 'performance_analysis',
          actions: [
            { label: 'Browse Advanced', action: () => browseAdvancedContent() },
            { label: 'Challenge Mode', action: () => enableChallengeMode() }
          ]
        })
      } else if (performanceScore < 60 || cognitiveState.confusion > 60) {
        recommendations.push({
          id: `content_simplify_${Date.now()}`,
          category: 'content',
          type: 'difficulty_adjustment',
          title: 'Content Simplification',
          description: 'Consider easier content to build confidence',
          content: 'Review fundamentals or try content with more examples and explanations',
          priority: 'high',
          confidence: 0.9,
          source: 'performance_analysis',
          actions: [
            { label: 'Review Basics', action: () => reviewBasics() },
            { label: 'More Examples', action: () => requestMoreExamples() }
          ]
        })
      }
      
      // Learning style recommendations
      const learningStyle = userProfile.learningStyle || 'visual'
      if (learningStyle === 'visual' && !learningHistory.currentModule?.hasVisuals) {
        recommendations.push({
          id: `visual_content_${Date.now()}`,
          category: 'content',
          type: 'learning_style',
          title: 'Visual Learning Enhancement',
          description: 'Add visual elements to match your learning style',
          content: 'Request diagrams, charts, or visual explanations for better understanding',
          priority: 'medium',
          confidence: 0.7,
          source: 'learning_style_analysis',
          actions: [
            { label: 'Add Visuals', action: () => requestVisualContent() },
            { label: 'Diagram Mode', action: () => enableDiagramMode() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Content recommendations failed:', error)
    }
    
    return recommendations
  }

  const generateSocialRecommendations = async () => {
    const recommendations = []
    
    try {
      // Community engagement recommendations
      if (learningHistory.communityEngagement < 0.3) {
        recommendations.push({
          id: `social_engage_${Date.now()}`,
          category: 'social',
          type: 'community_engagement',
          title: 'Join Learning Community',
          description: 'Connect with other learners for better outcomes',
          content: 'Students who engage with the community show 40% better retention rates',
          priority: 'low',
          confidence: 0.7,
          source: 'community_analysis',
          actions: [
            { label: 'Browse Discussions', action: () => browseCommunity() },
            { label: 'Join Study Group', action: () => joinStudyGroup() }
          ]
        })
      }
      
      // Peer learning recommendations
      if (learningHistory.averageScore > 80) {
        recommendations.push({
          id: `peer_teaching_${Date.now()}`,
          category: 'social',
          type: 'peer_learning',
          title: 'Teach Others',
          description: 'Your strong performance suggests you could help others',
          content: 'Teaching others reinforces your own learning and builds leadership skills',
          priority: 'low',
          confidence: 0.6,
          source: 'performance_analysis',
          actions: [
            { label: 'Mentor Students', action: () => becomeMentor() },
            { label: 'Share Knowledge', action: () => shareInCommunity() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Social recommendations failed:', error)
    }
    
    return recommendations
  }

  const generatePerformanceRecommendations = async () => {
    const recommendations = []
    
    try {
      // Performance optimization using ML
      const performanceAnalysis = await advancedMLService.predictLearningOutcome(
        userProfile,
        learningHistory.currentModule || {},
        learningHistory.cognitiveHistory || []
      )
      
      if (performanceAnalysis.riskAssessment.level !== 'low') {
        recommendations.push({
          id: `performance_risk_${Date.now()}`,
          category: 'performance',
          type: 'risk_mitigation',
          title: 'Performance Risk Detected',
          description: `${performanceAnalysis.riskAssessment.level} risk level identified`,
          content: performanceAnalysis.riskAssessment.mitigation?.[0] || 'Monitor performance closely',
          priority: performanceAnalysis.riskAssessment.level === 'high' ? 'urgent' : 'high',
          confidence: performanceAnalysis.confidence,
          source: 'ml_prediction',
          actions: [
            { label: 'View Analysis', action: () => showRiskAnalysis(performanceAnalysis) },
            { label: 'Apply Mitigation', action: () => applyRiskMitigation(performanceAnalysis) }
          ],
          metadata: {
            riskFactors: performanceAnalysis.riskAssessment.factors,
            predictedScore: performanceAnalysis.predictedScore
          }
        })
      }
      
      // Study schedule optimization
      const optimalTimes = findOptimalStudyTimes()
      if (optimalTimes.length > 0) {
        recommendations.push({
          id: `schedule_${Date.now()}`,
          category: 'performance',
          type: 'schedule_optimization',
          title: 'Optimize Study Schedule',
          description: 'AI identified your peak learning times',
          content: `Your best performance occurs at ${optimalTimes.join(', ')}`,
          priority: 'medium',
          confidence: 0.75,
          source: 'temporal_analysis',
          actions: [
            { label: 'Update Schedule', action: () => updateStudySchedule(optimalTimes) },
            { label: 'Set Reminders', action: () => setStudyReminders(optimalTimes) }
          ]
        })
      }
      
    } catch (error) {
      console.error('Performance recommendations failed:', error)
    }
    
    return recommendations
  }

  const filterRecommendationsByCategory = (recommendations) => {
    if (selectedCategory === 'all') return recommendations
    return recommendations.filter(rec => rec.category === selectedCategory)
  }

  const prioritizeRecommendations = (recommendations) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    
    return recommendations
      .filter(rec => rec.confidence >= recommendationSettings.confidenceThreshold)
      .sort((a, b) => {
        // Sort by priority first, then confidence
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.confidence - a.confidence
      })
      .slice(0, 8) // Limit to prevent overwhelming
  }

  const findOptimalStudyTimes = () => {
    // Analyze historical performance by time of day
    const timePerformance = {}
    
    learningHistory.sessions?.forEach(session => {
      const hour = new Date(session.timestamp).getHours()
      if (!timePerformance[hour]) {
        timePerformance[hour] = []
      }
      timePerformance[hour].push(session.performance || 70)
    })
    
    // Find hours with best average performance
    const hourlyAverages = Object.entries(timePerformance)
      .map(([hour, scores]) => ({
        hour: parseInt(hour),
        average: scores.reduce((a, b) => a + b, 0) / scores.length
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3)
    
    return hourlyAverages.map(ha => `${ha.hour}:00`)
  }

  const updateAnalytics = (recommendations) => {
    setAnalytics(prev => ({
      ...prev,
      totalRecommendations: prev.totalRecommendations + recommendations.length,
      topCategories: calculateTopCategories(recommendations)
    }))
  }

  const calculateTopCategories = (recommendations) => {
    const categoryCounts = {}
    recommendations.forEach(rec => {
      categoryCounts[rec.category] = (categoryCounts[rec.category] || 0) + 1
    })
    
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  const handleRecommendationAction = async (recommendation, actionIndex) => {
    try {
      const action = recommendation.actions[actionIndex]
      if (action.action) {
        await action.action()
      }
      
      // Mark as accepted
      setRecommendations(prev => prev.map(rec => 
        rec.id === recommendation.id 
          ? { ...rec, accepted: true, acceptedAt: new Date() }
          : rec
      ))
      
      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        acceptedRecommendations: prev.acceptedRecommendations + 1
      }))
      
      if (onRecommendationSelected) {
        onRecommendationSelected(recommendation, actionIndex)
      }
      
      if (window.toast) {
        window.toast.success(`Applied: ${action.label}`)
      }
      
    } catch (error) {
      console.error('Recommendation action failed:', error)
      if (window.toast) {
        window.toast.error('Failed to apply recommendation')
      }
    }
  }

  const dismissRecommendation = (recommendationId) => {
    setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'medium': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'low': return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
      default: return 'border-gray-300 bg-white dark:bg-gray-800'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <Zap className="w-4 h-4 text-red-500" />
      case 'high': return <Target className="w-4 h-4 text-orange-500" />
      case 'medium': return <Clock className="w-4 h-4 text-blue-500" />
      case 'low': return <Star className="w-4 h-4 text-gray-500" />
      default: return <Lightbulb className="w-4 h-4 text-gray-500" />
    }
  }

  // Action handlers
  const applyLearningStrategy = (strategy) => {
    console.log('Applying learning strategy:', strategy)
  }

  const showDetailedInsights = (insights) => {
    console.log('Showing detailed insights:', insights)
  }

  const showPredictionDetails = (prediction) => {
    console.log('Showing prediction details:', prediction)
  }

  const adjustLearningApproach = (prediction) => {
    console.log('Adjusting learning approach:', prediction)
  }

  const switchToInteractive = () => {
    if (window.toast) {
      window.toast.info('Switching to interactive content mode')
    }
  }

  const suggestBreak = () => {
    if (window.toast) {
      window.toast.info('Break recommended - take 5-10 minutes to refresh')
    }
  }

  const requestSimplification = () => {
    if (window.toast) {
      window.toast.info('Requesting simplified explanations')
    }
  }

  const requestExamples = () => {
    if (window.toast) {
      window.toast.info('Requesting additional examples')
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Smart Recommendations
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered insights for optimal learning
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={generateRecommendations}
            disabled={isGenerating}
            className="p-2 text-gray-500 hover:text-primary-500 transition-colors disabled:opacity-50"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
            title="Recommendation settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </button>
          )
        })}
      </div>

      {/* Recommendations List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {recommendations.map((recommendation) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`p-4 rounded-xl border-l-4 ${getPriorityColor(recommendation.priority)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  {getPriorityIcon(recommendation.priority)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {recommendation.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      {recommendation.description}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {recommendation.content}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => dismissRecommendation(recommendation.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* Metadata */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>Source: {recommendation.source}</span>
                  <span>•</span>
                  <span>Confidence: {Math.round(recommendation.confidence * 100)}%</span>
                  {recommendation.metadata?.estimatedImpact && (
                    <>
                      <span>•</span>
                      <span>Impact: {recommendation.metadata.estimatedImpact}</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              {recommendation.actions && recommendation.actions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recommendation.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecommendationAction(recommendation, index)}
                      className="flex items-center space-x-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <span>{action.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Enhanced Metadata */}
              {recommendation.metadata && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {recommendation.metadata.keyFactors && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Key Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {recommendation.metadata.keyFactors.slice(0, 3).map((factor, index) => (
                          <span key={index} className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {factor.name}: {Math.round(factor.value * 100)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {recommendation.metadata.timeToImplement && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ⏱️ Implementation time: {recommendation.metadata.timeToImplement}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {recommendations.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No recommendations available for the selected category.
            </p>
            <button
              onClick={generateRecommendations}
              className="mt-2 text-primary-500 hover:text-primary-600 text-sm"
            >
              Generate new recommendations
            </button>
          </div>
        )}
        
        {isGenerating && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Generating personalized recommendations...
            </p>
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      {analytics.totalRecommendations > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-primary-500">
                {analytics.totalRecommendations}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {analytics.acceptedRecommendations}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Accepted</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-500">
                {Math.round((analytics.acceptedRecommendations / Math.max(1, analytics.totalRecommendations)) * 100)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartRecommendationEngine