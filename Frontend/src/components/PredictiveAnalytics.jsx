import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Brain, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  Zap,
  Heart,
  Award,
  Calendar,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts'
import advancedMLService from '../services/advancedMLService'
import geminiService from '../services/geminiService'

const PredictiveAnalytics = ({ 
  userProfile, 
  learningHistory, 
  cognitiveState, 
  wellnessData,
  onPredictionUpdate,
  onRiskAlert 
}) => {
  const [predictions, setPredictions] = useState({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('week')
  const [predictionAccuracy, setPredictionAccuracy] = useState({})
  const [riskAssessment, setRiskAssessment] = useState({})
  const [optimizationSuggestions, setOptimizationSuggestions] = useState([])
  const [predictionHistory, setPredictionHistory] = useState([])

  const timeframes = [
    { id: 'day', label: 'Next Day', icon: Clock },
    { id: 'week', label: 'Next Week', icon: Calendar },
    { id: 'month', label: 'Next Month', icon: BarChart3 },
    { id: 'quarter', label: 'Next Quarter', icon: TrendingUp }
  ]

  useEffect(() => {
    generatePredictions()
  }, [userProfile, learningHistory, selectedTimeframe])

  const generatePredictions = async () => {
    setIsAnalyzing(true)
    
    try {
      // Performance predictions using ML
      const performancePrediction = await advancedMLService.predictLearningOutcome(
        userProfile,
        learningHistory.currentModule || {},
        learningHistory.cognitiveHistory || []
      )
      
      // Wellness predictions using AI
      const wellnessPrediction = await geminiService.generateWellnessInsights(
        wellnessData,
        learningHistory.cognitiveHistory || []
      )
      
      // Learning path predictions
      const pathPrediction = await predictLearningPath()
      
      // Engagement predictions
      const engagementPrediction = await predictEngagement()
      
      // Risk assessment
      const risks = await assessComprehensiveRisks()
      
      const newPredictions = {
        performance: performancePrediction,
        wellness: wellnessPrediction,
        learningPath: pathPrediction,
        engagement: engagementPrediction,
        generatedAt: new Date().toISOString(),
        timeframe: selectedTimeframe
      }
      
      setPredictions(newPredictions)
      setRiskAssessment(risks)
      
      // Generate optimization suggestions
      const suggestions = await generateOptimizationSuggestions(newPredictions, risks)
      setOptimizationSuggestions(suggestions)
      
      // Update prediction history
      setPredictionHistory(prev => [...prev.slice(-9), {
        timestamp: new Date(),
        predictions: newPredictions,
        accuracy: calculatePredictionAccuracy(newPredictions)
      }])
      
      // Notify parent component
      if (onPredictionUpdate) {
        onPredictionUpdate(newPredictions)
      }
      
      // Check for high-risk alerts
      if (risks.overallRisk === 'high' && onRiskAlert) {
        onRiskAlert(risks)
      }
      
    } catch (error) {
      console.error('Prediction generation failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const predictLearningPath = async () => {
    try {
      const currentProgress = learningHistory.completedModules || 0
      const averageScore = learningHistory.averageScore || 70
      const studyTime = learningHistory.totalTime || 0
      
      // Predict completion timeline
      const completionPrediction = predictCompletionTimeline(currentProgress, averageScore, studyTime)
      
      // Predict optimal next modules
      const nextModules = await predictOptimalModules()
      
      // Predict learning velocity
      const velocity = calculateLearningVelocity()
      
      return {
        completionTimeline: completionPrediction,
        recommendedModules: nextModules,
        learningVelocity: velocity,
        estimatedGraduation: calculateGraduationDate(completionPrediction),
        confidence: 0.75
      }
    } catch (error) {
      console.error('Learning path prediction failed:', error)
      return { error: 'Prediction unavailable' }
    }
  }

  const predictEngagement = async () => {
    try {
      const recentEngagement = cognitiveState.engagement || 50
      const engagementHistory = learningHistory.engagementHistory || []
      
      // Predict engagement trends
      const trend = calculateEngagementTrend(engagementHistory)
      
      // Predict optimal engagement strategies
      const strategies = await predictEngagementStrategies()
      
      return {
        predictedEngagement: Math.max(0, Math.min(100, recentEngagement + trend * 10)),
        trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
        optimalStrategies: strategies,
        riskOfDisengagement: recentEngagement < 40 ? 'high' : recentEngagement < 60 ? 'medium' : 'low',
        confidence: 0.7
      }
    } catch (error) {
      console.error('Engagement prediction failed:', error)
      return { error: 'Prediction unavailable' }
    }
  }

  const assessComprehensiveRisks = async () => {
    const risks = {
      academic: [],
      wellness: [],
      engagement: [],
      technical: []
    }
    
    try {
      // Academic risks
      if (learningHistory.averageScore < 60) {
        risks.academic.push({
          type: 'low_performance',
          severity: 'high',
          description: 'Consistently low academic performance',
          probability: 0.8,
          impact: 'high',
          mitigation: 'Immediate academic support needed'
        })
      }
      
      if (cognitiveState.confusion > 70) {
        risks.academic.push({
          type: 'comprehension_difficulty',
          severity: 'medium',
          description: 'High confusion levels in current topics',
          probability: 0.7,
          impact: 'medium',
          mitigation: 'Simplify content and provide additional examples'
        })
      }
      
      // Wellness risks
      if (wellnessData.averageStress > 7) {
        risks.wellness.push({
          type: 'chronic_stress',
          severity: 'high',
          description: 'Elevated stress levels affecting learning',
          probability: 0.9,
          impact: 'high',
          mitigation: 'Stress management intervention required'
        })
      }
      
      if (cognitiveState.fatigue > 80) {
        risks.wellness.push({
          type: 'burnout_risk',
          severity: 'high',
          description: 'High fatigue indicates potential burnout',
          probability: 0.75,
          impact: 'very_high',
          mitigation: 'Immediate rest and schedule adjustment needed'
        })
      }
      
      // Engagement risks
      if (cognitiveState.engagement < 30) {
        risks.engagement.push({
          type: 'disengagement',
          severity: 'medium',
          description: 'Low engagement may lead to dropout',
          probability: 0.6,
          impact: 'high',
          mitigation: 'Increase content interactivity and relevance'
        })
      }
      
      // Calculate overall risk
      const allRisks = [...risks.academic, ...risks.wellness, ...risks.engagement, ...risks.technical]
      const highRisks = allRisks.filter(r => r.severity === 'high').length
      const mediumRisks = allRisks.filter(r => r.severity === 'medium').length
      
      const overallRisk = highRisks > 0 ? 'high' : mediumRisks > 1 ? 'medium' : 'low'
      
      return {
        ...risks,
        overallRisk,
        totalRisks: allRisks.length,
        riskScore: calculateRiskScore(allRisks),
        immediateActions: allRisks.filter(r => r.severity === 'high').map(r => r.mitigation)
      }
      
    } catch (error) {
      console.error('Risk assessment failed:', error)
      return { overallRisk: 'unknown', error: error.message }
    }
  }

  const generateOptimizationSuggestions = async (predictions, risks) => {
    const suggestions = []
    
    try {
      // Performance optimization
      if (predictions.performance?.predictedScore < 70) {
        suggestions.push({
          category: 'performance',
          title: 'Boost Learning Performance',
          description: 'ML models suggest specific improvements',
          actions: predictions.performance.recommendations || [],
          priority: 'high',
          estimatedImpact: '+15-25% performance',
          implementationTime: '1-2 weeks'
        })
      }
      
      // Wellness optimization
      if (risks.wellness.length > 0) {
        suggestions.push({
          category: 'wellness',
          title: 'Wellness Intervention',
          description: 'Address wellness risks to improve learning outcomes',
          actions: risks.wellness.map(r => r.mitigation),
          priority: 'urgent',
          estimatedImpact: 'Prevent burnout, improve focus',
          implementationTime: 'Immediate'
        })
      }
      
      // Engagement optimization
      if (predictions.engagement?.riskOfDisengagement !== 'low') {
        suggestions.push({
          category: 'engagement',
          title: 'Engagement Enhancement',
          description: 'Prevent disengagement with targeted strategies',
          actions: predictions.engagement.optimalStrategies || [],
          priority: 'medium',
          estimatedImpact: '+20-30% engagement',
          implementationTime: '3-5 days'
        })
      }
      
      // Learning path optimization
      if (predictions.learningPath?.learningVelocity < 0.7) {
        suggestions.push({
          category: 'learning_path',
          title: 'Accelerate Learning',
          description: 'Optimize learning path for faster progress',
          actions: ['Adjust module sequence', 'Increase practice frequency', 'Add peer learning'],
          priority: 'medium',
          estimatedImpact: '+40% learning speed',
          implementationTime: '1 week'
        })
      }
      
    } catch (error) {
      console.error('Optimization suggestions failed:', error)
    }
    
    return suggestions
  }

  const predictCompletionTimeline = (currentProgress, averageScore, studyTime) => {
    const totalModules = 20 // Assume 20 total modules
    const remainingModules = totalModules - currentProgress
    
    // Calculate average time per module
    const avgTimePerModule = studyTime > 0 ? studyTime / Math.max(1, currentProgress) : 45
    
    // Adjust based on performance
    const performanceMultiplier = averageScore > 80 ? 0.8 : averageScore > 60 ? 1.0 : 1.3
    
    const estimatedTimeRemaining = remainingModules * avgTimePerModule * performanceMultiplier
    
    return {
      remainingModules,
      estimatedHours: Math.round(estimatedTimeRemaining),
      estimatedWeeks: Math.round(estimatedTimeRemaining / (5 * 8)), // 5 days, 8 hours per day
      completionProbability: averageScore > 70 ? 0.9 : averageScore > 50 ? 0.7 : 0.5
    }
  }

  const predictOptimalModules = async () => {
    // Mock optimal module prediction
    return [
      { title: 'Advanced Neural Networks', difficulty: 'hard', estimatedScore: 78 },
      { title: 'Computer Vision Applications', difficulty: 'medium', estimatedScore: 85 },
      { title: 'Natural Language Processing', difficulty: 'medium', estimatedScore: 82 }
    ]
  }

  const calculateLearningVelocity = () => {
    const recentSessions = learningHistory.sessions?.slice(-10) || []
    if (recentSessions.length === 0) return 0.5
    
    const avgCompletion = recentSessions.reduce((sum, session) => sum + (session.completion || 0), 0) / recentSessions.length
    const avgTime = recentSessions.reduce((sum, session) => sum + (session.duration || 45), 0) / recentSessions.length
    
    return (avgCompletion / 100) * (45 / avgTime) // Normalize to ideal 45-minute sessions
  }

  const calculateGraduationDate = (timeline) => {
    const weeksRemaining = timeline.estimatedWeeks || 10
    const graduationDate = new Date()
    graduationDate.setDate(graduationDate.getDate() + (weeksRemaining * 7))
    
    return graduationDate.toLocaleDateString()
  }

  const calculateEngagementTrend = (history) => {
    if (!history || history.length < 3) return 0
    
    const recent = history.slice(-5)
    const older = history.slice(-10, -5)
    
    if (older.length === 0) return 0
    
    const recentAvg = recent.reduce((sum, h) => sum + h.engagement, 0) / recent.length
    const olderAvg = older.reduce((sum, h) => sum + h.engagement, 0) / older.length
    
    return (recentAvg - olderAvg) / olderAvg
  }

  const predictEngagementStrategies = async () => {
    return [
      'Increase interactive content',
      'Add gamification elements',
      'Introduce peer collaboration',
      'Vary content formats',
      'Provide immediate feedback'
    ]
  }

  const calculateRiskScore = (risks) => {
    let score = 0
    risks.forEach(risk => {
      const severityWeight = { high: 3, medium: 2, low: 1 }[risk.severity] || 1
      score += risk.probability * severityWeight
    })
    return Math.min(100, score * 10)
  }

  const calculatePredictionAccuracy = (predictions) => {
    // Mock accuracy calculation - in production, compare with actual outcomes
    return {
      performance: 0.85,
      wellness: 0.78,
      engagement: 0.82,
      overall: 0.82
    }
  }

  const exportPredictions = () => {
    const exportData = {
      predictions,
      riskAssessment,
      optimizationSuggestions,
      predictionHistory,
      generatedAt: new Date().toISOString(),
      userProfile: userProfile.id
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `acaws-predictions-${selectedTimeframe}.json`
    link.click()
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'text-green-500 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const formatPredictionData = () => {
    if (!predictions.performance) return []
    
    const baseData = [
      { name: 'Current', performance: learningHistory.averageScore || 70, engagement: cognitiveState.engagement || 50 },
      { name: 'Predicted', performance: predictions.performance.predictedScore || 75, engagement: predictions.engagement?.predictedEngagement || 55 }
    ]
    
    // Add historical trend data
    const trendData = predictionHistory.slice(-5).map((entry, index) => ({
      name: `T-${5-index}`,
      performance: entry.predictions.performance?.predictedScore || 70,
      engagement: entry.predictions.engagement?.predictedEngagement || 50,
      actual: entry.accuracy?.performance * 100 || null
    }))
    
    return [...trendData, ...baseData]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Predictive Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered insights into your learning future
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="input-field text-sm"
          >
            {timeframes.map(tf => (
              <option key={tf.id} value={tf.id}>{tf.label}</option>
            ))}
          </select>
          
          <button
            onClick={generatePredictions}
            disabled={isAnalyzing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Analyze</span>
          </button>
          
          <button
            onClick={exportPredictions}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Risk Assessment Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Risk Assessment
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(riskAssessment.overallRisk)}`}>
            {riskAssessment.overallRisk?.toUpperCase() || 'ANALYZING'} RISK
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { category: 'academic', label: 'Academic', icon: Brain, risks: riskAssessment.academic || [] },
            { category: 'wellness', label: 'Wellness', icon: Heart, risks: riskAssessment.wellness || [] },
            { category: 'engagement', label: 'Engagement', icon: Zap, risks: riskAssessment.engagement || [] },
            { category: 'technical', label: 'Technical', icon: Settings, risks: riskAssessment.technical || [] }
          ].map((category) => {
            const Icon = category.icon
            const highRisks = category.risks.filter(r => r.severity === 'high').length
            const riskLevel = highRisks > 0 ? 'high' : category.risks.length > 0 ? 'medium' : 'low'
            
            return (
              <div key={category.category} className={`p-4 rounded-xl ${getRiskColor(riskLevel)}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.label}</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {category.risks.length}
                </div>
                <div className="text-sm opacity-75">
                  {highRisks > 0 ? `${highRisks} high risk` : 'No high risks'}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Immediate Actions */}
        {riskAssessment.immediateActions && riskAssessment.immediateActions.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
              Immediate Actions Required
            </h4>
            <ul className="space-y-1">
              {riskAssessment.immediateActions.map((action, index) => (
                <li key={index} className="text-red-700 dark:text-red-300 text-sm flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Prediction Visualizations */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Performance Prediction Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Prediction
          </h3>
          
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={formatPredictionData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="performance" 
                stroke="#3B82F6" 
                fill="#3B82F6"
                fillOpacity={0.3}
                name="Performance"
              />
              <Area 
                type="monotone" 
                dataKey="engagement" 
                stroke="#10B981" 
                fill="#10B981"
                fillOpacity={0.3}
                name="Engagement"
              />
            </AreaChart>
          </ResponsiveContainer>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {Math.round(predictions.performance?.predictedScore || 75)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Predicted Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {Math.round(predictions.performance?.confidence * 100 || 75)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
            </div>
          </div>
        </motion.div>

        {/* Learning Path Prediction */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Learning Path Forecast
          </h3>
          
          {predictions.learningPath && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-600">
                    {predictions.learningPath.completionTimeline?.estimatedWeeks || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Weeks to Complete</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(predictions.learningPath.completionTimeline?.completionProbability * 100 || 75)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Success Probability</div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Estimated Graduation: {predictions.learningPath.estimatedGraduation}
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Based on current learning velocity: {Math.round(predictions.learningPath.learningVelocity * 100)}%
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Optimization Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          AI-Powered Optimization Suggestions
        </h3>
        
        <div className="space-y-4">
          {optimizationSuggestions.map((suggestion, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {suggestion.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Impact: {suggestion.estimatedImpact}</span>
                    <span>•</span>
                    <span>Time: {suggestion.implementationTime}</span>
                  </div>
                </div>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  suggestion.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                  suggestion.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                  suggestion.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                }`}>
                  {suggestion.priority}
                </span>
              </div>
              
              <div className="space-y-2">
                {suggestion.actions.map((action, actionIndex) => (
                  <div key={actionIndex} className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700 dark:text-gray-300">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {optimizationSuggestions.length === 0 && !isAnalyzing && (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No optimization suggestions available. Your learning is on track!
            </p>
          </div>
        )}
      </motion.div>

      {/* Prediction Accuracy Tracking */}
      {Object.keys(predictionAccuracy).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Prediction Accuracy
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(predictionAccuracy).map(([type, accuracy]) => (
              <div key={type} className="text-center">
                <div className="text-2xl font-bold text-primary-500 mb-1">
                  {Math.round(accuracy * 100)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {type.replace('_', ' ')}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${accuracy * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analyzing Your Learning Data
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            AI models are processing your cognitive patterns, learning history, and wellness data...
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default PredictiveAnalytics