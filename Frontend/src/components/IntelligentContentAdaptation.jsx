import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Target, 
  Lightbulb, 
  BookOpen, 
  Settings,
  TrendingUp,
  Eye,
  Timer,
  Award,
  RefreshCw,
  Sliders,
  BarChart3,
  Activity
} from 'lucide-react'
import geminiService from '../services/geminiService'
import advancedMLService from '../services/advancedMLService'

const IntelligentContentAdaptation = ({ 
  moduleData, 
  cognitiveState = {}, 
  userProfile = {},
  learningHistory = {},
  onContentAdapted,
  onAdaptationInsights
}) => {
  const [adaptedContent, setAdaptedContent] = useState(moduleData)
  const [adaptationEngine, setAdaptationEngine] = useState({
    isActive: true,
    sensitivity: 0.7,
    adaptationTypes: ['difficulty', 'explanation', 'interactivity', 'pacing', 'format'],
    learningFromFeedback: true
  })
  const [adaptationHistory, setAdaptationHistory] = useState([])
  const [contentMetrics, setContentMetrics] = useState({
    engagementScore: 0,
    comprehensionRate: 0,
    completionTime: 0,
    interactionCount: 0,
    adaptationEffectiveness: 0
  })
  const [aiInsights, setAiInsights] = useState([])
  const [isAdapting, setIsAdapting] = useState(false)
  const [adaptationPreview, setAdaptationPreview] = useState(null)

  useEffect(() => {
    if (adaptationEngine.isActive && cognitiveState && Object.keys(cognitiveState).length > 0) {
      performIntelligentAdaptation()
    }
  }, [cognitiveState, adaptationEngine.isActive])

  const performIntelligentAdaptation = async () => {
    if (isAdapting) return

    setIsAdapting(true)

    try {
      // AI-powered content analysis and adaptation
      const adaptationAnalysis = await analyzeContentNeedsWithAI()
      
      // ML-powered adaptation recommendations
      const mlRecommendations = await generateMLAdaptations()
      
      // Combine AI and ML insights
      const combinedAdaptations = combineAdaptationStrategies(adaptationAnalysis, mlRecommendations)
      
      // Apply adaptations
      const newContent = await applyIntelligentAdaptations(combinedAdaptations)
      
      // Generate adaptation insights
      const insights = await generateAdaptationInsights(combinedAdaptations, newContent)
      
      setAdaptedContent(newContent)
      setAiInsights(insights)
      
      // Record adaptation
      recordAdaptation(combinedAdaptations, newContent, insights)
      
      // Update metrics
      updateContentMetrics(newContent, combinedAdaptations)
      
      if (onContentAdapted) {
        onContentAdapted(newContent, combinedAdaptations)
      }
      
      if (onAdaptationInsights) {
        onAdaptationInsights(insights)
      }
      
    } catch (error) {
      console.error('Intelligent adaptation failed:', error)
    } finally {
      setIsAdapting(false)
    }
  }

  const analyzeContentNeedsWithAI = async () => {
    try {
      const context = {
        currentContent: adaptedContent,
        cognitiveState,
        userProfile,
        learningHistory,
        previousAdaptations: adaptationHistory.slice(-5)
      }
      
      const analysis = await geminiService.generatePersonalizedExplanation(
        `Analyze content adaptation needs for: ${adaptedContent.title}`,
        userProfile,
        cognitiveState
      )
      
      return {
        needsSimplification: cognitiveState.confusion > 60,
        needsInteractivity: cognitiveState.attention < 50 || cognitiveState.engagement < 50,
        needsPacing: cognitiveState.fatigue > 70,
        needsVisualAids: userProfile.learningStyle === 'visual' && cognitiveState.confusion > 40,
        needsBreak: cognitiveState.fatigue > 80,
        aiRecommendations: analysis.adaptations || [],
        confidence: analysis.confidence || 0.8
      }
    } catch (error) {
      console.error('AI content analysis failed:', error)
      return { confidence: 0.5 }
    }
  }

  const generateMLAdaptations = async () => {
    try {
      const prediction = await advancedMLService.predictLearningOutcome(
        userProfile,
        adaptedContent,
        learningHistory.cognitiveHistory || []
      )
      
      return {
        difficultyAdjustment: prediction.predictedScore < 60 ? 'decrease' : 
                             prediction.predictedScore > 85 ? 'increase' : 'maintain',
        recommendedActions: prediction.recommendations || [],
        riskMitigation: prediction.riskAssessment.mitigation || [],
        confidence: prediction.confidence || 0.7
      }
    } catch (error) {
      console.error('ML adaptation generation failed:', error)
      return { confidence: 0.5 }
    }
  }

  const combineAdaptationStrategies = (aiAnalysis, mlRecommendations) => {
    const strategies = {
      difficulty: {
        action: mlRecommendations.difficultyAdjustment || 'maintain',
        confidence: (aiAnalysis.confidence + mlRecommendations.confidence) / 2,
        reasoning: 'Combined AI and ML analysis'
      },
      explanation: {
        action: aiAnalysis.needsSimplification ? 'simplify' : 'maintain',
        confidence: aiAnalysis.confidence,
        reasoning: 'AI cognitive state analysis'
      },
      interactivity: {
        action: aiAnalysis.needsInteractivity ? 'increase' : 'maintain',
        confidence: aiAnalysis.confidence,
        reasoning: 'Attention and engagement analysis'
      },
      pacing: {
        action: aiAnalysis.needsPacing ? 'slow_down' : 'maintain',
        confidence: aiAnalysis.confidence,
        reasoning: 'Fatigue level analysis'
      },
      format: {
        action: aiAnalysis.needsVisualAids ? 'add_visuals' : 'maintain',
        confidence: aiAnalysis.confidence,
        reasoning: 'Learning style and confusion analysis'
      }
    }
    
    return strategies
  }

  const applyIntelligentAdaptations = async (adaptations) => {
    let newContent = { ...adaptedContent }
    
    // Apply difficulty adaptations
    if (adaptations.difficulty.action === 'decrease') {
      newContent.difficulty = Math.max(1, (newContent.difficulty || 2) - 1)
      newContent.explanationDepth = 'detailed'
      newContent.examplesCount = Math.min(5, (newContent.examplesCount || 2) + 1)
    } else if (adaptations.difficulty.action === 'increase') {
      newContent.difficulty = Math.min(4, (newContent.difficulty || 2) + 1)
      newContent.explanationDepth = 'concise'
      newContent.challengeLevel = 'advanced'
    }
    
    // Apply explanation adaptations
    if (adaptations.explanation.action === 'simplify') {
      newContent.explanationStyle = 'step_by_step'
      newContent.vocabulary = 'simplified'
      newContent.analogies = true
    }
    
    // Apply interactivity adaptations
    if (adaptations.interactivity.action === 'increase') {
      newContent.interactiveElements = [
        'quiz_questions',
        'drag_drop_exercises',
        'simulation_tools',
        'real_time_feedback',
        'gamification'
      ]
      newContent.engagementBoosts = true
    }
    
    // Apply pacing adaptations
    if (adaptations.pacing.action === 'slow_down') {
      newContent.contentChunks = Math.max(3, (newContent.contentChunks || 1) + 1)
      newContent.breakSuggestions = true
      newContent.progressIndicators = 'detailed'
    }
    
    // Apply format adaptations
    if (adaptations.format.action === 'add_visuals') {
      newContent.visualAids = [
        'diagrams',
        'flowcharts',
        'infographics',
        'animations',
        'mind_maps'
      ]
      newContent.primaryFormat = 'visual'
    }
    
    // Add AI-generated enhancements
    newContent.aiEnhancements = await generateAIEnhancements(newContent, adaptations)
    
    return newContent
  }

  const generateAIEnhancements = async (content, adaptations) => {
    try {
      const enhancementPrompt = `
        Enhance this learning content based on adaptations:
        Content: ${content.title}
        Adaptations: ${JSON.stringify(adaptations)}
        User Profile: ${JSON.stringify(userProfile)}
        
        Generate specific enhancements for:
        1. Content structure improvements
        2. Additional examples or analogies
        3. Interactive elements
        4. Assessment questions
        5. Motivation boosters
      `
      
      const enhancements = await geminiService.generatePersonalizedExplanation(
        enhancementPrompt,
        userProfile,
        cognitiveState
      )
      
      return {
        structureImprovements: enhancements.adaptations || [],
        additionalExamples: generateAdditionalExamples(content),
        interactiveElements: generateInteractiveElements(content),
        assessmentQuestions: await generateAdaptiveQuestions(content),
        motivationBoosters: generateMotivationBoosters(cognitiveState)
      }
    } catch (error) {
      console.error('AI enhancement generation failed:', error)
      return {}
    }
  }

  const generateAdditionalExamples = (content) => {
    const examples = [
      {
        type: 'real_world',
        title: 'Real-world Application',
        description: `How ${content.title} applies in everyday scenarios`
      },
      {
        type: 'analogy',
        title: 'Simple Analogy',
        description: `Think of ${content.title} like...`
      },
      {
        type: 'case_study',
        title: 'Case Study',
        description: `Detailed example of ${content.title} in action`
      }
    ]
    
    return examples
  }

  const generateInteractiveElements = (content) => {
    return [
      {
        type: 'simulation',
        title: 'Interactive Simulation',
        description: 'Hands-on exploration of concepts'
      },
      {
        type: 'quiz',
        title: 'Knowledge Check',
        description: 'Quick assessment of understanding'
      },
      {
        type: 'experiment',
        title: 'Virtual Experiment',
        description: 'Test concepts in a safe environment'
      }
    ]
  }

  const generateAdaptiveQuestions = async (content) => {
    try {
      const questions = await geminiService.generateQuizQuestions(
        content.title,
        content.difficulty || 'medium',
        cognitiveState,
        3
      )
      
      return questions.questions || []
    } catch (error) {
      console.error('Adaptive questions generation failed:', error)
      return []
    }
  }

  const generateMotivationBoosters = (cognitiveState) => {
    const boosters = []
    
    if (cognitiveState.fatigue > 60) {
      boosters.push({
        type: 'energy_boost',
        message: "You're doing great! Just a little more focus and you'll master this concept.",
        action: 'show_progress'
      })
    }
    
    if (cognitiveState.confusion > 50) {
      boosters.push({
        type: 'confidence_boost',
        message: "This is challenging material - you're tackling advanced concepts!",
        action: 'highlight_progress'
      })
    }
    
    if (cognitiveState.engagement < 40) {
      boosters.push({
        type: 'relevance_boost',
        message: "Let me show you how this connects to your interests and goals.",
        action: 'show_relevance'
      })
    }
    
    return boosters
  }

  const generateAdaptationInsights = async (adaptations, newContent) => {
    const insights = []
    
    try {
      // Generate AI insights about the adaptations
      const aiInsight = await geminiService.analyzeStudentProgress(
        {
          adaptationsMade: adaptations,
          contentChanges: newContent,
          cognitiveState
        },
        adaptationHistory
      )
      
      insights.push({
        type: 'ai_analysis',
        title: 'AI Adaptation Analysis',
        content: aiInsight.analysis || 'Content successfully adapted to your needs',
        confidence: aiInsight.confidence || 0.8,
        source: 'gemini_ai'
      })
      
      // Generate specific insights for each adaptation
      Object.entries(adaptations).forEach(([type, adaptation]) => {
        if (adaptation.action !== 'maintain') {
          insights.push({
            type: 'adaptation_specific',
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Adaptation`,
            content: `${adaptation.reasoning}: ${adaptation.action}`,
            confidence: adaptation.confidence,
            source: 'adaptation_engine'
          })
        }
      })
      
      // Effectiveness prediction
      const effectiveness = await predictAdaptationEffectiveness(adaptations, newContent)
      insights.push({
        type: 'effectiveness_prediction',
        title: 'Predicted Effectiveness',
        content: `These adaptations are predicted to improve your learning by ${Math.round(effectiveness.improvement)}%`,
        confidence: effectiveness.confidence,
        source: 'ml_prediction'
      })
      
    } catch (error) {
      console.error('Adaptation insights generation failed:', error)
    }
    
    return insights
  }

  const predictAdaptationEffectiveness = async (adaptations, content) => {
    try {
      // Use ML to predict how effective these adaptations will be
      const features = [
        cognitiveState.attention / 100,
        cognitiveState.engagement / 100,
        cognitiveState.confusion / 100,
        cognitiveState.fatigue / 100,
        Object.keys(adaptations).filter(key => adaptations[key].action !== 'maintain').length / 5,
        userProfile.adaptationHistory?.length || 0 / 10,
        content.difficulty / 4,
        learningHistory.averageScore / 100
      ]
      
      // Mock ML prediction - in production would use trained model
      const baseEffectiveness = 0.6
      const adaptationBonus = Object.values(adaptations).reduce((sum, adapt) => 
        sum + (adapt.confidence * 0.1), 0
      )
      
      const effectiveness = Math.min(0.95, baseEffectiveness + adaptationBonus)
      
      return {
        improvement: effectiveness * 30, // Convert to percentage improvement
        confidence: 0.75,
        factors: identifyEffectivenessFactors(adaptations, features)
      }
    } catch (error) {
      console.error('Effectiveness prediction failed:', error)
      return { improvement: 15, confidence: 0.5, factors: [] }
    }
  }

  const identifyEffectivenessFactors = (adaptations, features) => {
    const factors = []
    
    if (adaptations.difficulty?.action === 'decrease' && features[2] > 0.6) {
      factors.push('Difficulty reduction addresses high confusion')
    }
    
    if (adaptations.interactivity?.action === 'increase' && features[0] < 0.5) {
      factors.push('Increased interactivity targets low attention')
    }
    
    if (adaptations.pacing?.action === 'slow_down' && features[3] > 0.7) {
      factors.push('Slower pacing addresses fatigue')
    }
    
    return factors
  }

  const recordAdaptation = (adaptations, newContent, insights) => {
    const record = {
      id: Date.now(),
      timestamp: new Date(),
      cognitiveState: { ...cognitiveState },
      adaptations,
      contentBefore: { ...adaptedContent },
      contentAfter: { ...newContent },
      insights,
      effectiveness: null, // Will be updated based on user feedback
      userFeedback: null
    }
    
    setAdaptationHistory(prev => [...prev.slice(-19), record])
  }

  const updateContentMetrics = (newContent, adaptations) => {
    setContentMetrics(prev => {
      const adaptationCount = Object.values(adaptations).filter(a => a.action !== 'maintain').length
      
      return {
        ...prev,
        interactionCount: prev.interactionCount + 1,
        adaptationEffectiveness: calculateAdaptationEffectiveness(adaptations),
        lastAdaptationTime: new Date()
      }
    })
  }

  const calculateAdaptationEffectiveness = (adaptations) => {
    const effectivenessScores = Object.values(adaptations).map(a => a.confidence || 0.5)
    return effectivenessScores.reduce((sum, score) => sum + score, 0) / effectivenessScores.length * 100
  }

  const previewAdaptation = async (adaptationType, action) => {
    try {
      const previewContent = { ...adaptedContent }
      
      // Apply single adaptation for preview
      switch (adaptationType) {
        case 'difficulty':
          if (action === 'decrease') {
            previewContent.difficulty = Math.max(1, (previewContent.difficulty || 2) - 1)
            previewContent.previewChanges = ['Simplified vocabulary', 'More examples', 'Step-by-step breakdown']
          } else if (action === 'increase') {
            previewContent.difficulty = Math.min(4, (previewContent.difficulty || 2) + 1)
            previewContent.previewChanges = ['Advanced concepts', 'Fewer examples', 'Higher complexity']
          }
          break
          
        case 'interactivity':
          if (action === 'increase') {
            previewContent.previewChanges = ['Interactive quizzes', 'Drag-and-drop exercises', 'Real-time feedback']
          }
          break
          
        case 'format':
          if (action === 'add_visuals') {
            previewContent.previewChanges = ['Diagrams and charts', 'Visual explanations', 'Infographics']
          }
          break
      }
      
      setAdaptationPreview({
        type: adaptationType,
        action,
        content: previewContent,
        timestamp: new Date()
      })
      
      // Auto-hide preview after 5 seconds
      setTimeout(() => setAdaptationPreview(null), 5000)
      
    } catch (error) {
      console.error('Adaptation preview failed:', error)
    }
  }

  const applyPreviewedAdaptation = () => {
    if (adaptationPreview) {
      setAdaptedContent(adaptationPreview.content)
      setAdaptationPreview(null)
      
      if (window.toast) {
        window.toast.success(`Applied ${adaptationPreview.type} adaptation`)
      }
    }
  }

  const revertAdaptation = () => {
    if (adaptationHistory.length > 0) {
      const lastRecord = adaptationHistory[adaptationHistory.length - 1]
      setAdaptedContent(lastRecord.contentBefore)
      
      if (window.toast) {
        window.toast.info('Reverted to previous content version')
      }
    }
  }

  const exportAdaptationData = () => {
    const exportData = {
      adaptationHistory,
      contentMetrics,
      aiInsights,
      adaptationEngine,
      userProfile: userProfile.id,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'content-adaptation-data.json'
    link.click()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Intelligent Content Adaptation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered real-time content optimization
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                adaptationEngine.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {adaptationEngine.isActive ? 'Auto-Adapting' : 'Manual Mode'}
              </span>
            </div>
            
            <button
              onClick={() => setAdaptationEngine(prev => ({ ...prev, isActive: !prev.isActive }))}
              className={`p-2 rounded-lg transition-colors ${
                adaptationEngine.isActive 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Adaptation Status */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { 
              label: 'Difficulty', 
              value: adaptedContent.difficulty || 2,
              max: 4,
              icon: Target,
              color: 'blue'
            },
            { 
              label: 'Interactivity', 
              value: adaptedContent.interactiveElements?.length || 0,
              max: 5,
              icon: Zap,
              color: 'green'
            },
            { 
              label: 'Visual Aids', 
              value: adaptedContent.visualAids?.length || 0,
              max: 5,
              icon: Eye,
              color: 'purple'
            },
            { 
              label: 'Examples', 
              value: adaptedContent.examplesCount || 2,
              max: 5,
              icon: Lightbulb,
              color: 'yellow'
            },
            { 
              label: 'Adaptations', 
              value: adaptationHistory.length,
              max: 10,
              icon: Brain,
              color: 'red'
            }
          ].map((metric) => {
            const Icon = metric.icon
            const percentage = (metric.value / metric.max) * 100
            
            return (
              <div key={metric.label} className="text-center">
                <div className={`w-10 h-10 bg-${metric.color}-100 dark:bg-${metric.color}-900/20 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`w-5 h-5 text-${metric.color}-500`} />
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className={`bg-${metric.color}-500 h-1 rounded-full transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-6">
        {/* Adaptation Preview */}
        <AnimatePresence>
          {adaptationPreview && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Adaptation Preview: {adaptationPreview.type}
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={applyPreviewedAdaptation}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setAdaptationPreview(null)}
                    className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <div className="space-y-1">
                {adaptationPreview.content.previewChanges?.map((change, index) => (
                  <div key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Adaptation Controls */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Manual Adaptations
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { type: 'difficulty', action: 'decrease', label: 'Simplify', icon: Lightbulb, color: 'green' },
              { type: 'difficulty', action: 'increase', label: 'Challenge', icon: Target, color: 'red' },
              { type: 'interactivity', action: 'increase', label: 'More Interactive', icon: Zap, color: 'blue' },
              { type: 'format', action: 'add_visuals', label: 'Add Visuals', icon: Eye, color: 'purple' },
              { type: 'pacing', action: 'slow_down', label: 'Slow Down', icon: Timer, color: 'orange' },
              { type: 'explanation', action: 'simplify', label: 'Explain Better', icon: BookOpen, color: 'teal' }
            ].map((adaptation) => {
              const Icon = adaptation.icon
              return (
                <button
                  key={`${adaptation.type}_${adaptation.action}`}
                  onClick={() => previewAdaptation(adaptation.type, adaptation.action)}
                  disabled={isAdapting}
                  className={`flex items-center space-x-2 p-3 bg-${adaptation.color}-50 dark:bg-${adaptation.color}-900/20 text-${adaptation.color}-700 dark:text-${adaptation.color}-300 rounded-lg hover:bg-${adaptation.color}-100 dark:hover:bg-${adaptation.color}-900/30 transition-colors disabled:opacity-50`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{adaptation.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Adaptation Insights
            </h3>
            <div className="space-y-3">
              {aiInsights.map((insight, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start space-x-3">
                    <Brain className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                        {insight.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Source: {insight.source} • {Math.round(insight.confidence * 100)}% confidence
                        </span>
                        {insight.type === 'effectiveness_prediction' && (
                          <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                            High Impact
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Metrics Dashboard */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Adaptation Effectiveness
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Engagement', value: contentMetrics.engagementScore, icon: Zap, color: 'green' },
              { label: 'Comprehension', value: contentMetrics.comprehensionRate, icon: Brain, color: 'blue' },
              { label: 'Effectiveness', value: contentMetrics.adaptationEffectiveness, icon: TrendingUp, color: 'purple' },
              { label: 'Interactions', value: contentMetrics.interactionCount, icon: Activity, color: 'orange' }
            ].map((metric) => {
              const Icon = metric.icon
              return (
                <div key={metric.label} className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Icon className={`w-6 h-6 text-${metric.color}-500 mx-auto mb-2`} />
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round(metric.value)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Adaptation History */}
        {adaptationHistory.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Adaptations
              </h3>
              <button
                onClick={revertAdaptation}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Revert Last
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {adaptationHistory.slice(-3).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {Object.keys(record.adaptations).filter(key => 
                          record.adaptations[key].action !== 'maintain'
                        ).join(', ').replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {record.timestamp.toLocaleTimeString()} • {record.insights.length} insights
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    🤖 AI + ML
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adaptation Engine Settings */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Adaptation Engine
            </h3>
            <button
              onClick={exportAdaptationData}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Export Data
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Adaptation Sensitivity: {Math.round(adaptationEngine.sensitivity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={adaptationEngine.sensitivity}
                onChange={(e) => setAdaptationEngine(prev => ({ 
                  ...prev, 
                  sensitivity: parseFloat(e.target.value) 
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-primary"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-Adaptation</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adaptationEngine.isActive}
                    onChange={(e) => setAdaptationEngine(prev => ({ 
                      ...prev, 
                      isActive: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Learn from Feedback</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adaptationEngine.learningFromFeedback}
                    onChange={(e) => setAdaptationEngine(prev => ({ 
                      ...prev, 
                      learningFromFeedback: e.target.checked 
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntelligentContentAdaptation