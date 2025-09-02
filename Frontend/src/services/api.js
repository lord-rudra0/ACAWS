import axios from 'axios'

// Enhanced API configuration with retry logic
const createAPIInstance = (baseURL, name) => {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Simple global backoff for Express backend when 429 responses are received.
  // Stored on window so other modules can inspect it during debugging.
  window.__expressBackoffUntil = window.__expressBackoffUntil || 0
  const _waitMs = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  // Request interceptor with retry logic
  instance.interceptors.request.use(
    async (config) => {
      // Respect a global backoff timestamp if set by previous 429 responses.
      try {
        const now = Date.now()
        const until = window.__expressBackoffUntil || 0
        if (until && now < until) {
          const waitMs = until - now
          console.warn(`${name} API: global backoff active, delaying request ${waitMs}ms`)
          await _waitMs(waitMs)
        }
      } catch (e) {}

      // Add auth header and request metadata
      try {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add request ID for tracking
        config.metadata = {
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          startTime: Date.now()
        }

        console.log(`📤 ${name} API Request:`, {
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId: config.metadata.requestId
        })
      } catch (e) {
        // keep going even if metadata setup fails
      }

      return config
    },
    (error) => {
      console.error(`❌ ${name} API request error:`, error)
      return Promise.reject(error)
    }
  )

  // Response interceptor with enhanced error handling
  instance.interceptors.response.use(
    (response) => {
      const duration = Date.now() - response.config.metadata.startTime
      
      console.log(`📥 ${name} API Response:`, {
        status: response.status,
        requestId: response.config.metadata.requestId,
        duration: `${duration}ms`
      })
      
      return response
    },
    async (error) => {
      const config = error.config
      const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0
      
      console.error(`❌ ${name} API Error:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        requestId: config?.metadata?.requestId,
        duration: `${duration}ms`
      })
      
  // Handle authentication errors
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        delete axios.defaults.headers.common['Authorization']
        
        // Only redirect if not already on auth pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login'
        }
      }
      
      // If server returned 429 Too Many Requests, set a global backoff to avoid storming the server
      try {
        if (error.response?.status === 429) {
          // Try to extract Retry-After from headers or body
          let retryAfterSeconds = undefined
          try {
            const h = error.response.headers || {}
            const ra = h['retry-after'] || h['Retry-After'] || h['retry-after'.toLowerCase()]
            if (ra) retryAfterSeconds = Number(ra)
          } catch (e) {}
          if (!retryAfterSeconds && error.response?.data?.retryAfterSeconds) retryAfterSeconds = Number(error.response.data.retryAfterSeconds)
          // Fallback to a small default if not provided
          const fallbackSeconds = 3
          const until = Date.now() + (Number.isFinite(retryAfterSeconds) ? retryAfterSeconds * 1000 : fallbackSeconds * 1000)
          window.__expressBackoffUntil = until
          console.warn(`${name} API: received 429, setting global backoff until ${new Date(until).toISOString()}`)
        }
      } catch (e) {
        console.warn('Failed to set global backoff', e)
      }

      // Retry logic for specific errors
      if (shouldRetryRequest(error) && (!config._retryCount || config._retryCount < 3)) {
        config._retryCount = (config._retryCount || 0) + 1
        
        const delay = Math.pow(2, config._retryCount) * 1000 // Exponential backoff
        
        console.log(`🔄 Retrying ${name} request (attempt ${config._retryCount}) in ${delay}ms`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        return instance(config)
      }
      
  // Instrument failed requests into a global list for easier debugging in dev
      try {
        window.__apiFailures = window.__apiFailures || []
        window.__apiFailures.push({
          name,
          url: config?.url,
          method: config?.method,
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          duration,
          time: Date.now()
        })
      } catch (e) {}

      return Promise.reject({
        message: error.response?.data?.message || error.message || 'Network error',
        status: error.response?.status,
        code: error.code,
        data: error.response?.data,
        requestId: config?.metadata?.requestId,
        retryCount: config?._retryCount || 0
      })
    }
  )

  return instance
}

// Helper function to determine if request should be retried
const shouldRetryRequest = (error) => {
  // Retry on network errors or 5xx server errors
  return !error.response || 
         error.response.status >= 500 || 
         error.code === 'NETWORK_ERROR' ||
         error.code === 'ECONNABORTED'
}

// Create API instances
const expressAPI = createAPIInstance(
  import.meta.env.VITE_API_URL || 'http://localhost:3001',
  'Express'
)

// Log Express API connection
expressAPI.get('/health')
  .then(() => console.log('✅ Successfully connected to Express backend'))
  .catch(err => console.error('❌ Could not connect to Express backend:', err.message))

// Convenience debug helper: send a simple echo to Express to verify connectivity
expressAPI.debugEcho = async (payload = {}) => {
  try {
    console.log('[expressAPI] debugEcho ->', payload)
    const res = await expressAPI.post('/api/debug/echo', payload)
    console.log('[expressAPI] debugEcho response', res.status, res.data)
    return res.data
  } catch (err) {
    console.error('[expressAPI] debugEcho failed', err)
    throw err
  }
}

const pythonAPI = createAPIInstance(
  import.meta.env.VITE_PY_API_URL || 'http://localhost:8000',
  'Python'
)

// Log Python API connection
pythonAPI.get('/health')
  .then(() => console.log('✅ Successfully connected to Python backend'))
  .catch(err => console.error('❌ Could not connect to Python backend:', err.message))

// Enhanced API service functions with better error handling
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await expressAPI.post('/api/auth/login', credentials)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  },
  
  register: async (userData) => {
    try {
      const response = await expressAPI.post('/api/auth/register', userData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  },
  
  getCurrentUser: async () => {
    try {
      const response = await expressAPI.get('/api/auth/me')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to get user data')
    }
  },
  
  googleLogin: async (tokenId) => {
    try {
      const response = await expressAPI.post('/api/auth/google', { tokenId })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Google login failed')
    }
  },
  
  forgotPassword: async (email) => {
    try {
      const response = await expressAPI.post('/api/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Password reset failed')
    }
  },

  refreshToken: async () => {
    try {
      const response = await expressAPI.post('/api/auth/refresh')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Token refresh failed')
    }
  }
}

export const learningAPI = {
  getModules: async (filters = {}) => {
    try {
      const response = await expressAPI.get('/api/learning/modules', { params: filters })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load learning modules')
    }
  },
  
  getProgress: async () => {
    try {
      const response = await expressAPI.get('/api/learning/progress')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load progress data')
    }
  },
  
  startSession: async (sessionData) => {
    try {
      const response = await expressAPI.post('/api/learning/sessions/start', sessionData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to start learning session')
    }
  },
  
  updateProgress: async (sessionId, progressData) => {
    try {
      const response = await expressAPI.put(`/api/learning/sessions/${sessionId}/progress`, progressData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to update session progress')
    }
  },
  
  endSession: async (sessionId, sessionData) => {
    try {
      const response = await expressAPI.put(`/api/learning/sessions/${sessionId}/end`, sessionData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to end learning session')
    }
  },
  
  getRecommendations: async () => {
    try {
      const response = await expressAPI.get('/api/learning/recommendations')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load recommendations')
    }
  },
  
  submitAssessment: async (assessmentData) => {
    try {
      const response = await expressAPI.post('/api/learning/assessments', assessmentData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to submit assessment')
    }
  },

  getPersonalizedPath: async (subject, difficulty) => {
    try {
      const response = await expressAPI.post('/api/learning/personalized-path', { subject, difficulty })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to generate learning path')
    }
  }

  ,
  // Persist session summary (Mongo)
  saveSessionSummary: async (summaryData) => {
    try {
      const response = await expressAPI.post('/api/learning/sessions/save', summaryData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to save session summary')
    }
  },

  // Persist prediction history for analytics
  savePrediction: async (predictionData) => {
    try {
      const response = await expressAPI.post('/api/learning/predictions', predictionData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to save prediction')
    }
  },

  // Create module (persisted)
  createModule: async (moduleData) => {
    try {
      const response = await expressAPI.post('/api/learning/modules', moduleData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to create module')
    }
  }
}

export const tutorAPI = {
  listRoadmaps: async () => {
    try {
      const response = await expressAPI.get('/api/tutor/roadmaps')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to list roadmaps')
    }
  },

  getRoadmap: async (id) => {
    try {
      const response = await expressAPI.get(`/api/tutor/roadmaps/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to get roadmap')
    }
  },

  getProgress: async (roadmapId, userId) => {
    try {
      const response = await expressAPI.get(`/api/tutor/roadmaps/${roadmapId}/progress`, { params: { user_id: userId } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch progress')
    }
  },

  recommendNext: async (roadmapId, userId) => {
    try {
      const response = await expressAPI.get(`/api/tutor/roadmaps/${roadmapId}/recommend`, { params: { user_id: userId } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch recommendation')
    }
  },

  submitQuizResult: async (quizId, payload) => {
    try {
      const response = await expressAPI.post(`/api/tutor/quizzes/${quizId}/submit`, payload)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to submit quiz result')
    }
  }
}

export const wellnessAPI = {
  recordEntry: async (entryData) => {
    try {
      const response = await expressAPI.post('/api/wellness/entries', entryData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to record wellness entry')
    }
  },
  
  getHistory: async (days = 30) => {
    try {
      const response = await expressAPI.get('/api/wellness/history', { params: { days } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load wellness history')
    }
  },
  
  getInsights: async () => {
    try {
      const response = await expressAPI.get('/api/wellness/insights')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load wellness insights')
    }
  },
  
  recordBreak: async (breakData) => {
    try {
      const response = await expressAPI.post('/api/wellness/breaks', breakData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to record break activity')
    }
  },
  
  getBreakRecommendations: async (currentState) => {
    try {
      const response = await expressAPI.get('/api/wellness/break-recommendations', { params: currentState })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to get break recommendations')
    }
  },

  getMoodAnalytics: async (timeRange = 'week') => {
    try {
      const response = await expressAPI.get('/api/wellness/mood-analytics', { params: { time_range: timeRange } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load mood analytics')
    }
  },

  saveDailySummary: async (summaryData) => {
    try {
      const response = await expressAPI.post('/api/wellness/daily-summary', summaryData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to save daily wellness summary')
    }
  },

  // Fetch persisted daily summary (latest wellness score, last 7 scores, goals, sessions, avg_focus)
  getDailySummary: async () => {
    try {
      const response = await expressAPI.get('/api/wellness/daily-summary')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load daily wellness summary')
    }
  },

  // ML-based wellness calculation
  calculateML: async (entryData = {}) => {
    try {
      const response = await expressAPI.post('/api/wellness/calculate-ml', entryData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to calculate ML wellness')
    }
  }
  ,

  // Send user input + ml result to backend assistant service (hidden from UI)
  generateHiddenTips: async (payload = {}) => {
    try {
      // This endpoint is intentionally generic; backend will proxy to whichever assistant
      // (Gemini / SK) is configured server-side. Frontend does not disclose assistant type.
      const response = await expressAPI.post('/api/wellness/generate-tips', payload)
      return response.data
    } catch (error) {
      // Don't throw to avoid surfacing errors to UI flows that call this fire-and-forget.
      console.error('Hidden tips generation failed:', error)
      return null
    }
  }
}

export const analyticsAPI = {
  getDashboard: async (timeRange = 'week') => {
    try {
      const response = await expressAPI.get('/api/analytics/dashboard', { params: { time_range: timeRange } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load analytics dashboard')
    }
  },
  
  generatePDFReport: async (reportData) => {
    try {
      const response = await expressAPI.post('/api/analytics/reports/pdf', reportData, {
        responseType: 'blob',
        timeout: 30000 // Longer timeout for report generation
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to generate PDF report')
    }
  },
  
  generateExcelReport: async (reportData) => {
    try {
      const response = await expressAPI.post('/api/analytics/reports/excel', reportData, {
        responseType: 'blob',
        timeout: 30000
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to generate Excel report')
    }
  },
  
  getSystemAnalytics: async (timeRange = 'week') => {
    try {
      const response = await expressAPI.get('/api/analytics/system', { params: { time_range: timeRange } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load system analytics')
    }
  },

  getPerformanceMetrics: async (userId, timeRange = 'month') => {
    try {
      const response = await expressAPI.get(`/api/analytics/performance/${userId}`, { params: { time_range: timeRange } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load performance metrics')
    }
  }
}

export const userAPI = {
  getSettings: async () => {
    try {
      const response = await expressAPI.get('/api/users/me/settings')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load user settings')
    }
  },

  saveSettings: async (settings) => {
    try {
      const response = await expressAPI.post('/api/users/me/settings', settings)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to save user settings')
    }
  }
}

export const communityAPI = {
  getDiscussions: async (filters = {}) => {
    try {
      const response = await expressAPI.get('/api/community/discussions', { params: filters })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load discussions')
    }
  },
  
  createDiscussion: async (discussionData) => {
    try {
      const response = await expressAPI.post('/api/community/discussions', discussionData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to create discussion')
    }
  },
  
  likeDiscussion: async (discussionId) => {
    try {
      const response = await expressAPI.post(`/api/community/discussions/${discussionId}/like`)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to like discussion')
    }
  },
  
  addReply: async (discussionId, replyData) => {
    try {
      const response = await expressAPI.post(`/api/community/discussions/${discussionId}/replies`, replyData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to add reply')
    }
  },
  
  getLeaderboard: async (timeRange = 'month') => {
    try {
      const response = await expressAPI.get('/api/community/leaderboard', { params: { time_range: timeRange } })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load leaderboard')
    }
  },
  
  getChallenges: async () => {
    try {
      const response = await expressAPI.get('/api/community/challenges')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load challenges')
    }
  },
  
  joinChallenge: async (challengeId) => {
    try {
      const response = await expressAPI.post(`/api/community/challenges/${challengeId}/join`)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to join challenge')
    }
  }
}

export const mlAPI = {
  analyzeEmotion: async (frameData) => {
    try {
      const response = await pythonAPI.post('/api/emotion/analyze', { frame: frameData })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Emotion analysis failed')
    }
  },
  
  trackAttention: async (frameData) => {
    try {
      const response = await pythonAPI.post('/api/attention/track', { frame: frameData })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Attention tracking failed')
    }
  },
  
  detectFatigue: async (frameData) => {
    try {
      const response = await pythonAPI.post('/api/fatigue/detect', { frame: frameData })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Fatigue detection failed')
    }
  },
  
  adaptContent: async (userId, cognitiveState, currentContent) => {
    try {
      const response = await pythonAPI.post('/api/learning/adapt-content', {
        user_id: userId,
        cognitive_state: cognitiveState,
        current_content: currentContent
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Content adaptation failed')
    }
  },
  
  generateLearningPath: async (userId, subject, targetCompetency) => {
    try {
      const response = await pythonAPI.post('/api/learning/generate-path', {
        user_id: userId,
        subject,
        target_competency: targetCompetency
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Learning path generation failed')
    }
  },
  
  trackWellnessMetrics: async (userId, metrics) => {
    try {
      const response = await pythonAPI.post('/api/wellness/track-metrics', {
        user_id: userId,
        metrics
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Wellness tracking failed')
    }
  },
  
  getAnalyticsDashboard: async (userId, timeRange = 'week') => {
    try {
      const response = await pythonAPI.get(`/api/analytics/dashboard/${userId}`, {
        params: { time_range: timeRange }
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Analytics dashboard failed')
    }
  },

  predictLearningOutcome: async (userId, moduleData) => {
    try {
      const response = await pythonAPI.post('/api/ml/predict-outcome', {
        user_id: userId,
        module_data: moduleData
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Learning outcome prediction failed')
    }
  },

  getPersonalizedRecommendations: async (userId, preferences) => {
    try {
      const response = await pythonAPI.post('/api/ml/recommendations', {
        user_id: userId,
        preferences
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Recommendation generation failed')
    }
  }
}

export const adminAPI = {
  getOverview: async () => {
    try {
      const response = await expressAPI.get('/api/admin/overview')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load admin overview')
    }
  },
  
  getUserAnalytics: async (userId, days = 30) => {
    try {
      const response = await expressAPI.get(`/api/admin/users/${userId}/analytics`, {
        params: { days }
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load user analytics')
    }
  },
  
  getCognitiveLoad: async (timeRange = 'week') => {
    try {
      const response = await expressAPI.get('/api/admin/cognitive-load', {
        params: { time_range: timeRange }
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load cognitive load data')
    }
  },
  
  pushContent: async (contentData) => {
    try {
      const response = await expressAPI.post('/api/admin/push-content', contentData)
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to push content')
    }
  },
  
  getPerformanceMetrics: async (hours = 24) => {
    try {
      const response = await expressAPI.get('/api/admin/performance', {
        params: { hours }
      })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load performance metrics')
    }
  },

  getSystemHealth: async () => {
    try {
      const response = await expressAPI.get('/api/admin/system-health')
      return response.data
    } catch (error) {
      throw new Error(error.message || 'Failed to load system health')
    }
  },

  manageUsers: async (action, userData) => {
    try {
      const response = await expressAPI.post('/api/admin/users/manage', { action, ...userData })
      return response.data
    } catch (error) {
      throw new Error(error.message || 'User management action failed')
    }
  }
}

// Network status monitoring
export const networkMonitor = {
  isOnline: () => navigator.onLine,
  
  onStatusChange: (callback) => {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

export { expressAPI, pythonAPI }