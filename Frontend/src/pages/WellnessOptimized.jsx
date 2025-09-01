import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Heart, 
  Brain, 
  Moon, 
  Sun, 
  Activity, 
  Smile,
  Frown,
  Meh,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  TrendingUp,
  Calendar,
  Target
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { wellnessAPI } from '../services/api'

const WellnessOptimized = () => {
  // Core state
  const [currentMood, setCurrentMood] = useState(null)
  const [stressLevel, setStressLevel] = useState(3)
  const [energyLevel, setEnergyLevel] = useState(7)
  const [isBreakActive, setIsBreakActive] = useState(false)
  const [breakTimer, setBreakTimer] = useState(0)
  const [breakStartTime, setBreakStartTime] = useState(null)

  // Wellness data
  const [wellnessData, setWellnessData] = useState([])
  const [wellnessScore, setWellnessScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // ML wellness
  const [mlWellnessScore, setMlWellnessScore] = useState(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState(null)

  // Input form
  const [inputForm, setInputForm] = useState({
    mood: { score: '', tags: '', note: '' },
    stress: { level: '' },
    energy: { level: '' },
    sleep: { hours: '', quality: '' },
    activity: { minutes: '', type: '' },
    nutrition: { score: '' },
    hydration: { glasses: '' },
    screen_time: { hours: '' },
    custom: ''
  })
  const [inputResult, setInputResult] = useState(null)
  const [inputLoading, setInputLoading] = useState(false)
  const [inputError, setInputError] = useState(null)

  // Local tracking
  const [entriesToday, setEntriesToday] = useState([])
  const [breaksToday, setBreaksToday] = useState([])
  const [breathingCount, setBreathingCount] = useState(0)
  const [hydrationCount, setHydrationCount] = useState(0)

  // Memoized values for performance
  const moods = useMemo(() => [
    { icon: Smile, label: 'Great', value: 5, color: 'text-green-500' },
    { icon: Smile, label: 'Good', value: 4, color: 'text-blue-500' },
    { icon: Meh, label: 'Okay', value: 3, color: 'text-yellow-500' },
    { icon: Frown, label: 'Poor', value: 2, color: 'text-orange-500' },
    { icon: Frown, label: 'Bad', value: 1, color: 'text-red-500' }
  ], [])

  const wellnessActivities = useMemo(() => [
    {
      title: 'Breathing Exercise',
      description: '4-7-8 breathing technique for relaxation',
      icon: Activity,
      duration: '5 min',
      action: () => startBreathingExercise()
    },
    {
      title: 'Eye Rest',
      description: '20-20-20 rule for eye strain relief',
      icon: Sun,
      duration: '1 min',
      action: () => startEyeRest()
    },
    {
      title: 'Mindful Break',
      description: 'Guided meditation for stress relief',
      icon: Brain,
      duration: '3 min',
      action: () => startMindfulBreak()
    },
    {
      title: 'Hydration Reminder',
      description: 'Drink water for better focus',
      icon: Coffee,
      duration: '1 min',
      action: () => recordHydration()
    }
  ], [])

  // Memoized wellness score calculation
  const calculatedWellnessScore = useMemo(() => {
    if (entriesToday.length === 0) return null
    
    const totalScore = entriesToday.reduce((sum, entry) => {
      const moodScore = (entry.mood / 5) * 40
      const stressScore = ((10 - entry.stress) / 10) * 30
      const energyScore = (entry.energy / 10) * 30
      return sum + moodScore + stressScore + energyScore
    }, 0)
    
    return Math.round(totalScore / entriesToday.length)
  }, [entriesToday])

  // Memoized chart data
  const chartData = useMemo(() => {
    return wellnessData.slice(-7).map((entry, index) => ({
      day: `Day ${index + 1}`,
      score: entry.wellness_score || 0,
      mood: entry.mood_score || 0,
      stress: entry.stress_level || 0
    }))
  }, [wellnessData])

  // Memoized daily goals
  const dailyGoals = useMemo(() => [
    { label: 'Breathing Exercises', current: breathingCount, target: 3, completed: breathingCount >= 3 },
    { label: 'Hydration', current: hydrationCount, target: 8, completed: hydrationCount >= 8 },
    { label: 'Wellness Check-ins', current: entriesToday.length, target: 2, completed: entriesToday.length >= 2 },
    { label: 'Break Sessions', current: breaksToday.length, target: 4, completed: breaksToday.length >= 4 }
  ], [breathingCount, hydrationCount, entriesToday.length, breaksToday.length])

  // Break timer effect
  useEffect(() => {
    let interval
    if (isBreakActive && breakStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - breakStartTime) / 1000)
        setBreakTimer(elapsed)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isBreakActive, breakStartTime])

  // Memoized event handlers
  const handleMoodSelect = useCallback((mood) => {
    setCurrentMood(mood)
    const newEntry = {
      mood: mood.value,
      stress: stressLevel,
      energy: energyLevel,
      timestamp: new Date()
    }
    setEntriesToday(prev => [...prev, newEntry])
  }, [stressLevel, energyLevel])

  const handleSubmitWellness = useCallback(async () => {
    setInputLoading(true)
    setInputError(null)
    
    try {
      // Normalize and coerce inputs to numeric types where appropriate
      const moodScore = Number(inputForm.mood.score) || 5
      const moodTags = typeof inputForm.mood.tags === 'string' ? inputForm.mood.tags.split(',').map(t => t.trim()).filter(Boolean) : (inputForm.mood.tags || [])
      const stressLevelVal = Number(inputForm.stress.level) || 5
      const energyVal = Number(inputForm.energy.level) || 5
      const sleepHours = Number(inputForm.sleep.hours) || 7
      const sleepQuality = inputForm.sleep.quality || 'good'
      const activityMinutes = Number(inputForm.activity.minutes) || 30
      const activityType = inputForm.activity.type || 'walking'
      const nutritionScore = Number(inputForm.nutrition.score) || 7
      const hydrationGlasses = Number(inputForm.hydration.glasses) || 6
      const screenHours = Number(inputForm.screen_time.hours) || 4

      let customData = ''
      if (inputForm.custom) {
        try {
          customData = JSON.parse(inputForm.custom)
        } catch (e) {
          // keep as string if not valid JSON
          customData = inputForm.custom
        }
      }

      const data = {
        mood: { score: moodScore, tags: moodTags, note: inputForm.mood.note || '' },
        stress: { level: stressLevelVal, sources: [], note: '' },
        energy: { level: energyVal, note: '' },
        sleep: { hours: sleepHours, quality: sleepQuality, note: '' },
        activity: { minutes: activityMinutes, type: activityType, note: '' },
        nutrition: { score: nutritionScore, note: '' },
        hydration: { glasses: hydrationGlasses, note: '' },
        screen_time: { hours: screenHours, note: '' },
        custom: customData,
        timestamp: new Date().toISOString()
      }

      // Debug: log the exact payload sent to backend
      console.log('ML payload ->', data)

      const result = await wellnessAPI.calculateML(data)
      setInputResult(result)
      setMlWellnessScore(Math.round(result.wellness_score))
      // Keep form values after submit to make debugging easier. Uncomment to clear after success.
      // setInputForm({ mood: { score: '', tags: '', note: '' }, stress: { level: '' }, energy: { level: '' }, sleep: { hours: '', quality: '' }, activity: { minutes: '', type: '' }, nutrition: { score: '' }, hydration: { glasses: '' }, screen_time: { hours: '' }, custom: '' })
    } catch (err) {
      setInputError(err?.message || 'Failed to calculate wellness')
    } finally {
      setInputLoading(false)
    }
  }, [inputForm])

  const handleToggleBreak = useCallback(() => {
    if (isBreakActive) {
      const breakDuration = Math.floor((Date.now() - breakStartTime) / 1000)
      const newBreak = {
        duration_seconds: breakDuration,
        started_at: new Date(breakStartTime),
        ended_at: new Date(),
        type: 'general'
      }
      setBreaksToday(prev => [...prev, newBreak])
      setIsBreakActive(false)
      setBreakStartTime(null)
      setBreakTimer(0)
    } else {
      setIsBreakActive(true)
      setBreakStartTime(Date.now())
    }
  }, [isBreakActive, breakStartTime])

  const startBreathingExercise = useCallback(() => {
    setBreathingCount(prev => prev + 1)
    alert('Take 4 deep breaths, hold for 7, exhale for 8. Repeat 5 times.')
  }, [])

  const startEyeRest = useCallback(() => {
    alert('Look at something 20 feet away for 20 seconds. Take a deep breath.')
  }, [])

  const startMindfulBreak = useCallback(() => {
    alert('Close your eyes and take 3 deep breaths. Focus on your breathing.')
  }, [])

  const recordHydration = useCallback(() => {
    setHydrationCount(prev => prev + 1)
  }, [])

  // Fetch wellness data on mount
  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const [analytics, insights] = await Promise.all([
          wellnessAPI.getAnalytics().catch(() => null),
          wellnessAPI.getInsights().catch(() => null)
        ])
        
        if (analytics) setWellnessData(analytics.data || [])
      } catch (error) {
        console.error('Failed to fetch wellness data:', error)
      }
    }
    
    fetchWellness()
  }, [])

  // Display wellness score
  const displayWellnessScore = mlWellnessScore || calculatedWellnessScore || wellnessScore || '—'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Heart className="w-8 h-8 text-red-500" />
            <span>Wellness Dashboard</span>
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your wellness, take breaks, and maintain a healthy balance
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wellness Score Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Your Wellness Score
              </h3>
              <div className="text-center">
                <div className="text-6xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {displayWellnessScore}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {displayWellnessScore === '—' ? 'No data yet' : 'Current wellness level'}
                </p>
              </div>
            </div>

            {/* ML Wellness Input Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Calculate ML Wellness Score
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mood Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={inputForm.mood.score}
                    onChange={(e) => setInputForm(prev => ({ ...prev, mood: { ...prev.mood, score: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stress Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={inputForm.stress.level}
                    onChange={(e) => setInputForm(prev => ({ ...prev, stress: { ...prev.stress, level: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Energy Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={inputForm.energy.level}
                    onChange={(e) => setInputForm(prev => ({ ...prev, energy: { ...prev.energy, level: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="7"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sleep Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={inputForm.sleep.hours}
                    onChange={(e) => setInputForm(prev => ({ ...prev, sleep: { ...prev.sleep, hours: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="7.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sleep Quality
                  </label>
                  <select
                    value={inputForm.sleep.quality}
                    onChange={(e) => setInputForm(prev => ({ ...prev, sleep: { ...prev.sleep, quality: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select quality</option>
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Activity Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inputForm.activity.minutes}
                    onChange={(e) => setInputForm(prev => ({ ...prev, activity: { ...prev.activity, minutes: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="45"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nutrition Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={inputForm.nutrition.score}
                    onChange={(e) => setInputForm(prev => ({ ...prev, nutrition: { ...prev.nutrition, score: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hydration (glasses)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inputForm.hydration.glasses}
                    onChange={(e) => setInputForm(prev => ({ ...prev, hydration: { ...prev.hydration, glasses: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="8"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Screen Time (hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={inputForm.screen_time.hours}
                    onChange={(e) => setInputForm(prev => ({ ...prev, screen_time: { ...prev.screen_time, hours: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="4"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Fields (JSON)
                </label>
                <textarea
                  value={inputForm.custom}
                  onChange={(e) => setInputForm(prev => ({ ...prev, custom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder='{"meditation_minutes": 20, "social_interactions": 5}'
                />
              </div>
              
              <button
                onClick={handleSubmitWellness}
                disabled={inputLoading}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inputLoading ? 'Calculating...' : 'Calculate ML Wellness Score'}
              </button>
              
              {inputError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700">
                  {inputError}
                </div>
              )}
              
              {inputResult && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">ML Wellness Result:</h4>
                  <p className="text-green-700 dark:text-green-300">
                    Score: {inputResult.wellness_score} | Confidence: {inputResult.confidence} | Model: {inputResult.model_type}
                  </p>
                  {inputResult.recommendations && inputResult.recommendations.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-green-800 dark:text-green-200">Recommendations:</p>
                      <ul className="list-disc list-inside text-green-700 dark:text-green-300 text-sm">
                        {inputResult.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wellness Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wellness Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="mood" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="stress" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Break Timer */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Break Timer
              </h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                  {Math.floor(breakTimer / 60)}:{(breakTimer % 60).toString().padStart(2, '0')}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {isBreakActive ? 'Break in progress' : 'Ready for a break?'}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleToggleBreak}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  {isBreakActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isBreakActive ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsBreakActive(false)
                    setBreakTimer(0)
                    setBreakStartTime(null)
                  }}
                  className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Wellness Activities */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wellness Activities
              </h3>
              
              <div className="space-y-3">
                {wellnessActivities.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <button
                      key={index}
                      onClick={activity.action}
                      className="w-full flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800/50 transition-colors">
                        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.duration}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Daily Goals */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Wellness Goals
              </h3>
              <div className="space-y-4">
                {dailyGoals.map((goal, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        goal.completed ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}></div>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {goal.label}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Summary
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-600 dark:text-gray-400">Study Sessions</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">—</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-success-500" />
                    <span className="text-gray-600 dark:text-gray-400">Goals Achieved</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">—</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">Avg. Focus</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">—</span>
                </div>
              </div>
            </div>

            {/* Wellness Tips */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wellness Tips
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  Take regular breaks every 25 minutes to maintain focus and reduce eye strain.
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  Stay hydrated throughout the day for better cognitive performance.
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                  Practice deep breathing exercises to reduce stress and improve concentration.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WellnessOptimized
