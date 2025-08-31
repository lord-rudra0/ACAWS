import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Target, 
  Eye, 
  Heart,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  RefreshCw,
  Filter,
  Download,
  Star,
  Award
} from 'lucide-react'
import useAIFeatures from '../hooks/useAIFeatures'

const AIInsightsPanel = ({ 
  cognitiveState = {}, 
  learningData = {}, 
  wellnessData = {},
  onInsightAction,
  onInsightDismiss 
}) => {
  const [insights, setInsights] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [insightSettings, setInsightSettings] = useState({
    realTimeUpdates: true,
    confidenceThreshold: 0.7,
    maxInsights: 10,
    autoRefresh: true,
    priorityFilter: 'all'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [insightAnalytics, setInsightAnalytics] = useState({
    totalGenerated: 0,
    actionsTaken: 0,
    averageAccuracy: 0,
    topCategories: []
  })

  const { 
    generateRealTimeInsights, 
    getAIRecommendations,
    aiState 
  } = useAIFeatures('user123', { cognitiveState, learningData, wellnessData })

  const insightCategories = [
    { id: 'all', label: 'All Insights', icon: Brain, color: 'gray' },
    { id: 'cognitive', label: 'Cognitive', icon: Eye, color: 'blue' },
    { id: 'learning', label: 'Learning', icon: Target, color: 'green' },
    { id: 'wellness', label: 'Wellness', icon: Heart, color: 'red' },
    { id: 'performance', label: 'Performance', icon: TrendingUp, color: 'purple' },
    { id: 'predictions', label: 'Predictions', icon: BarChart3, color: 'orange' }
  ]

  useEffect(() => {
    if (insightSettings.realTimeUpdates && Object.keys(cognitiveState).length > 0) {
      generateInsights()
    }
  }, [cognitiveState, learningData, wellnessData, insightSettings.realTimeUpdates])

  useEffect(() => {
    if (insightSettings.autoRefresh) {
      const interval = setInterval(() => {
        if (insightSettings.realTimeUpdates) {
          generateInsights()
        }
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [insightSettings.autoRefresh, insightSettings.realTimeUpdates])

  const generateInsights = async () => {
    setIsGenerating(true)
    
    try {
      const allInsights = await Promise.all([
        generateCognitiveInsights(),
        generateLearningInsights(),
        generateWellnessInsights(),
        generatePerformanceInsights(),
        generatePredictiveInsights()
      ])
      
      const flatInsights = allInsights.flat()
      const filteredInsights = filterInsights(flatInsights)
      const prioritizedInsights = prioritizeInsights(filteredInsights)
      
      setInsights(prioritizedInsights)
      updateInsightAnalytics(prioritizedInsights)
      
    } catch (error) {
      console.error('Insight generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCognitiveInsights = async () => {
    const insights = []
    
    try {
      // Real-time cognitive insights
      const realtimeInsights = await generateRealTimeInsights(cognitiveState)
      
      insights.push(...(realtimeInsights.insights || []).map(insight => ({
        id: `cognitive_${Date.now()}_${Math.random()}`,
        category: 'cognitive',
        type: 'real_time',
        title: 'Cognitive State Analysis',
        content: insight.message || insight,
        priority: determinePriority(insight),
        confidence: insight.confidence || 0.8,
        timestamp: new Date(),
        source: 'ai_analysis',
        actionable: true,
        actions: generateCognitiveActions(insight)
      })))
      
      // Attention insights
      if (cognitiveState.attention < 50) {
        insights.push({
          id: `attention_${Date.now()}`,
          category: 'cognitive',
          type: 'attention_alert',
          title: 'Attention Enhancement Needed',
          content: `Your attention level is ${Math.round(cognitiveState.attention)}%. Consider taking a short break or changing your environment.`,
          priority: 'medium',
          confidence: 0.9,
          timestamp: new Date(),
          source: 'cognitive_monitoring',
          actionable: true,
          actions: [
            { label: 'Take Break', action: () => suggestBreak() },
            { label: 'Change Environment', action: () => suggestEnvironmentChange() }
          ]
        })
      }
      
      // Confusion insights
      if (cognitiveState.confusion > 60) {
        insights.push({
          id: `confusion_${Date.now()}`,
          category: 'cognitive',
          type: 'confusion_alert',
          title: 'High Confusion Detected',
          content: `Confusion level at ${Math.round(cognitiveState.confusion)}%. Simplified explanations recommended.`,
          priority: 'high',
          confidence: 0.85,
          timestamp: new Date(),
          source: 'cognitive_monitoring',
          actionable: true,
          actions: [
            { label: 'Simplify Content', action: () => requestSimplification() },
            { label: 'Get Examples', action: () => requestExamples() }
          ]
        })
      }
      
      // Engagement insights
      if (cognitiveState.engagement > 80) {
        insights.push({
          id: `engagement_${Date.now()}`,
          category: 'cognitive',
          type: 'engagement_positive',
          title: 'High Engagement Detected',
          content: `Excellent engagement at ${Math.round(cognitiveState.engagement)}%! Perfect time for challenging content.`,
          priority: 'low',
          confidence: 0.9,
          timestamp: new Date(),
          source: 'cognitive_monitoring',
          actionable: true,
          actions: [
            { label: 'Increase Difficulty', action: () => increaseDifficulty() },
            { label: 'Add Challenges', action: () => addChallenges() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Cognitive insights generation failed:', error)
    }
    
    return insights
  }

  const generateLearningInsights = async () => {
    const insights = []
    
    try {
      // Learning performance insights
      if (learningData.averageScore) {
        const scoreCategory = learningData.averageScore > 80 ? 'excellent' : 
                            learningData.averageScore > 60 ? 'good' : 'needs_improvement'
        
        insights.push({
          id: `learning_performance_${Date.now()}`,
          category: 'learning',
          type: 'performance_analysis',
          title: 'Learning Performance Analysis',
          content: `Your average score is ${learningData.averageScore}% (${scoreCategory}). ${
            scoreCategory === 'excellent' ? 'Outstanding work! Consider advanced topics.' :
            scoreCategory === 'good' ? 'Good progress! Focus on consistency.' :
            'Additional support recommended for improvement.'
          }`,
          priority: scoreCategory === 'needs_improvement' ? 'high' : 'medium',
          confidence: 0.9,
          timestamp: new Date(),
          source: 'learning_analytics',
          actionable: true,
          actions: generateLearningActions(scoreCategory)
        })
      }
      
      // Study pattern insights
      if (learningData.studyStreak > 7) {
        insights.push({
          id: `study_streak_${Date.now()}`,
          category: 'learning',
          type: 'positive_pattern',
          title: 'Excellent Study Consistency',
          content: `Amazing ${learningData.studyStreak}-day study streak! Your consistency is paying off.`,
          priority: 'low',
          confidence: 1.0,
          timestamp: new Date(),
          source: 'pattern_analysis',
          actionable: false,
          celebration: true
        })
      }
      
      // Module completion insights
      if (learningData.completedModules > 0) {
        const completionRate = (learningData.completedModules / (learningData.totalModules || 20)) * 100
        
        insights.push({
          id: `completion_${Date.now()}`,
          category: 'learning',
          type: 'progress_update',
          title: 'Learning Progress Update',
          content: `You've completed ${learningData.completedModules} modules (${Math.round(completionRate)}% of curriculum). ${
            completionRate > 75 ? 'You\'re almost there!' :
            completionRate > 50 ? 'Great progress!' :
            'Keep up the momentum!'
          }`,
          priority: 'medium',
          confidence: 1.0,
          timestamp: new Date(),
          source: 'progress_tracking',
          actionable: true,
          actions: [
            { label: 'View Next Module', action: () => viewNextModule() },
            { label: 'Review Progress', action: () => reviewProgress() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Learning insights generation failed:', error)
    }
    
    return insights
  }

  const generateWellnessInsights = async () => {
    const insights = []
    
    try {
      // Stress level insights
      if (wellnessData.averageStress > 7) {
        insights.push({
          id: `stress_${Date.now()}`,
          category: 'wellness',
          type: 'stress_alert',
          title: 'High Stress Level Alert',
          content: `Your stress level is ${wellnessData.averageStress}/10. This may impact your learning effectiveness.`,
          priority: 'high',
          confidence: 0.9,
          timestamp: new Date(),
          source: 'wellness_monitoring',
          actionable: true,
          actions: [
            { label: 'Breathing Exercise', action: () => startBreathingExercise() },
            { label: 'Take Break', action: () => suggestBreak() },
            { label: 'Stress Tips', action: () => showStressTips() }
          ]
        })
      }
      
      // Mood insights
      if (wellnessData.averageMood && wellnessData.averageMood < 5) {
        insights.push({
          id: `mood_${Date.now()}`,
          category: 'wellness',
          type: 'mood_concern',
          title: 'Mood Support Recommended',
          content: `Your mood has been below average (${wellnessData.averageMood}/10). Consider wellness activities.`,
          priority: 'medium',
          confidence: 0.8,
          timestamp: new Date(),
          source: 'wellness_monitoring',
          actionable: true,
          actions: [
            { label: 'Mood Boosters', action: () => suggestMoodBoosters() },
            { label: 'Connect with Others', action: () => suggestSocialConnection() }
          ]
        })
      }
      
      // Positive wellness insights
      if (wellnessData.averageMood > 8) {
        insights.push({
          id: `mood_positive_${Date.now()}`,
          category: 'wellness',
          type: 'positive_wellness',
          title: 'Excellent Mood Detected',
          content: `Your mood is excellent (${wellnessData.averageMood}/10)! Perfect time for challenging learning.`,
          priority: 'low',
          confidence: 0.9,
          timestamp: new Date(),
          source: 'wellness_monitoring',
          actionable: true,
          celebration: true,
          actions: [
            { label: 'Tackle Challenges', action: () => suggestChallenges() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Wellness insights generation failed:', error)
    }
    
    return insights
  }

  const generatePerformanceInsights = async () => {
    const insights = []
    
    try {
      // Performance trend analysis
      if (learningData.performanceTrend) {
        const trend = learningData.performanceTrend
        
        insights.push({
          id: `performance_trend_${Date.now()}`,
          category: 'performance',
          type: 'trend_analysis',
          title: `Performance Trend: ${trend.direction}`,
          content: `Your performance is ${trend.direction} by ${Math.abs(trend.change)}% over the last ${trend.period}.`,
          priority: trend.direction === 'declining' ? 'high' : 'medium',
          confidence: 0.85,
          timestamp: new Date(),
          source: 'performance_analytics',
          actionable: trend.direction === 'declining',
          actions: trend.direction === 'declining' ? [
            { label: 'Analyze Causes', action: () => analyzeCauses() },
            { label: 'Adjust Strategy', action: () => adjustStrategy() }
          ] : []
        })
      }
      
      // Efficiency insights
      const efficiency = calculateLearningEfficiency()
      if (efficiency < 60) {
        insights.push({
          id: `efficiency_${Date.now()}`,
          category: 'performance',
          type: 'efficiency_alert',
          title: 'Learning Efficiency Below Optimal',
          content: `Your learning efficiency is ${efficiency}%. AI suggests optimizations to improve effectiveness.`,
          priority: 'medium',
          confidence: 0.8,
          timestamp: new Date(),
          source: 'efficiency_analysis',
          actionable: true,
          actions: [
            { label: 'Optimize Schedule', action: () => optimizeSchedule() },
            { label: 'Improve Environment', action: () => improveEnvironment() }
          ]
        })
      }
      
    } catch (error) {
      console.error('Performance insights generation failed:', error)
    }
    
    return insights
  }

  const generatePredictiveInsights = async () => {
    const insights = []
    
    try {
      // Predict next session performance
      const nextSessionPrediction = predictNextSessionPerformance()
      
      insights.push({
        id: `prediction_${Date.now()}`,
        category: 'predictions',
        type: 'performance_prediction',
        title: 'Next Session Prediction',
        content: `AI predicts ${Math.round(nextSessionPrediction.score)}% performance for your next session based on current patterns.`,
        priority: nextSessionPrediction.score < 60 ? 'medium' : 'low',
        confidence: nextSessionPrediction.confidence,
        timestamp: new Date(),
        source: 'ml_prediction',
        actionable: nextSessionPrediction.score < 70,
        actions: nextSessionPrediction.score < 70 ? [
          { label: 'Optimize Preparation', action: () => optimizePreparation() },
          { label: 'Adjust Difficulty', action: () => adjustDifficulty() }
        ] : [],
        metadata: {
          factors: nextSessionPrediction.factors,
          recommendations: nextSessionPrediction.recommendations
        }
      })
      
      // Risk prediction
      const riskPrediction = predictLearningRisks()
      if (riskPrediction.level !== 'low') {
        insights.push({
          id: `risk_${Date.now()}`,
          category: 'predictions',
          type: 'risk_alert',
          title: `${riskPrediction.level.toUpperCase()} Risk Detected`,
          content: `AI identifies ${riskPrediction.level} risk of ${riskPrediction.type}. Preventive measures recommended.`,
          priority: riskPrediction.level === 'high' ? 'high' : 'medium',
          confidence: riskPrediction.confidence,
          timestamp: new Date(),
          source: 'risk_analysis',
          actionable: true,
          actions: [
            { label: 'View Mitigation', action: () => showRiskMitigation(riskPrediction) },
            { label: 'Apply Prevention', action: () => applyPrevention(riskPrediction) }
          ]
        })
      }
      
    } catch (error) {
      console.error('Predictive insights generation failed:', error)
    }
    
    return insights
  }

  const calculateLearningEfficiency = () => {
    const timeSpent = learningData.totalTime || 100
    const modulesCompleted = learningData.completedModules || 1
    const averageScore = learningData.averageScore || 70
    
    return Math.round((modulesCompleted * averageScore) / (timeSpent / 60))
  }

  const predictNextSessionPerformance = () => {
    const recentScores = learningData.recentScores || [70, 75, 80]
    const trend = recentScores.length > 1 ? 
      (recentScores[recentScores.length - 1] - recentScores[0]) / recentScores.length : 0
    
    const baseScore = recentScores[recentScores.length - 1] || 70
    const cognitiveAdjustment = (cognitiveState.attention - cognitiveState.fatigue - cognitiveState.confusion) / 3
    
    const predictedScore = Math.max(0, Math.min(100, baseScore + trend + cognitiveAdjustment))
    
    return {
      score: predictedScore,
      confidence: 0.75,
      factors: [
        { name: 'Recent Trend', impact: trend },
        { name: 'Cognitive State', impact: cognitiveAdjustment },
        { name: 'Historical Performance', impact: baseScore - 70 }
      ],
      recommendations: predictedScore < 70 ? [
        'Review prerequisite concepts',
        'Take breaks to improve focus',
        'Request additional support'
      ] : []
    }
  }

  const predictLearningRisks = () => {
    let riskLevel = 'low'
    let riskType = 'none'
    let confidence = 0.7
    
    // Analyze multiple risk factors
    if (cognitiveState.fatigue > 80 && wellnessData.averageStress > 7) {
      riskLevel = 'high'
      riskType = 'burnout'
      confidence = 0.9
    } else if (cognitiveState.confusion > 70 && learningData.averageScore < 60) {
      riskLevel = 'medium'
      riskType = 'academic_struggle'
      confidence = 0.8
    } else if (cognitiveState.engagement < 30) {
      riskLevel = 'medium'
      riskType = 'disengagement'
      confidence = 0.75
    }
    
    return { level: riskLevel, type: riskType, confidence }
  }

  const filterInsights = (insights) => {
    let filtered = insights.filter(insight => 
      insight.confidence >= insightSettings.confidenceThreshold
    )
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(insight => insight.category === selectedCategory)
    }
    
    if (insightSettings.priorityFilter !== 'all') {
      filtered = filtered.filter(insight => insight.priority === insightSettings.priorityFilter)
    }
    
    return filtered
  }

  const prioritizeInsights = (insights) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    
    return insights
      .sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.confidence - a.confidence
      })
      .slice(0, insightSettings.maxInsights)
  }

  const determinePriority = (insight) => {
    if (insight.urgent || insight.severity === 'high') return 'high'
    if (insight.important || insight.severity === 'medium') return 'medium'
    return 'low'
  }

  const generateCognitiveActions = (insight) => {
    const actions = []
    
    if (insight.type === 'attention_low') {
      actions.push(
        { label: 'Focus Exercise', action: () => startFocusExercise() },
        { label: 'Environment Check', action: () => checkEnvironment() }
      )
    }
    
    return actions
  }

  const generateLearningActions = (scoreCategory) => {
    switch (scoreCategory) {
      case 'excellent':
        return [
          { label: 'Advanced Topics', action: () => exploreAdvanced() },
          { label: 'Mentor Others', action: () => becomeMentor() }
        ]
      case 'good':
        return [
          { label: 'Maintain Pace', action: () => maintainPace() },
          { label: 'Add Challenges', action: () => addChallenges() }
        ]
      case 'needs_improvement':
        return [
          { label: 'Get Support', action: () => getSupport() },
          { label: 'Review Basics', action: () => reviewBasics() }
        ]
      default:
        return []
    }
  }

  const updateInsightAnalytics = (insights) => {
    setInsightAnalytics(prev => ({
      totalGenerated: prev.totalGenerated + insights.length,
      averageAccuracy: (prev.averageAccuracy + calculateAverageAccuracy(insights)) / 2,
      topCategories: calculateTopCategories(insights)
    }))
  }

  const calculateAverageAccuracy = (insights) => {
    if (insights.length === 0) return 0
    return insights.reduce((sum, insight) => sum + insight.confidence, 0) / insights.length
  }

  const calculateTopCategories = (insights) => {
    const categoryCounts = {}
    insights.forEach(insight => {
      categoryCounts[insight.category] = (categoryCounts[insight.category] || 0) + 1
    })
    
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }))
  }

  const handleInsightAction = async (insight, actionIndex) => {
    try {
      const action = insight.actions[actionIndex]
      if (action.action) {
        await action.action()
      }
      
      // Mark insight as acted upon
      setInsights(prev => prev.map(ins => 
        ins.id === insight.id 
          ? { ...ins, actedUpon: true, actionTaken: action.label, actionTime: new Date() }
          : ins
      ))
      
      // Update analytics
      setInsightAnalytics(prev => ({
        ...prev,
        actionsTaken: prev.actionsTaken + 1
      }))
      
      if (onInsightAction) {
        onInsightAction(insight, action)
      }
      
      if (window.toast) {
        window.toast.success(`Applied: ${action.label}`)
      }
      
    } catch (error) {
      console.error('Insight action failed:', error)
      if (window.toast) {
        window.toast.error('Failed to apply insight action')
      }
    }
  }

  const dismissInsight = (insightId) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId))
    
    if (onInsightDismiss) {
      onInsightDismiss(insightId)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'medium': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20'
      default: return 'border-gray-300 bg-white dark:bg-gray-800'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high': return <Target className="w-4 h-4 text-orange-500" />
      case 'medium': return <Clock className="w-4 h-4 text-blue-500" />
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Lightbulb className="w-4 h-4 text-gray-500" />
    }
  }

  const getCategoryIcon = (category) => {
    const iconMap = {
      cognitive: Eye,
      learning: Target,
      wellness: Heart,
      performance: TrendingUp,
      predictions: BarChart3
    }
    
    const Icon = iconMap[category] || Brain
    return <Icon className="w-4 h-4" />
  }

  // Action handlers
  const suggestBreak = () => {
    if (window.toast) window.toast.info('Take a 10-15 minute break to refresh your mind')
  }

  const suggestEnvironmentChange = () => {
    if (window.toast) window.toast.info('Try changing your study location or reducing distractions')
  }

  const requestSimplification = () => {
    if (window.toast) window.toast.info('Requesting simplified explanations for current content')
  }

  const requestExamples = () => {
    if (window.toast) window.toast.info('Generating additional examples to clarify concepts')
  }

  const increaseDifficulty = () => {
    if (window.toast) window.toast.info('Increasing content difficulty to match your high engagement')
  }

  const addChallenges = () => {
    if (window.toast) window.toast.info('Adding challenging exercises to leverage your current state')
  }

  const startBreathingExercise = () => {
    if (window.toast) window.toast.info('Starting guided breathing exercise for stress relief')
  }

  const showStressTips = () => {
    if (window.toast) window.toast.info('Displaying stress management techniques')
  }

  const suggestMoodBoosters = () => {
    if (window.toast) window.toast.info('Suggesting mood-boosting activities')
  }

  const suggestSocialConnection = () => {
    if (window.toast) window.toast.info('Connecting you with study groups and peer support')
  }

  const suggestChallenges = () => {
    if (window.toast) window.toast.info('Perfect time for challenging content - your mood is excellent!')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              AI Insights Panel
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time AI-powered learning insights
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={generateInsights}
              disabled={isGenerating}
              className="p-2 text-gray-500 hover:text-primary-500 transition-colors disabled:opacity-50"
              title="Refresh insights"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
              title="Insight settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {insightCategories.map((category) => {
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

        {/* Insights List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`p-4 rounded-xl border-l-4 ${getPriorityColor(insight.priority)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(insight.priority)}
                      {getCategoryIcon(insight.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {insight.content}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {insight.celebration && (
                      <Award className="w-4 h-4 text-yellow-500" />
                    )}
                    <button
                      onClick={() => dismissInsight(insight.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {/* Metadata */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>Source: {insight.source}</span>
                    <span>•</span>
                    <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                    <span>•</span>
                    <span>{insight.timestamp.toLocaleTimeString()}</span>
                  </div>
                </div>
                
                {/* Actions */}
                {insight.actions && insight.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {insight.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleInsightAction(insight, index)}
                        disabled={insight.actedUpon}
                        className="flex items-center space-x-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg text-xs hover:bg-primary-200 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50"
                      >
                        <span>{action.label}</span>
                        {insight.actedUpon && insight.actionTaken === action.label && (
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Enhanced Metadata */}
                {insight.metadata && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {insight.metadata.factors && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Key Factors:</p>
                        <div className="space-y-1">
                          {insight.metadata.factors.slice(0, 3).map((factor, index) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                              • {factor.name}: {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {insight.metadata.recommendations && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">AI Recommendations:</p>
                        <div className="space-y-1">
                          {insight.metadata.recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="text-xs text-gray-600 dark:text-gray-400">
                              • {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {insights.length === 0 && !isGenerating && (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No insights available for the selected category.
              </p>
              <button
                onClick={generateInsights}
                className="mt-2 text-primary-500 hover:text-primary-600 text-sm"
              >
                Generate new insights
              </button>
            </div>
          )}
          
          {isGenerating && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                AI is analyzing your data to generate insights...
              </p>
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        {insightAnalytics.totalGenerated > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary-500">
                  {insightAnalytics.totalGenerated}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Generated</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-500">
                  {insightAnalytics.actionsTaken}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Actions Taken</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-500">
                  {Math.round(insightAnalytics.averageAccuracy * 100)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg Accuracy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIInsightsPanel