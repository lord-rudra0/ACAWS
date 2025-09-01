// Lightweight ML service - heavy dependencies removed for performance
// Mock implementations for development, real ML handled by Python backend

// Mock TensorFlow-like interface
const mockTensorFlow = {
  tensor: (data) => ({ data, shape: [data.length], dispose: () => {} }),
  ready: () => Promise.resolve(),
  loadLayersModel: () => Promise.resolve({ predict: () => [0.5] }),
  tidy: (fn) => fn(),
  memory: () => ({ numTensors: 0, numBytes: 0 })
}

// Mock face-api-like interface
const mockFaceAPI = {
  loadTinyFaceDetectorModel: () => Promise.resolve(),
  loadFaceLandmarkTinyModel: () => Promise.resolve(),
  loadFaceExpressionModel: () => Promise.resolve(),
  detectSingleFace: () => Promise.resolve(null),
  detectFaceLandmarks: () => Promise.resolve(null),
  detectFaceExpressions: () => Promise.resolve(null)
}

// Mock Matrix-like interface
const mockMatrix = {
  Matrix: class {
    constructor(data) {
      this.data = data
      this.rows = data.length
      this.columns = data[0]?.length || 0
    }
    transpose() { return this }
    mul() { return this }
    add() { return this }
    sub() { return this }
  }
}

// Mock brain.js-like interface
const mockBrain = {
  NeuralNetwork: class {
    constructor() {
      this.train = () => Promise.resolve()
      this.run = () => [0.5]
    }
  }
}

// Resolve backend base: if proxy enabled, route via Express to avoid JWT in browser
const env = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {}
const USE_PROXY = String(env.VITE_USE_PY_PROXY || '').toLowerCase() === 'true'
const EXPRESS_API = env.VITE_API_URL
// Python backend base URL: prefer VITE_PYTHON_API_URL, then VITE_PY_BACKEND_URL, else localhost
const DIRECT_PY = env.VITE_PYTHON_API_URL || env.VITE_PY_BACKEND_URL || 'http://localhost:5000'
const PY_BACKEND = USE_PROXY && EXPRESS_API ? `${EXPRESS_API}/api/python` : DIRECT_PY
// Debug flag for verbose ML logging
const DEBUG_ML = String(env.VITE_DEBUG_ADV_ML || '').toLowerCase() === 'true'

function dbg(...args) {
  try {
    if (DEBUG_ML) console.debug('[AdvancedML]', ...args)
  } catch {}
}

// Build final Python endpoint path correctly for proxied vs direct calls
function pyEndpoint(path) {
  // path should start with '/emotion/...' or '/attention/...'
  const base = PY_BACKEND
  if (USE_PROXY) {
    // Express mounts proxy at '/api/python' and expects '/emotion/...'
    const url = `${base}${path}`
    dbg('pyEndpoint (proxy)', { url, base, path })
    return url
  }
  // Direct FastAPI expects '/api/...' prefix
  const url = `${base}/api${path}`
  dbg('pyEndpoint (direct)', { url, base, path })
  return url
}

function getAuthHeader() {
  // Prefer sending x-auth-token when using proxy; Authorization otherwise
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
    if (!token) return {}
    if (USE_PROXY) return { 'x-auth-token': token }
    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

class AdvancedMLService {
  constructor() {
    this.models = {
      emotion: null,
      attention: null,
      fatigue: null,
      performance: null,
      wellness: null
    }
    
    this.neuralNetworks = {
      learningPredictor: null,
      adaptationEngine: null,
      wellnessAnalyzer: null
    }
    
    this.isInitialized = false
    this.initializationPromise = null
  }

  async initialize() {
    if (this.isInitialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this._performInitialization()
    await this.initializationPromise
  }

  async _performInitialization() {
    try {
      console.log('🚀 Initializing Advanced ML Service (Lightweight Mode)...')
      dbg('config', { USE_PROXY, EXPRESS_API, DIRECT_PY, PY_BACKEND })
      
      // Mock initialization for development
      await this.loadMockModels()
      
      this.isInitialized = true
      console.log('✅ Advanced ML Service initialized successfully (Mock Mode)')
    } catch (error) {
      console.error('❌ ML Service initialization failed:', error)
      throw error
    }
  }

  async loadMockModels() {
    // Mock model loading for development
    await new Promise(resolve => setTimeout(resolve, 100))
    console.log('📦 Mock ML models loaded (development mode)')
  }

  // Mock emotion analysis
  async analyzeEmotionAdvanced(imageSrc) {
    // Mock emotion analysis - real implementation would use Python backend
    const emotions = ['happy', 'sad', 'angry', 'surprised', 'neutral']
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
    
    return {
      emotion: randomEmotion,
      confidence: 0.7 + Math.random() * 0.3,
      intensity: Math.random(),
      timestamp: new Date().toISOString(),
      source: 'mock_analysis'
    }
  }

  // Mock attention analysis
  async analyzeAttentionAdvanced(imageSrc, options = {}) {
    // Mock attention analysis - real implementation would use Python backend
    const attentionScore = 0.6 + Math.random() * 0.4
    const gazeConfidence = 0.5 + Math.random() * 0.5
    
    return {
      attentionScore,
      gazeAnalysis: {
        confidence: gazeConfidence,
        focusArea: 'center',
        gazePattern: 'focused'
      },
      cognitiveLoad: Math.random(),
      timestamp: new Date().toISOformat(),
      source: 'mock_analysis'
    }
  }

  // Mock fatigue detection
  async detectFatigueAdvanced(imageSrc) {
    // Mock fatigue detection - real implementation would use Python backend
    const fatigueLevel = Math.random() * 0.8
    const eyeOpenness = 0.3 + Math.random() * 0.7
    
    return {
      fatigueLevel,
      eyeOpenness,
      blinkRate: 15 + Math.random() * 10,
      confidence: 0.6 + Math.random() * 0.4,
      timestamp: new Date().toISOString(),
      source: 'mock_analysis'
    }
  }

  // Mock performance prediction
  async predictPerformance(userData, context) {
    // Mock performance prediction
    const baseScore = 70
    const variation = (Math.random() - 0.5) * 20
    
    return {
      predictedScore: Math.max(0, Math.min(100, baseScore + variation)),
      confidence: 0.6 + Math.random() * 0.4,
      factors: ['mood', 'energy', 'focus'],
      timestamp: new Date().toISOString(),
      source: 'mock_prediction'
    }
  }

  // Mock wellness analysis
  async analyzeWellnessAdvanced(wellnessData) {
    // Mock wellness analysis - real implementation would use Python backend
    const wellnessScore = 60 + Math.random() * 40
    const recommendations = [
      'Take regular breaks',
      'Stay hydrated',
      'Practice mindfulness',
      'Get adequate sleep'
    ]
    
    return {
      wellnessScore: Math.round(wellnessScore),
      recommendations: recommendations.slice(0, 2 + Math.floor(Math.random() * 2)),
      trends: {
        mood: 'stable',
        energy: 'improving',
        stress: 'decreasing'
      },
      timestamp: new Date().toISOString(),
      source: 'mock_analysis'
    }
  }

  // Mock learning adaptation
  async adaptLearningContent(userProfile, performanceData) {
    // Mock learning adaptation
    const difficulty = Math.max(1, Math.min(10, 5 + (Math.random() - 0.5) * 4))
    
    return {
      recommendedDifficulty: Math.round(difficulty),
      contentType: ['video', 'interactive', 'text'][Math.floor(Math.random() * 3)],
      duration: 15 + Math.floor(Math.random() * 30),
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: new Date().toISOString(),
      source: 'mock_adaptation'
    }
  }

  // Mock cognitive state analysis
  async analyzeCognitiveState(emotionData, attentionData, fatigueData) {
    // Mock cognitive state analysis
    const cognitiveLoad = (attentionData?.cognitiveLoad || 0.5) + Math.random() * 0.3
    const emotionalStability = 0.6 + Math.random() * 0.4
    const focusLevel = (attentionData?.attentionScore || 0.5) + Math.random() * 0.3
    
    return {
      cognitiveLoad: Math.min(1, Math.max(0, cognitiveLoad)),
      emotionalStability: Math.min(1, Math.max(0, emotionalStability)),
      focusLevel: Math.min(1, Math.max(0, focusLevel)),
      overallState: this._calculateOverallState(cognitiveLoad, emotionalStability, focusLevel),
      timestamp: new Date().toISOString(),
      source: 'mock_analysis'
    }
  }

  _calculateOverallState(cognitiveLoad, emotionalStability, focusLevel) {
    const avg = (cognitiveLoad + emotionalStability + focusLevel) / 3
    if (avg >= 0.8) return 'excellent'
    if (avg >= 0.6) return 'good'
    if (avg >= 0.4) return 'fair'
    return 'poor'
  }

  // Cleanup method
  dispose() {
    this.isInitialized = false
    this.initializationPromise = null
    console.log('🧹 Advanced ML Service disposed')
  }
}

// Export singleton instance
const advancedMLService = new AdvancedMLService()
export default advancedMLService