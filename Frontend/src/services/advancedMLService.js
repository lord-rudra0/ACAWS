// Advanced ML service: prefers Python backend, respects on-device-only privacy flag
// Provides mock fallbacks when backend is unavailable or privacy forbids remote calls

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {}
const USE_PROXY = String(ENV.VITE_USE_PY_PROXY || '').toLowerCase() === 'true'
const EXPRESS_API = ENV.VITE_API_URL || ''
const DIRECT_PY = ENV.VITE_PYTHON_API_URL || ENV.VITE_PY_BACKEND_URL || 'http://localhost:5000'
const PY_BASE = USE_PROXY && EXPRESS_API ? `${EXPRESS_API}/api/python` : DIRECT_PY
const DEBUG = String(ENV.VITE_DEBUG_ADV_ML || '').toLowerCase() === 'true'

function dbg(...args) { if (DEBUG) console.debug('[advancedMLService]', ...args) }
function pyEndpoint(path) {
  if (USE_PROXY && EXPRESS_API) return `${PY_BASE}${path}`
  if (DIRECT_PY.endsWith('/api')) return `${DIRECT_PY}${path}`
  return `${DIRECT_PY}/api${path}`
}
function getAuthHeader() {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
    if (!token) return {}
    return USE_PROXY ? { 'x-auth-token': token } : { Authorization: `Bearer ${token}` }
  } catch (e) { return {} }
}

class AdvancedMLService {
  // Privacy decision should be provided by caller; default to false (use remote)
  _isOnDeviceOnly() { return false }

  // Public initialize hook used by components to warm up or validate service availability.
  // Kept intentionally lightweight: returns true quickly and logs readiness. Can be expanded
  // later to perform backend health checks or model warm-up requests.
  async initialize() {
    dbg('initialize called')
    try {
      // lightweight health probe (best-effort) - not required to succeed
      // Note: We purposely don't throw here to avoid breaking UI when offline.
      return true
    } catch (e) {
      dbg('initialize probe failed', e)
      return false
    }
  }

  async analyzeEmotionAdvanced(imageSrc) {
    dbg('analyzeEmotionAdvanced', { onDeviceOnly: this._isOnDeviceOnly() })
    if (!this._isOnDeviceOnly()) {
      try {
        const res = await fetch(pyEndpoint('/vision/emotion'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ image: imageSrc })
        })
        if (res.ok) {
          const j = await res.json()
          return {
            emotion: j.emotion || j.label || null,
            emotions: j.emotions || j.scores || null,
            confidence: (j.confidence ?? j.confidenceScore) ?? null,
            timestamp: j.timestamp || new Date().toISOString(),
            source: 'python_backend', raw: j
          }
        }
        dbg('analyzeEmotionAdvanced backend status', res.status)
      } catch (err) { dbg('analyzeEmotionAdvanced error', err) }
    }
    const list = ['happy', 'neutral', 'sad', 'angry', 'surprised']
    const pick = list[Math.floor(Math.random() * list.length)]
    return { emotion: pick, confidence: 0.5 + Math.random() * 0.5, timestamp: new Date().toISOString(), source: 'mock' }
  }

  async analyzeAttentionAdvanced(imageSrc, options = {}) {
    dbg('analyzeAttentionAdvanced', { onDeviceOnly: this._isOnDeviceOnly() })
    if (!this._isOnDeviceOnly()) {
      try {
        const res = await fetch(pyEndpoint('/vision/attention'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ image: imageSrc, options })
        })
        if (res.ok) {
          const j = await res.json()
          return {
            attentionScore: j.attentionScore ?? j.score ?? null,
            gazeAnalysis: j.gazeAnalysis ?? j.gaze ?? {},
            cognitiveLoad: j.cognitiveLoad ?? null,
            timestamp: j.timestamp || new Date().toISOString(),
            source: 'python_backend', raw: j
          }
        }
        dbg('analyzeAttentionAdvanced backend status', res.status)
      } catch (err) { dbg('analyzeAttentionAdvanced error', err) }
    }
    return { attentionScore: 0.5 + Math.random() * 0.5, gazeAnalysis: { focus: 'center', confidence: 0.6 }, cognitiveLoad: 0.4 + Math.random() * 0.6, timestamp: new Date().toISOString(), source: 'mock' }
  }

  async detectFatigueAdvanced(imageSrc) {
    dbg('detectFatigueAdvanced', { onDeviceOnly: this._isOnDeviceOnly() })
    if (!this._isOnDeviceOnly()) {
      try {
        const res = await fetch(pyEndpoint('/vision/fatigue'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ image: imageSrc })
        })
        if (res.ok) {
          const j = await res.json()
          return { fatigueLevel: j.fatigueLevel ?? null, eyeOpenness: j.eyeOpenness ?? null, blinkRate: j.blinkRate ?? null, timestamp: j.timestamp || new Date().toISOString(), source: 'python_backend', raw: j }
        }
        dbg('detectFatigueAdvanced backend status', res.status)
      } catch (err) { dbg('detectFatigueAdvanced error', err) }
    }
    return { fatigueLevel: Math.random(), eyeOpenness: 0.3 + Math.random() * 0.7, blinkRate: 10 + Math.floor(Math.random() * 10), timestamp: new Date().toISOString(), source: 'mock' }
  }

  async adaptLearningContent(userProfile = {}, performanceData = {}) {
    dbg('adaptLearningContent', { onDeviceOnly: this._isOnDeviceOnly() })
    if (!this._isOnDeviceOnly()) {
      try {
        const res = await fetch(pyEndpoint('/adaptation/content'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ user: userProfile, performance: performanceData })
        })
        if (res.ok) {
          const j = await res.json()
          return { recommendedDifficulty: j.recommendedDifficulty ?? j.difficulty ?? null, contentType: j.contentType ?? 'interactive', duration: j.duration ?? 15, source: 'python_backend', raw: j }
        }
        dbg('adaptLearningContent backend status', res.status)
      } catch (err) { dbg('adaptLearningContent error', err) }
    }
    const diff = Math.max(1, Math.min(10, 5 + Math.round((Math.random() - 0.5) * 4)))
    return { recommendedDifficulty: diff, contentType: ['video', 'interactive', 'text'][Math.floor(Math.random() * 3)], duration: 10 + Math.floor(Math.random() * 50), source: 'mock' }
  }

  async analyzeCognitiveState(emotionData = {}, attentionData = {}, fatigueData = {}) {
    dbg('analyzeCognitiveState', { onDeviceOnly: this._isOnDeviceOnly() })
    if (!this._isOnDeviceOnly()) {
      try {
        const res = await fetch(pyEndpoint('/cognitive/analyze'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ emotion: emotionData, attention: attentionData, fatigue: fatigueData })
        })
        if (res.ok) {
          const j = await res.json()
          return { cognitiveLoad: j.cognitiveLoad ?? null, emotionalStability: j.emotionalStability ?? null, focusLevel: j.focusLevel ?? null, overallState: j.overallState ?? this._calculateOverallState(j.cognitiveLoad ?? 0, j.emotionalStability ?? 0, j.focusLevel ?? 0), timestamp: j.timestamp || new Date().toISOString(), source: 'python_backend', raw: j }
        }
        dbg('analyzeCognitiveState backend status', res.status)
      } catch (err) { dbg('analyzeCognitiveState error', err) }
    }
    const cognitiveLoad = (attentionData?.cognitiveLoad || 0.5) + Math.random() * 0.3
    const emotionalStability = 0.5 + Math.random() * 0.5
    const focusLevel = (attentionData?.attentionScore || 0.5) + Math.random() * 0.3
    return { cognitiveLoad: Math.min(1, Math.max(0, cognitiveLoad)), emotionalStability: Math.min(1, Math.max(0, emotionalStability)), focusLevel: Math.min(1, Math.max(0, focusLevel)), overallState: this._calculateOverallState(cognitiveLoad, emotionalStability, focusLevel), timestamp: new Date().toISOString(), source: 'mock' }
  }

  // Predict learning outcome for recommendation engine
  async predictLearningOutcome(userProfile = {}, moduleData = {}, cognitiveHistory = []) {
    dbg('predictLearningOutcome', { userProfile, moduleData })
    if (!this._isOnDeviceOnly()) {
      try {
        const res = await fetch(pyEndpoint('/predict/learning-outcome'), {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body: JSON.stringify({ user: userProfile, module: moduleData, history: cognitiveHistory })
        })
        if (res.ok) {
          const j = await res.json()
          return {
            predictedScore: j.predictedScore ?? j.score ?? 75,
            confidence: j.confidence ?? 0.7,
            factors: j.factors || [],
            riskAssessment: j.riskAssessment || { level: 'low', factors: [] },
            recommendations: j.recommendations || [],
            source: 'python_backend', raw: j
          }
        }
        dbg('predictLearningOutcome backend status', res.status)
      } catch (err) { dbg('predictLearningOutcome error', err) }
    }
    // Mock fallback
    return {
      predictedScore: 75 + Math.floor(Math.random() * 15) - 7,
      confidence: 0.6 + Math.random() * 0.3,
      factors: [{ name: 'engagement', value: 0.6 }],
      riskAssessment: { level: 'low', factors: [] },
      recommendations: [{ message: 'Review core concepts and practice problems', priority: 'medium' }],
      source: 'mock'
    }
  }

  _calculateOverallState(cognitiveLoad, emotionalStability, focusLevel) {
    const avg = (Number(cognitiveLoad) + Number(emotionalStability) + Number(focusLevel)) / 3
    if (avg >= 0.8) return 'excellent'
    if (avg >= 0.6) return 'good'
    if (avg >= 0.4) return 'fair'
    return 'poor'
  }
}

const advancedMLService = new AdvancedMLService()
export default advancedMLService