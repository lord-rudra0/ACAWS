import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastContainer } from './components/Toast'
import NetworkStatus from './components/NetworkStatus'
import LoadingSpinner from './components/LoadingSpinner'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Lazy load heavy components and pages
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Learning = lazy(() => import('./pages/Learning'))
const ChapterDetail = lazy(() => import('./pages/ChapterDetail'))
const Wellness = lazy(() => import('./pages/Wellness'))
const Community = lazy(() => import('./pages/Community'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const EnhancedLearning = lazy(() => import('./pages/EnhancedLearning'))

// Lazy load AI components only when needed
const AIAssistant = lazy(() => import('./components/AIAssistant'))
const AIInsightsPanel = lazy(() => import('./components/AIInsightsPanel'))

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
                <Suspense fallback={<LoadingSpinner />}>
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
                      path="/learning/roadmap/:roadmapId/chapter/:chapterId"
                      element={user ? <ChapterDetail /> : <Navigate to="/login" />}
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
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
          </Router>
          <ToastContainer />
          <NetworkStatus />
          
          {/* AI Assistant - Lazy loaded */}
          {user && (
            <>
              <Suspense fallback={<div className="fixed bottom-6 right-6 w-14 h-14 bg-gray-400 rounded-full animate-pulse" />}>
                <AIAssistant
                  isOpen={showAIAssistant}
                  onToggle={() => setShowAIAssistant(!showAIAssistant)}
                  currentContext={currentContext}
                  onInsightGenerated={(insights) => console.log('Insights:', insights)}
                  onRecommendationApplied={(rec) => console.log('Applied:', rec)}
                />
              </Suspense>
              
              {/* Floating AI Button - Simple without framer-motion */}
              {!showAIAssistant && (
                <button
                  onClick={() => setShowAIAssistant(true)}
                  className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 transform hover:scale-105 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App