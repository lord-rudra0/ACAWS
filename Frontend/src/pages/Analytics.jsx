import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Eye, 
  Brain,
  Heart,
  Target,
  Clock,
  Award,
  Filter,
  RefreshCw
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('week')
  const [selectedMetric, setSelectedMetric] = useState('all')

  const performanceData = [
    { date: '2024-01-01', attention: 85, mood: 7, focus: 90, learning: 88 },
    { date: '2024-01-02', attention: 78, mood: 6, focus: 85, learning: 82 },
    { date: '2024-01-03', attention: 92, mood: 8, focus: 95, learning: 94 },
    { date: '2024-01-04', attention: 88, mood: 7, focus: 88, learning: 90 },
    { date: '2024-01-05', attention: 85, mood: 8, focus: 90, learning: 87 },
    { date: '2024-01-06', attention: 90, mood: 9, focus: 92, learning: 93 },
    { date: '2024-01-07', attention: 87, mood: 8, focus: 89, learning: 91 }
  ]

  const cognitiveMetrics = [
    { subject: 'Attention', current: 87, previous: 82, fullMark: 100 },
    { subject: 'Memory', current: 92, previous: 88, fullMark: 100 },
    { subject: 'Processing Speed', current: 78, previous: 75, fullMark: 100 },
    { subject: 'Problem Solving', current: 85, previous: 80, fullMark: 100 },
    { subject: 'Creativity', current: 90, previous: 85, fullMark: 100 },
    { subject: 'Focus Duration', current: 88, previous: 83, fullMark: 100 }
  ]

  const learningModuleStats = [
    { module: 'ML Basics', completion: 95, time: 120, score: 88 },
    { module: 'Deep Learning', completion: 75, time: 180, score: 92 },
    { module: 'Computer Vision', completion: 45, time: 90, score: 85 },
    { module: 'NLP', completion: 20, time: 30, score: 78 },
    { module: 'Reinforcement Learning', completion: 0, time: 0, score: 0 }
  ]

  const emotionDistribution = [
    { name: 'Happy', value: 35, color: '#10B981' },
    { name: 'Focused', value: 30, color: '#3B82F6' },
    { name: 'Neutral', value: 20, color: '#6B7280' },
    { name: 'Confused', value: 10, color: '#F59E0B' },
    { name: 'Stressed', value: 5, color: '#EF4444' }
  ]

  const generateReport = (format) => {
    console.log(`Generating ${format} report for ${timeRange}`)
    // Here you would implement PDF/Excel generation
    alert(`${format.toUpperCase()} report will be downloaded shortly!`)
  }

  const exportData = () => {
    const dataStr = JSON.stringify(performanceData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `acaws-analytics-${timeRange}.json`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Learning Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive insights into your cognitive performance and wellness
              </p>
            </div>
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input-field"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={() => generateReport('pdf')}
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Average Attention',
              value: '87%',
              change: '+5%',
              icon: Eye,
              color: 'primary',
              trend: 'up'
            },
            {
              title: 'Learning Efficiency',
              value: '92%',
              change: '+8%',
              icon: Brain,
              color: 'secondary',
              trend: 'up'
            },
            {
              title: 'Wellness Score',
              value: '85',
              change: '+3',
              icon: Heart,
              color: 'success',
              trend: 'up'
            },
            {
              title: 'Study Streak',
              value: '12 days',
              change: '+2',
              icon: Award,
              color: 'warning',
              trend: 'up'
            }
          ].map((kpi, index) => {
            const Icon = kpi.icon
            return (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${kpi.color}-100 dark:bg-${kpi.color}-900/20`}>
                    <Icon className={`w-6 h-6 text-${kpi.color}-500`} />
                  </div>
                  <div className={`flex items-center space-x-1 text-sm ${
                    kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>{kpi.change}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {kpi.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 text-sm">
                  {kpi.title}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Trends */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Performance Trends
                </h2>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-500 hover:text-primary-500 transition-colors">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-500 hover:text-primary-500 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#6B7280" />
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
                  <Line 
                    type="monotone" 
                    dataKey="learning" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    name="Learning"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Cognitive Radar Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Cognitive Profile
              </h2>
              
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={cognitiveMetrics}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: '#6B7280', fontSize: 10 }}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Previous"
                    dataKey="previous"
                    stroke="#6B7280"
                    fill="#6B7280"
                    fillOpacity={0.1}
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Learning Module Performance */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Module Performance
              </h2>
              
              <div className="space-y-4">
                {learningModuleStats.map((module, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {module.module}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{module.time} min</span>
                        <span>Score: {module.score}%</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{module.completion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${module.completion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Emotion Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Emotion Distribution
              </h3>
              
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={emotionDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {emotionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="mt-4 space-y-2">
                {emotionDistribution.map((emotion, index) => (
                  <div key={emotion.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: emotion.color }}
                      ></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {emotion.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {emotion.value}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Study Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Insights
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">
                      Learning Pattern
                    </span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Your focus peaks between 10-11 AM. Schedule challenging topics during this time.
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Wellness Trend
                    </span>
                  </div>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Your mood improves significantly after wellness activities. Keep it up!
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-purple-800 dark:text-purple-200">
                      Recommendation
                    </span>
                  </div>
                  <p className="text-purple-700 dark:text-purple-300 text-sm">
                    Consider shorter study sessions when stress levels are high.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Export Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Export Reports
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => generateReport('pdf')}
                  className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>
                
                <button
                  onClick={() => generateReport('excel')}
                  className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Export to Excel</span>
                </button>
                
                <button
                  onClick={exportData}
                  className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Raw Data</span>
                </button>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Study Time</span>
                  <span className="font-semibold text-gray-900 dark:text-white">47h 32m</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Modules Completed</span>
                  <span className="font-semibold text-gray-900 dark:text-white">12/20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Avg. Session Length</span>
                  <span className="font-semibold text-gray-900 dark:text-white">45 min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Best Focus Day</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Wednesday</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics