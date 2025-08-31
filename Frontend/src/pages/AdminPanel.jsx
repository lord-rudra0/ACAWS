import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Eye,
  Brain,
  Heart,
  Download,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2
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
  Bar
} from 'recharts'

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  const systemStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 15678,
    avgSessionTime: 45,
    wellnessAlerts: 23,
    systemUptime: 99.8
  }

  const userEngagementData = [
    { date: '2024-01-01', users: 120, sessions: 450, avgAttention: 85 },
    { date: '2024-01-02', users: 135, sessions: 520, avgAttention: 82 },
    { date: '2024-01-03', users: 142, sessions: 580, avgAttention: 88 },
    { date: '2024-01-04', users: 158, sessions: 620, avgAttention: 90 },
    { date: '2024-01-05', users: 165, sessions: 680, avgAttention: 87 },
    { date: '2024-01-06', users: 178, sessions: 720, avgAttention: 89 },
    { date: '2024-01-07', users: 185, sessions: 750, avgAttention: 91 }
  ]

  const cognitiveLoadData = [
    { subject: 'Mathematics', avgLoad: 75, students: 234 },
    { subject: 'Physics', avgLoad: 82, students: 189 },
    { subject: 'Computer Science', avgLoad: 68, students: 312 },
    { subject: 'Biology', avgLoad: 71, students: 156 },
    { subject: 'Chemistry', avgLoad: 79, students: 198 }
  ]

  const studentsNeedingSupport = [
    {
      id: 1,
      name: 'Alice Johnson',
      avatar: '👩‍🎓',
      attentionScore: 45,
      wellnessScore: 52,
      lastActive: '2 hours ago',
      alerts: ['Low attention', 'High stress']
    },
    {
      id: 2,
      name: 'Bob Smith',
      avatar: '👨‍🎓',
      attentionScore: 38,
      wellnessScore: 48,
      lastActive: '4 hours ago',
      alerts: ['Fatigue detected', 'Low engagement']
    },
    {
      id: 3,
      name: 'Carol Davis',
      avatar: '👩‍💼',
      attentionScore: 42,
      wellnessScore: 55,
      lastActive: '1 hour ago',
      alerts: ['Confusion detected', 'Break needed']
    }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'analytics', label: 'System Analytics', icon: TrendingUp },
    { id: 'support', label: 'Student Support', icon: Heart },
    { id: 'settings', label: 'System Settings', icon: Settings }
  ]

  const generateSystemReport = () => {
    console.log('Generating system report...')
    alert('System report will be downloaded shortly!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Monitor system performance and manage user experience
              </p>
            </div>
            <button
              onClick={generateSystemReport}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>System Report</span>
            </button>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Total Users', value: systemStats.totalUsers, icon: Users, color: 'primary' },
                { label: 'Active Users', value: systemStats.activeUsers, icon: Eye, color: 'success' },
                { label: 'Total Sessions', value: systemStats.totalSessions, icon: BarChart3, color: 'secondary' },
                { label: 'Avg Session Time', value: `${systemStats.avgSessionTime}m`, icon: Clock, color: 'warning' },
                { label: 'Wellness Alerts', value: systemStats.wellnessAlerts, icon: AlertTriangle, color: 'error' },
                { label: 'System Uptime', value: `${systemStats.systemUptime}%`, icon: Shield, color: 'success' }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-${stat.color}-100 dark:bg-${stat.color}-900/20`}>
                        <Icon className={`w-6 h-6 text-${stat.color}-500`} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value.toLocaleString()}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      {stat.label}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* User Engagement Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                User Engagement Trends
              </h2>
              
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={userEngagementData}>
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
                    dataKey="users" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    name="Active Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    name="Sessions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {activeTab === 'support' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Students Needing Support */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Students Needing Support
                </h2>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10 w-64"
                    />
                  </div>
                  <button className="btn-secondary flex items-center space-x-2">
                    <Filter className="w-4 h-4" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {studentsNeedingSupport.map((student) => (
                  <div
                    key={student.id}
                    className="p-6 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-xl">
                          {student.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {student.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Last active: {student.lastActive}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Attention: {student.attentionScore}%
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Wellness: {student.wellnessScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="btn-primary text-sm">
                          Send Support
                        </button>
                        <button className="p-2 text-gray-500 hover:text-primary-500 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {student.alerts.map((alert, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full"
                          >
                            {alert}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cognitive Load Analysis */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Cognitive Load by Subject
              </h2>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cognitiveLoadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="subject" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="avgLoad" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* System Performance */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                System Performance Analytics
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {systemStats.systemUptime}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">System Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">
                    {systemStats.avgSessionTime}m
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Avg Session Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-500 mb-2">
                    {((systemStats.activeUsers / systemStats.totalUsers) * 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">User Engagement</div>
                </div>
              </div>
            </div>

            {/* ML Model Performance */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                ML Model Performance
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Emotion Detection
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
                      <span className="font-semibold text-green-500">94.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="font-semibold text-blue-500">87.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Processing Time</span>
                      <span className="font-semibold text-purple-500">45ms</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Attention Tracking
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Accuracy</span>
                      <span className="font-semibold text-green-500">91.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Confidence</span>
                      <span className="font-semibold text-blue-500">89.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Processing Time</span>
                      <span className="font-semibold text-purple-500">38ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Management
              </h2>
              <button className="btn-primary flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
              <button className="btn-secondary flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>

            {/* User Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Institution</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Last Active</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Alice Johnson', email: 'alice@university.edu', role: 'student', institution: 'MIT', lastActive: '2 min ago', status: 'active' },
                    { name: 'Bob Smith', email: 'bob@university.edu', role: 'educator', institution: 'Stanford', lastActive: '1 hour ago', status: 'active' },
                    { name: 'Carol Davis', email: 'carol@university.edu', role: 'student', institution: 'Harvard', lastActive: '1 day ago', status: 'inactive' }
                  ].map((user, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                          user.role === 'educator' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.institution}</td>
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{user.lastActive}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <button className="p-1 text-blue-500 hover:text-blue-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-500 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel