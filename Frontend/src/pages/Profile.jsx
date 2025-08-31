import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  School, 
  Shield, 
  Bell, 
  Eye, 
  Palette,
  Save,
  Camera,
  Edit3,
  Settings,
  Lock,
  Globe,
  Smartphone
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const Profile = () => {
  const { user } = useAuth()
  const { darkMode, toggleDarkMode } = useTheme()
  const [activeSection, setActiveSection] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    institution: user?.institution || 'University of Technology',
    role: user?.role || 'student',
    bio: 'Passionate about machine learning and cognitive science.',
    avatar: '👨‍🎓'
  })

  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      wellness: true,
      learning: true,
      community: false
    },
    privacy: {
      profileVisible: true,
      progressVisible: false,
      analyticsSharing: true
    },
    accessibility: {
      fontSize: 'medium',
      contrast: 'normal',
      animations: true,
      screenReader: false
    },
    learning: {
      adaptiveDifficulty: true,
      autoBreaks: true,
      aiTutor: true,
      voiceCommands: false
    }
  })

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'accessibility', label: 'Accessibility', icon: Eye },
    { id: 'security', label: 'Security', icon: Lock }
  ]

  const handleProfileUpdate = () => {
    console.log('Updating profile:', profileData)
    alert('Profile updated successfully!')
  }

  const handlePreferenceChange = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const exportUserData = () => {
    const userData = {
      profile: profileData,
      preferences: preferences,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(userData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'acaws-user-data.json'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account, preferences, and privacy settings
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeSection === section.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  Profile Information
                </h2>

                {/* Avatar Section */}
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center text-white text-3xl">
                      {profileData.avatar}
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profileData.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Member since {new Date().getFullYear()}
                    </p>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Institution
                    </label>
                    <input
                      type="text"
                      value={profileData.institution}
                      onChange={(e) => setProfileData(prev => ({ ...prev, institution: e.target.value }))}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role
                    </label>
                    <select
                      value={profileData.role}
                      onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                      className="input-field"
                    >
                      <option value="student">Student</option>
                      <option value="educator">Educator</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="input-field resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeSection === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Notification Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Notification Preferences
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handlePreferenceChange('notifications', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Learning Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Learning Preferences
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(preferences.learning).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Brain className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handlePreferenceChange('learning', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Preferences */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Appearance
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Palette className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Dark Mode
                        </span>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Privacy Settings
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                      Data Sharing
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(preferences.privacy).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handlePreferenceChange('privacy', key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                      Data Management
                    </h4>
                    <div className="space-y-3">
                      <button
                        onClick={exportUserData}
                        className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Export My Data</span>
                      </button>
                      
                      <button className="w-full flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <Shield className="w-4 h-4" />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'accessibility' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Accessibility Options
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Font Size
                    </label>
                    <select
                      value={preferences.accessibility.fontSize}
                      onChange={(e) => handlePreferenceChange('accessibility', 'fontSize', e.target.value)}
                      className="input-field"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contrast
                    </label>
                    <select
                      value={preferences.accessibility.contrast}
                      onChange={(e) => handlePreferenceChange('accessibility', 'contrast', e.target.value)}
                      className="input-field"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High Contrast</option>
                      <option value="extra-high">Extra High Contrast</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    {['animations', 'screenReader'].map((key) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.accessibility[key]}
                            onChange={(e) => handlePreferenceChange('accessibility', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Security Settings
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                      Change Password
                    </h4>
                    <div className="space-y-4">
                      <input
                        type="password"
                        placeholder="Current password"
                        className="input-field"
                      />
                      <input
                        type="password"
                        placeholder="New password"
                        className="input-field"
                      />
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        className="input-field"
                      />
                      <button className="btn-primary">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                      Two-Factor Authentication
                    </h4>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          SMS Authentication
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Add an extra layer of security
                        </p>
                      </div>
                      <button className="btn-secondary">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile