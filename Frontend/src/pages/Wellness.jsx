import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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

  const [wellnessData] = useState([
    { day: 'Mon', mood: 7, stress: 4, energy: 8, focus: 85 },
    { day: 'Tue', mood: 6, stress: 6, energy: 6, focus: 70 },
    { day: 'Wed', mood: 8, stress: 3, energy: 9, focus: 95 },
    { day: 'Thu', mood: 7, stress: 5, energy: 7, focus: 80 },
    { day: 'Fri', mood: 9, stress: 2, energy: 8, focus: 90 },
    { day: 'Sat', mood: 8, stress: 3, energy: 9, focus: 85 },
    { day: 'Sun', mood: 7, stress: 4, energy: 8, focus: 88 }
  ])

  const moods = [
    { icon: Smile, label: 'Great', value: 5, color: 'text-green-500' },
    { icon: Smile, label: 'Good', value: 4, color: 'text-blue-500' },
    { icon: Meh, label: 'Okay', value: 3, color: 'text-yellow-500' },
    { icon: Frown, label: 'Poor', value: 2, color: 'text-orange-500' },
    { icon: Frown, label: 'Bad', value: 1, color: 'text-red-500' }
  ]

  const wellnessActivities = [
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
  ]

  useEffect(() => {
    let interval
    if (isBreakActive) {
      interval = setInterval(() => {
        setBreakTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isBreakActive])

  useEffect(() => {
    let interval
    if (breathingExercise.active) {
      interval = setInterval(() => {
        setBreathingExercise(prev => {
          let newCount = prev.count - 1
          let newPhase = prev.phase

          if (newCount <= 0) {
            switch (prev.phase) {
              case 'inhale':
                newPhase = 'hold'
                newCount = 7
                break
              case 'hold':
                newPhase = 'exhale'
                newCount = 8
                break
              case 'exhale':
                newPhase = 'inhale'
                newCount = 4
                break
            }
          }

          return { ...prev, phase: newPhase, count: newCount }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [breathingExercise.active])

  const recordMood = (mood) => {
    setCurrentMood(mood)
    // Here you would save to backend
    console.log('Mood recorded:', mood)
  }

  const startBreathingExercise = () => {
    setBreathingExercise({
      active: true,
      phase: 'inhale',
      count: 4
    })
  }

  const stopBreathingExercise = () => {
    setBreathingExercise({
      active: false,
      phase: 'inhale',
      count: 4
    })
  }

  const startEyeRest = () => {
    alert('Look at something 20 feet away for 20 seconds!')
  }

  const startMindfulBreak = () => {
    setIsBreakActive(true)
    setBreakTimer(0)
  }

  const showHydrationReminder = () => {
    alert('💧 Time to hydrate! Drink a glass of water.')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Wellness Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your cognitive wellness and maintain healthy study habits
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Wellness Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mood Tracker */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                How are you feeling today?
              </h2>
              
              <div className="grid grid-cols-5 gap-4 mb-6">
                {moods.map((mood) => {
                  const Icon = mood.icon
                  return (
                    <button
                      key={mood.value}
                      onClick={() => recordMood(mood)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        currentMood?.value === mood.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${mood.color}`} />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {mood.label}
                      </div>
                    </button>
                  )
                })}
              </div>

              {currentMood && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                  <p className="text-green-800 dark:text-green-200">
                    ✅ Mood recorded! Your wellness score has been updated.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Stress & Energy Levels */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Current State
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">
                      Stress Level
                    </label>
                    <span className="text-lg font-bold text-red-500">
                      {stressLevel}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressLevel}
                    onChange={(e) => setStressLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-red"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-700 dark:text-gray-300 font-medium">
                      Energy Level
                    </label>
                    <span className="text-lg font-bold text-green-500">
                      {energyLevel}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                  />
                </div>
              </div>
            </motion.div>

            {/* Breathing Exercise */}
            {breathingExercise.active && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl shadow-lg text-white text-center"
              >
                <h2 className="text-2xl font-bold mb-4">Breathing Exercise</h2>
                <div className="text-6xl font-bold mb-4">{breathingExercise.count}</div>
                <div className="text-xl mb-6 capitalize">{breathingExercise.phase}</div>
                <div className={`w-32 h-32 mx-auto rounded-full border-4 border-white/30 flex items-center justify-center mb-6 transition-all duration-1000 ${
                  breathingExercise.phase === 'inhale' ? 'scale-110' :
                  breathingExercise.phase === 'hold' ? 'scale-110' : 'scale-90'
                }`}>
                  <div className="w-20 h-20 bg-white/20 rounded-full"></div>
                </div>
                <button
                  onClick={stopBreathingExercise}
                  className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg transition-colors"
                >
                  Stop Exercise
                </button>
              </motion.div>
            )}

            {/* Weekly Wellness Trends */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Weekly Wellness Trends
              </h2>
              
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wellnessData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Mood"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Energy"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="stress" 
                    stroke="#EF4444" 
                    strokeWidth={3}
                    name="Stress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wellness Score */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-green-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white"
            >
              <div className="text-center">
                <Heart className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Wellness Score</h3>
                <div className="text-4xl font-bold mb-2">87</div>
                <div className="text-green-100">Excellent</div>
              </div>
            </motion.div>

            {/* Break Timer */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Smart Break Timer
              </h3>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-mono text-primary-500 mb-2">
                  {formatTime(breakTimer)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isBreakActive ? 'Break in progress' : 'Ready for break'}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setIsBreakActive(!isBreakActive)}
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  {isBreakActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isBreakActive ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsBreakActive(false)
                    setBreakTimer(0)
                  }}
                  className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Wellness Activities */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
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
            </motion.div>

            {/* Daily Goals */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Daily Wellness Goals
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: 'Mood Check-ins', current: 3, target: 3, completed: true },
                  { label: 'Break Sessions', current: 2, target: 4, completed: false },
                  { label: 'Breathing Exercises', current: 1, target: 2, completed: false },
                  { label: 'Hydration Reminders', current: 6, target: 8, completed: false }
                ].map((goal, index) => (
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
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Today's Summary
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span className="text-gray-600 dark:text-gray-400">Study Sessions</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">4</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-success-500" />
                    <span className="text-gray-600 dark:text-gray-400">Goals Achieved</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">3/4</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">Avg. Focus</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">87%</span>
                </div>
              </div>
            </motion.div>

            {/* Wellness Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Wellness Tips
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    💡 Take a 5-minute break every 25 minutes to maintain focus
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    🌱 Practice deep breathing when stress levels are high
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-purple-800 dark:text-purple-200 text-sm">
                    ✨ Regular mood check-ins improve self-awareness
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wellness