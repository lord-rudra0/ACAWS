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
 

const Wellness = () => {
  const [currentMood, setCurrentMood] = useState(null)
  const [stressLevel, setStressLevel] = useState(3)
  const [energyLevel, setEnergyLevel] = useState(7)
  const [isBreakActive, setIsBreakActive] = useState(false)
  const [breakTimer, setBreakTimer] = useState(0)
  const [breathingExercise, setBreathingExercise] = useState({
    active: false,
    phase: 'inhale', // inhale, hold, exhale
    count: 4
  })

  const [wellnessData, setWellnessData] = useState([])
  const [wellnessScore, setWellnessScore] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [breakStartTime, setBreakStartTime] = useState(null)

  // AI/Analytics derived state
  // Small client-side fallback tips shown when backend/assistant returns none
  const FALLBACK_TIPS = [
    'Take 3 deep breaths right now — slow inhale, hold, slow exhale.',
    'Stand up and stretch for 2 minutes to relieve tension.',
    'Drink a glass of water and take a short walk to reset focus.'
  ]

  const [tipsLoading, setTipsLoading] = useState(false)
  const [tipsError, setTipsError] = useState(null)
  const [aiTips, setAiTips] = useState(FALLBACK_TIPS)
  const [dailyGoals, setDailyGoals] = useState([])
  const [goalsLoading, setGoalsLoading] = useState(false)
  const [summary, setSummary] = useState({ sessions: null, goalsAchieved: null, goalsTotal: null, avgFocus: null })
  const [dailySaved, setDailySaved] = useState(false)

  // Local records tracked only from this page interactions
  const [entriesToday, setEntriesToday] = useState([]) // {mood, stress, energy, timestamp}
  const [breaksToday, setBreaksToday] = useState([]) // {duration_seconds, started_at, ended_at, type}
  const [breathingCount, setBreathingCount] = useState(0)
  const [hydrationCount, setHydrationCount] = useState(0)

  const [mlWellnessScore, setMlWellnessScore] = useState(null)
  const [mlLoading, setMlLoading] = useState(false)
  const [mlError, setMlError] = useState(null)

  const [inputForm, setInputForm] = useState({
    mood: { score: '', tags: '', note: '' },
    stress: { level: 5 },
    energy: { level: 7 },
    sleep: { hours: 7, quality: 'good' },
    activity: { minutes: 30, type: 'walking' },
    nutrition: { score: 7 },
    hydration: { glasses: 6 },
    screen_time: { hours: 4 },
    custom: ''
  })
  const [inputResult, setInputResult] = useState(null)
  const [inputLoading, setInputLoading] = useState(false)
  const [inputError, setInputError] = useState(null)

  // Helper to ensure a visible loader for at least `minMs` milliseconds
  const ensureMinDelay = async (startTime, minMs = 500) => {
    const elapsed = Date.now() - startTime
    if (elapsed < minMs) {
      await new Promise(r => setTimeout(r, minMs - elapsed))
    }
  }

  // Helper to create a date label for recent scores (returns MM-DD)
  const formatDateLabel = (daysAgo = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    return d.toISOString().slice(5, 10)
  }

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
      description: 'Quick mindfulness meditation',
      icon: Brain,
      duration: '10 min',
      action: () => startMindfulBreak()
    },
    {
      title: 'Hydration Reminder',
      description: 'Time to drink some water',
      icon: Coffee,
      duration: '30 sec',
      action: () => showHydrationReminder()
    }
  ], [])

  // Memoized wellness score calculation
  const calculatedWellnessScore = useMemo(() => {
    if (!Array.isArray(entriesToday) || entriesToday.length === 0) return null
    
    const totalScore = entriesToday.reduce((sum, entry) => {
      const moodScore = (entry.mood / 5) * 40 // 40% weight
      const stressScore = ((10 - entry.stress) / 10) * 30 // 30% weight (inverted)
      const energyScore = (entry.energy / 10) * 30 // 30% weight
      return sum + moodScore + stressScore + energyScore
    }, 0)
    
    return Math.round(totalScore / entriesToday.length)
  }, [entriesToday])

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!Array.isArray(wellnessData) || wellnessData.length === 0) {
      return []
    }
    return wellnessData.slice(-7).map((entry, index, arr) => ({
      day: entry.day || `Day ${index + 1}`,
      score: entry.wellness_score || 0,
      mood: entry.mood_score || 0,
      stress: entry.stress_level || 0
    }))
  }, [wellnessData])

  // Memoized daily goals
  const memoizedDailyGoals = useMemo(() => [
    { label: 'Breathing Exercises', current: breathingCount || 0, target: 3, completed: (breathingCount || 0) >= 3 },
    { label: 'Hydration', current: hydrationCount || 0, target: 8, completed: (hydrationCount || 0) >= 8 },
    { label: 'Wellness Check-ins', current: Array.isArray(entriesToday) ? entriesToday.length : 0, target: 2, completed: (Array.isArray(entriesToday) ? entriesToday.length : 0) >= 2 },
    { label: 'Break Sessions', current: Array.isArray(breaksToday) ? breaksToday.length : 0, target: 4, completed: (Array.isArray(breaksToday) ? breaksToday.length : 0) >= 4 }
  ], [breathingCount, hydrationCount, entriesToday, breaksToday])

  // Update daily goals when dependencies change
  useEffect(() => {
    setDailyGoals(memoizedDailyGoals)
  }, [memoizedDailyGoals])

  // Optimized break timer
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

  // Optimized breathing exercise timer
  useEffect(() => {
    let interval
    if (breathingExercise.active) {
      interval = setInterval(() => {
        setBreathingExercise(prev => {
          if (prev.count <= 1) {
            return { ...prev, active: false, count: 4 }
          }
          return { ...prev, count: prev.count - 1 }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [breathingExercise.active])

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
      const data = {
        mood: { 
          score: inputForm.mood.score || 5, 
          tags: (inputForm.mood.tags || '').split(',').filter(t => t.trim()), 
          note: inputForm.mood.note || '' 
        },
        stress: { level: inputForm.stress.level || 5, sources: [], note: '' },
        energy: { level: inputForm.energy.level || 5, note: '' },
        sleep: { hours: inputForm.sleep.hours || 7, quality: inputForm.sleep.quality || 'good', note: '' },
        activity: { minutes: inputForm.activity.minutes || 30, type: inputForm.activity.type || 'walking', note: '' },
        nutrition: { score: inputForm.nutrition.score || 7, note: '' },
        hydration: { glasses: inputForm.hydration.glasses || 6, note: '' },
        screen_time: { hours: inputForm.screen_time.hours || 4, note: '' }
      }

      if (inputForm.custom) {
        data.custom = inputForm.custom
      }

      // --- NEW: call ML and immediately update local history + fetch tips with loader ---
      const result = await wellnessAPI.calculateML(data)
      setInputResult(result)
      setMlWellnessScore(Math.round(result.wellness_score))

      try {
        const newEntry = {
          id: result.entry_id || null,
          wellness_score: result.wellness_score,
          mood_score: data.mood.score,
          stress_level: data.stress.level,
          energy_level: data.energy.level,
          created_at: new Date().toISOString()
        }

        setWellnessData(prev => {
          const arr = Array.isArray(prev) ? [...prev] : []
          arr.push(newEntry)
          while (arr.length > 7) arr.shift()
          return arr
        })

        // Best-effort: if backend did not create an entry, record it
        if (!result.entry_id) {
          wellnessAPI.recordEntry({
            mood_score: data.mood.score,
            stress_level: data.stress.level,
            energy_level: data.energy.level,
            sleep_hours: data.sleep?.hours || null,
            sleep_quality: data.sleep?.quality || null,
            notes: data.mood.note || '',
            mood_tags: data.mood.tags || []
          }).catch(err => console.debug('recordEntry fallback failed', err))
        }
      } catch (e) {
        console.debug('Failed to update local wellness history:', e)
      }

      // Fetch tips and show loader in the Tips card. Keep loader visible
      // for a short minimum so users can perceive activity.
      setAiTips([])
      setTipsLoading(true)
      setTipsError(null)
      const tipsStart = Date.now()
      try {
        const tipsResp = await wellnessAPI.generateHiddenTips({ input: data, wellness_score: result.wellness_score })
        // Normalize returned shape
        const returned = tipsResp || {}
        const returnedTips = Array.isArray(returned.tips)
          ? returned.tips
          : Array.isArray(returned.data)
            ? returned.data
            : Array.isArray(returned) ? returned : []

        if (returnedTips.length > 0) {
          setAiTips(returnedTips)
        } else {
          // Use safe client-side fallback tips so UI isn't empty
          setAiTips(FALLBACK_TIPS)
        }
      } catch (e) {
        console.debug('Hidden tips call failed (ignored)', e)
        setTipsError('Failed to load tips')
        setAiTips(FALLBACK_TIPS)
      } finally {
        await ensureMinDelay(tipsStart, 500)
        setTipsLoading(false)
      }

      // Reset form
      setInputForm({
        mood: { score: '', tags: '', note: '' },
        stress: { level: 5 },
        energy: { level: 7 },
        sleep: { hours: 7, quality: 'good' },
        activity: { minutes: 30, type: 'walking' },
        nutrition: { score: 7 },
        hydration: { glasses: 6 },
        screen_time: { hours: 4 },
        custom: ''
      })
      // Refresh persisted daily summary so UI reflects the saved latest score and counters
      try {
        const ds2 = await wellnessAPI.getDailySummary().catch(() => null)
        const summaryObj2 = ds2?.summary ?? ds2
        if (summaryObj2) {
          setSummary({
            sessions: summaryObj2.sessions ?? summaryObj2.sessions_count ?? null,
            goalsAchieved: summaryObj2.goals_achieved ?? summaryObj2.goalsAchieved ?? (summaryObj2.goals?.achieved) ?? null,
            goalsTotal: summaryObj2.goals_total ?? summaryObj2.goalsTotal ?? (summaryObj2.goals?.total) ?? null,
            avgFocus: summaryObj2.avg_focus ?? summaryObj2.avgFocus ?? null
          })

          const lastScores2 = Array.isArray(summaryObj2.last_seven_scores) ? summaryObj2.last_seven_scores : []
          if (lastScores2.length > 0) {
            setWellnessScore(lastScores2[0])
            const chron2 = [...lastScores2].reverse()
            setWellnessData(chron2.map((s, i) => ({ wellness_score: s, created_at: null, day: formatDateLabel(lastScores2.length - 1 - i) })))
          }
        }
      } catch (e) {
        console.debug('getDailySummary after calculateML failed (ignored)', e)
      }
      // --- END NEW ---

    } catch (err) {
      setInputError(err?.message || 'Failed to calculate wellness')
    } finally {
      setInputLoading(false)
    }
  }, [inputForm])

  const handleToggleBreak = useCallback(() => {
    if (isBreakActive) {
      // End break
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
      // Start break
    setIsBreakActive(true)
      setBreakStartTime(Date.now())
    }
  }, [isBreakActive, breakStartTime])

  const startBreathingExercise = useCallback(() => {
    setBreathingExercise({ active: true, phase: 'inhale', count: 4 })
    setBreathingCount(prev => prev + 1)
  }, [])

  const startEyeRest = useCallback(() => {
    // Simple eye rest implementation
    alert('Look at something 20 feet away for 20 seconds. Take a deep breath.')
  }, [])

  const startMindfulBreak = useCallback(() => {
    // Simple mindful break implementation
    alert('Close your eyes and take 3 deep breaths. Focus on your breathing.')
  }, [])

  const recordHydration = useCallback(() => {
    setHydrationCount(prev => prev + 1)
  }, [])

  const showHydrationReminder = useCallback(() => {
    alert('💧 Time to hydrate! Drink a glass of water.')
    setHydrationCount(prev => prev + 1)
  }, [])

  // Fetch wellness analytics on mount
  useEffect(() => {
    const fetchWellness = async () => {
      setTipsLoading(true)
      const start = Date.now()
      try {
        const [history, insights, moodData] = await Promise.all([
          wellnessAPI.getHistory(7).catch(() => null), // Get last 7 days instead of getAnalytics
          wellnessAPI.getInsights().catch(() => null),
          wellnessAPI.getMoodAnalytics('week').catch(() => null)
        ])

        console.debug('fetchWellness: history=', history)
        console.debug('fetchWellness: insights raw=', insights)
        console.debug('fetchWellness: moodData=', moodData)

        // Ensure we always set arrays, even if API returns null/undefined
        setWellnessData(Array.isArray(history?.history) ? history.history : Array.isArray(history?.data) ? history.data : Array.isArray(history) ? history : [])

        // Normalize insights response robustly
        let normalizedTips = []
        if (!insights) normalizedTips = []
        else if (Array.isArray(insights)) normalizedTips = insights
        else if (insights?.success && Array.isArray(insights.insights)) normalizedTips = insights.insights
        else if (Array.isArray(insights?.tips)) normalizedTips = insights.tips
        else if (Array.isArray(insights?.data)) normalizedTips = insights.data
        else if (Array.isArray(insights?.insights)) normalizedTips = insights.insights
        else normalizedTips = []

        console.debug('fetchWellness: normalizedTips=', normalizedTips)
        setAiTips(normalizedTips.length > 0 ? normalizedTips : FALLBACK_TIPS)
        // Proactively request server-side (hidden) tips to populate AI tips immediately.
        // We keep the current normalized tips (or fallback) while awaiting assistant response,
        // then replace them if assistant returns non-empty tips.
        try {
          const lastEntry = Array.isArray(history?.history) && history.history.length > 0
            ? history.history[0]
            : (Array.isArray(wellnessData) && wellnessData.length > 0 ? wellnessData[wellnessData.length - 1] : null)

          const payload = {
            input: { last_entry: lastEntry, history: Array.isArray(history?.history) ? history.history : [] },
            wellness_score: lastEntry?.wellness_score || (normalizedTips[0]?.wellness_score) || null
          }

          const assistantStart = Date.now()
          const tipsResp = await wellnessAPI.generateHiddenTips(payload)
          const returned = tipsResp || {}
          const returnedTips = Array.isArray(returned.tips)
            ? returned.tips
            : Array.isArray(returned.data) ? returned.data : Array.isArray(returned) ? returned : []

          if (returnedTips.length > 0) {
            setAiTips(returnedTips)
          }
        } catch (e) {
          console.debug('generateHiddenTips on mount failed (ignored)', e)
        }
        setSummary(moodData?.summary || {})
        // Load persisted daily summary (latest wellness score, last 7 scores, goals, sessions, avg_focus)
        try {
          const ds = await wellnessAPI.getDailySummary().catch(() => null)
          const summaryObj = ds?.summary ?? ds
          if (summaryObj) {
            setSummary({
              sessions: summaryObj.sessions ?? summaryObj.sessions_count ?? null,
              goalsAchieved: summaryObj.goals_achieved ?? summaryObj.goalsAchieved ?? (summaryObj.goals?.achieved) ?? null,
              goalsTotal: summaryObj.goals_total ?? summaryObj.goalsTotal ?? (summaryObj.goals?.total) ?? null,
              avgFocus: summaryObj.avg_focus ?? summaryObj.avgFocus ?? null
            })

            // Persisted last-seven scores -> update displayed wellness score and chart
            const lastScores = Array.isArray(summaryObj.last_seven_scores) ? summaryObj.last_seven_scores : []
            if (lastScores.length > 0) {
              // API stores newest first; first element = latest. For display/chart we want oldest->newest
              setWellnessScore(lastScores[0])
              const chron = [...lastScores].reverse() // oldest -> newest
              setWellnessData(chron.map((s, i) => ({ wellness_score: s, created_at: null, day: formatDateLabel(lastScores.length - 1 - i) })))
            }
          }
        } catch (e) {
          console.debug('getDailySummary on mount failed (ignored)', e)
        }
      } catch (error) {
        console.error('Failed to fetch wellness data:', error)
        // Set empty arrays on error to prevent crashes
        setWellnessData([])
        setAiTips(FALLBACK_TIPS)
        setSummary({})
      } finally {
        await ensureMinDelay(start, 400)
        setTipsLoading(false)
      }
    }
    
    fetchWellness()
  }, [])

  // Memoized wellness score display
  const displayWellnessScore = useMemo(() => {
    return mlWellnessScore || calculatedWellnessScore || wellnessScore || '—'
  }, [mlWellnessScore, calculatedWellnessScore, wellnessScore])

  // Format numeric score to up-to-4-decimal places, trimming trailing zeros
  const formatScore = (val) => {
    if (val === null || val === undefined || val === '—') return '—'
    const n = Number(val)
    if (Number.isNaN(n)) return '—'
    // Use fixed 4 decimals then trim unnecessary trailing zeros
    const s = n.toFixed(4)
    // Remove trailing zeros after decimal, then remove trailing dot if any
    return s.replace(/(\.\d*?[1-9])0+$/g, '$1').replace(/\.0+$/g, '')
  }

  const formattedDisplayScore = useMemo(() => formatScore(displayWellnessScore), [displayWellnessScore])

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
          {/* DEBUG BANNER - remove when confirmed */}
          <div className="mt-3">
            <span className="inline-block px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
              DEBUG: Rendering Wellness.jsx
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Row: Wellness Score + Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Wellness Score Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Your Wellness Score
                </h3>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                    {formattedDisplayScore}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {displayWellnessScore === '—' ? 'No data yet' : 'Current wellness level'}
                  </p>
                </div>
              </div>

              {/* Wellness Chart (moved next to score) */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Wellness Trends
                </h3>
                <div className="h-48">
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
                  {/* Show last 7 scores as a compact history */}
                  <div className="mt-3 flex items-center justify-between space-x-2">
                    {chartData.length === 0 ? (
                      <div className="text-sm text-gray-500">No historical scores</div>
                    ) : (
                      chartData.map((d, i) => (
                        <div key={i} className="flex-1 text-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                          <div className="text-xs text-gray-500">{d.day}</div>
                          <div className="font-medium text-gray-900 dark:text-white">{Math.round(d.score)}</div>
                        </div>
                      ))
                    )}
                  </div>
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
                    Activity Type
                    </label>
                  <input
                    type="text"
                    value={inputForm.activity.type}
                    onChange={(e) => setInputForm(prev => ({ ...prev, activity: { ...prev.activity, type: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="walking"
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

            {/* (Trends and Break Timer removed from this column; kept in header row and sidebar) */}

            {/* Daily Goals */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Wellness Goals
              </h3>
              {goalsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyGoals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300">{goal.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {goal.current}/{goal.target}
                        </span>
                        <div className={`w-3 h-3 rounded-full ${
                          goal.completed ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Summary
              </h3>
              {summary.sessions !== null ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sessions</span>
                    <span className="font-medium text-gray-900 dark:text-white">{summary.sessions}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Goals Achieved</span>
                    <span className="font-medium text-gray-900 dark:text-white">{summary.goalsAchieved}/{summary.goalsTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Focus</span>
                    <span className="font-medium text-gray-900 dark:text-white">{summary.avgFocus}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No data yet today
                </div>
              )}
            </div>

            {/* Wellness Tips (moved between Today's Summary and Wellness Activities) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wellness Tips
              </h3>
              <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Status: {tipsLoading ? 'loading' : aiTips.length ? 'loaded' : 'idle'} • {aiTips.length} tip(s)
              </div>

              {tipsLoading ? (
                <div className="space-y-3 text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading tips...</div>
                  {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />)}
                </div>
              ) : tipsError ? (
                <div className="text-red-500 dark:text-red-400 text-sm">{tipsError}</div>
              ) : aiTips.length > 0 ? (
                <div className="space-y-3">
                  {aiTips.slice(0,3).map((tip, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                      {tip.text || tip}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">No tips available</div>
              )}
            </div>

            {/* Wellness Activities (moved from main column) */}
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

            {/* Break Timer (moved to right sidebar) */}
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


            {/* (Duplicate Wellness Tips removed — single Tips card above is used) */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wellness