import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import NetworkStatus from './components/NetworkStatus'
import PerformanceMonitor from './components/PerformanceMonitor'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

// Components
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Learning from './pages/Learning'
import Wellness from './pages/Wellness'
import Community from './pages/Community'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import EnhancedLearning from './pages/EnhancedLearning'
import AIAssistant from './components/AIAssistant'
import AIInsightsPanel from './components/AIInsightsPanel'

function App() {
  const { user, loading } = useAuth()
  const { darkMode } = useTheme()
  
  useEffect(() => {
    // Ensure dark class is set on initial load
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [currentContext, setCurrentContext] = useState({})

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'dark' : ''}`}>
        <div className="bg-white dark:bg-gray-900 min-h-screen w-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className={darkMode ? 'dark' : ''}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 theme-transition">
          <Router>
            <Navbar />
            <main className="min-h-[calc(100vh-128px)]">
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route 
                    path="/login" 
                    element={user ? <Navigate to="/dashboard" /> : <Login />} 
                  />
                  <Route 
                    path="/register" 
                    element={user ? <Navigate to="/dashboard" /> : <Register />} 
                  />
                  <Route 
                    path="/dashboard" 
                    element={user ? <Dashboard /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/learning" 
                    element={user ? <Learning /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/wellness" 
                    element={user ? <Wellness /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/community" 
                    element={user ? <Community /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/analytics" 
                    element={user ? <Analytics /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/profile" 
                    element={user ? <Profile /> : <Navigate to="/login" />} 
                  />
                  <Route 
                    path="/admin" 
                    element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/dashboard" />} 
                  />
                  <Route 
                    path="/enhanced-learning" 
                    element={user ? <EnhancedLearning /> : <Navigate to="/login" />} 
                  />
                </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
          </Router>
          <ToastContainer />
          <NetworkStatus />
          
          {/* AI Assistant */}
          {user && (
            <>
              <AIAssistant
                isOpen={showAIAssistant}
                onToggle={() => setShowAIAssistant(!showAIAssistant)}
                currentContext={currentContext}
                onInsightGenerated={(insights) => console.log('Insights:', insights)}
                onRecommendationApplied={(rec) => console.log('Applied:', rec)}
              />
              
              {/* Floating AI Button */}
              {!showAIAssistant && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAIAssistant(true)}
                  className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40"
                >
                  <Brain className="w-6 h-6" />
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App