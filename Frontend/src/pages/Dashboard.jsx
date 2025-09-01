import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Heart, 
  Brain, 
  Target, 
  Clock,
  Award,
  Eye,
  Calendar,
  Activity
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { wellnessAPI } from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const API_URL = import.meta.env.VITE_API_URL
  const [userData, setUserData] = useState({
    name: '',
    wellnessScore: null,
    attentionLevel: null,
    learningProgress: null,
    streakDays: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sync name from auth user when available
  useEffect(() => {
    if (user && user.name) {
      setUserData(prev => ({ ...prev, name: user.name }))
    }
  }, [user])

  const [weeklyData, setWeeklyData] = useState([])

  const [learningStats, setLearningStats] = useState([
    { name: 'Completed', value: 0, color: '#10B981' },
    { name: 'In Progress', value: 0, color: '#3B82F6' },
    { name: 'Not Started', value: 0, color: '#6B7280' }
  ])

  const quickActions = [
    {
      title: 'Start Learning Session',
      description: 'Begin an adaptive learning session',
      icon: Brain,
      color: 'bg-primary-500',
      href: '/learning'
    },
    {
      title: 'Wellness Check',
      description: 'Record your mood and energy',
      icon: Heart,
      color: 'bg-secondary-500',
      href: '/wellness'
    },
    {
      title: 'View Analytics',
      description: 'See detailed performance reports',
      icon: BarChart3,
      color: 'bg-accent-500',
      href: '/analytics'
    },
    {
      title: 'Join Community',
      description: 'Connect with other learners',
      icon: Target,
      color: 'bg-success-500',
      href: '/community'
    }
  ]

  const [achievements, setAchievements] = useState([])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        setError(null)
        const resp = await axios.get(`${API_URL}/api/analytics/dashboard-summary`)
        const summary = resp.data?.summary || {}

        // Fetch persisted wellness daily summary (persisted last seven scores)
        let persistedWellness = null
        try {
          const dsResp = await wellnessAPI.getDailySummary().catch(() => null)
          const s = dsResp?.summary ?? dsResp
          if (s) {
            persistedWellness = s.wellness_score ?? (Array.isArray(s.last_seven_scores) && s.last_seven_scores.length > 0 ? s.last_seven_scores[0] : null)
          }
        } catch (e) {
          console.debug('Failed to load persisted wellness summary', e)
        }

        // Key metrics
        const wellnessScore = persistedWellness !== null ? Math.round(persistedWellness) : (Number.isFinite(summary.wellnessScoreToday) ? Math.round(summary.wellnessScoreToday) : null)
        const attentionLevel = Number.isFinite(summary.attentionToday) ? Math.round(summary.attentionToday) : null

        // Learning distribution -> percentages
        const dist = summary.learningDistribution || {}
        const total = Math.max(1, dist.total_modules || (dist.completed || 0) + (dist.in_progress || 0) + (dist.not_started || 0) || 1)
        const completedPct = Math.round(((dist.completed || 0) / total) * 100)
        const inProgressPct = Math.round(((dist.in_progress || 0) / total) * 100)
        const notStartedPct = Math.max(0, 100 - completedPct - inProgressPct)
        setLearningStats([
          { name: 'Completed', value: completedPct, color: '#10B981' },
          { name: 'In Progress', value: inProgressPct, color: '#3B82F6' },
          { name: 'Not Started', value: notStartedPct, color: '#6B7280' }
        ])

        // Weekly performance mapping
        const week = Array.isArray(summary.weeklyPerformance) ? summary.weeklyPerformance : []
        const toDayLabel = (iso) => {
          const d = new Date(iso)
          return d.toLocaleDateString(undefined, { weekday: 'short' })
        }
        setWeeklyData(week.map(w => ({ day: toDayLabel(w.day), attention: Math.round(w.attention || 0), focus: Math.round(w.focus || 0) })))

        // Streak and achievements
        const streakDays = summary.streak?.current ?? null
        setAchievements(Array.isArray(summary.achievements) ? summary.achievements : [])

        setUserData(prev => ({
          ...prev,
          name: user?.name || prev.name || 'User',
          wellnessScore,
          attentionLevel,
          learningProgress: completedPct, // overall completion proxy
          streakDays
        }))
      } catch (e) {
        setError(e?.response?.data?.message || e.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="text-gray-600 dark:text-gray-300 mb-4">Loading dashboard…</div>
        )}
        {error && (
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        )}
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {userData.name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's how you're performing today
          </p>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Wellness Score',
              value: userData.wellnessScore,
              icon: Heart,
              color: 'text-success-500',
              bgColor: 'bg-success-50 dark:bg-success-900/20'
            },
            {
              title: 'Attention Level',
              value: userData.attentionLevel,
              icon: Eye,
              color: 'text-primary-500',
              bgColor: 'bg-primary-50 dark:bg-primary-900/20'
            },
            {
              title: 'Learning Progress',
              value: userData.learningProgress,
              icon: TrendingUp,
              color: 'text-secondary-500',
              bgColor: 'bg-secondary-50 dark:bg-secondary-900/20'
            },
            {
              title: 'Study Streak',
              value: userData.streakDays,
              icon: Award,
              color: 'text-accent-500',
              bgColor: 'bg-accent-50 dark:bg-accent-900/20',
              suffix: 'days'
            }
          ].map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`${metric.bgColor} p-6 rounded-2xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${metric.color} bg-white dark:bg-gray-800`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-2xl font-bold ${metric.color}`}>
                    {metric.value ?? '—'}
                    {metric.suffix && (
                      <span className="text-sm font-normal ml-1">{metric.suffix}</span>
                    )}
                  </span>
                </div>
                <h3 className="text-gray-900 dark:text-white font-semibold">
                  {metric.title}
                </h3>
              </motion.div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Weekly Trends */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Weekly Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
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
                    dataKey="attention" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Attention"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="focus" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Focus"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Learning Progress */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Learning Distribution
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={learningStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {learningStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {learningStats.map((stat, index) => (
                  <div key={stat.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stat.color }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stat.value}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Achievements
              </h2>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div
                    key={achievement.name}
                    className={`flex items-center space-x-3 p-3 rounded-xl ${
                      achievement.earned 
                        ? 'bg-success-50 dark:bg-success-900/20' 
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className={`font-medium ${
                        achievement.earned 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {achievement.name}
                      </p>
                    </div>
                    {achievement.earned && (
                      <div className="ml-auto">
                        <Award className="w-5 h-5 text-success-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <motion.a
                  key={action.title}
                  href={action.href}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </motion.a>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dashboard