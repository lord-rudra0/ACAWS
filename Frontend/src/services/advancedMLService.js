import * as tf from '@tensorflow/tfjs'
import * as faceapi from 'face-api.js'
import { Matrix } from 'ml-matrix'
import * as brain from 'brain.js'

// Resolve backend base: if proxy enabled, route via Express to avoid JWT in browser
const env = typeof import.meta !== 'undefined' ? (import.meta.env || {}) : {}
const USE_PROXY = String(env.VITE_USE_PY_PROXY || '').toLowerCase() === 'true'
const EXPRESS_API = env.VITE_API_URL
// Python backend base URL: prefer VITE_PYTHON_API_URL, then VITE_PY_BACKEND_URL, else localhost
const DIRECT_PY = env.VITE_PYTHON_API_URL || env.VITE_PY_BACKEND_URL || 'http://localhost:5000'
const PY_BACKEND = USE_PROXY && EXPRESS_API ? `${EXPRESS_API}/api/python` : DIRECT_PY

function getAuthHeader() {
  // When using proxy, skip adding Authorization from browser; Express will inject from cookie/header
  if (USE_PROXY) return {}
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
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
      console.log('🚀 Initializing Advanced ML Service...')
      
      // Load face-api.js models
      await this.loadFaceAPIModels()
      
      // Initialize TensorFlow models
      await this.initializeTensorFlowModels()
      
      // Initialize Brain.js neural networks
      await this.initializeBrainJSNetworks()
      
      this.isInitialized = true
      console.log('✅ Advanced ML Service initialized successfully')
    } catch (error) {
      console.error('❌ ML Service initialization failed:', error)
      throw error
    }
  }

  async loadFaceAPIModels() {
    try {
      const MODEL_URL = '/models'
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ])
      
      console.log('✅ Face-API models loaded')
    } catch (error) {
      console.warn('⚠️ Face-API models not available, using fallback detection')
    }
  }

  async initializeTensorFlowModels() {
    try {
      // Advanced Emotion Detection Model
      this.models.emotion = await this.createAdvancedEmotionModel()
      
      // Attention Tracking Model
      this.models.attention = await this.createAttentionModel()
      
      // Fatigue Detection Model
      this.models.fatigue = await this.createFatigueModel()
      
      // Performance Prediction Model
      this.models.performance = await this.createPerformanceModel()
      
      // Wellness Analysis Model
      this.models.wellness = await this.createWellnessModel()
      
      console.log('✅ TensorFlow models initialized')
    } catch (error) {
      console.error('❌ TensorFlow model initialization failed:', error)
    }
  }

  async createAdvancedEmotionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [48, 48, 1],
          filters: 64,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.25 }),
        
        tf.layers.conv2d({
          filters: 128,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.25 }),
        
        tf.layers.conv2d({
          filters: 256,
          kernelSize: 3,
          activation: 'relu',
          padding: 'same'
        }),
        tf.layers.batchNormalization(),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.dropout({ rate: 0.25 }),
        
        // Attention mechanism
        tf.layers.globalAveragePooling2d({}),
        tf.layers.dense({ units: 512, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: 256, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 7, activation: 'softmax' })
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  async createAttentionModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [20], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    })

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    })

    return model
  }

  async createFatigueModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({ inputShape: [10, 8], units: 64, returnSequences: true }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.lstm({ units: 32, returnSequences: false }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    })

    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError',
      metrics: ['mae']
    })

    return model
  }

  async createPerformanceModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [14], units: 256, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.4 }),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.batchNormalization(),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    })

    return model
  }

  async createWellnessModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [12], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.3 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 10, activation: 'softmax' })
      ]
    })

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  async initializeBrainJSNetworks() {
    try {
      // Support different module export shapes (namespace ESM vs default CJS)
      const NN = brain?.NeuralNetwork || brain?.default?.NeuralNetwork
      const RNN = (brain?.recurrent) || (brain?.default?.recurrent)
      if (!NN || !RNN) {
        throw new Error('Brain.js constructors not available (NeuralNetwork/recurrent)')
      }

      // Learning Performance Predictor
      this.neuralNetworks.learningPredictor = new NN({
        hiddenLayers: [20, 15, 10],
        activation: 'sigmoid',
        learningRate: 0.01
      })

      // Adaptive Content Engine
      this.neuralNetworks.adaptationEngine = new NN({
        hiddenLayers: [15, 10, 8],
        activation: 'relu',
        learningRate: 0.005
      })

      // Wellness Pattern Analyzer
      this.neuralNetworks.wellnessAnalyzer = new RNN.LSTM({
        hiddenLayers: [20, 15],
        learningRate: 0.01
      })

      console.log('✅ Brain.js networks initialized')
    } catch (error) {
      console.error('❌ Brain.js initialization failed:', error)
    }
  }

  async analyzeEmotionAdvanced(imageData) {
    await this.initialize()
    
    try {
      // 1) Try Python backend for real model result
      const pyRes = await this._pyAnalyzeEmotion(imageData)
      if (pyRes) return pyRes

      // 2) Fallback to local analysis if backend unavailable
      // Use face-api.js for detailed facial analysis
      const img = await this.loadImageFromData(imageData)
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      if (detections.length === 0) {
        return {
          emotions: { neutral: 1.0 },
          confidence: 0.0,
          facialLandmarks: null,
          advancedMetrics: null
        }
      }

      const detection = detections[0]
      const expressions = detection.expressions
      
      // Advanced emotion analysis
      const advancedMetrics = await this.calculateAdvancedEmotionMetrics(detection)
      
      // Micro-expression detection
      const microExpressions = await this.detectMicroExpressions(detection)
      
      // Emotion intensity analysis
      const emotionIntensity = this.calculateEmotionIntensity(expressions)
      
      return {
        emotions: expressions,
        confidence: this.calculateEmotionConfidence(expressions),
        facialLandmarks: detection.landmarks.positions,
        advancedMetrics,
        microExpressions,
        emotionIntensity,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Advanced emotion analysis failed:', error)
      return this.getFallbackEmotionAnalysis()
    }
  }

  async _pyAnalyzeEmotion(imageData) {
    try {
      const resp = await fetch(`${PY_BACKEND}/api/emotion/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: USE_PROXY ? 'include' : 'same-origin',
        body: JSON.stringify({ frame: imageData, timestamp: new Date().toISOString() })
      })
      if (!resp.ok) return null
      const json = await resp.json()
      const data = json?.data || json
      if (!data) return null
      // Normalize to local structure
      // If server returns single label, map to distribution
      let emotions = data.emotions || data.expressions
      if (!emotions && data.emotion) {
        emotions = { [String(data.emotion).toLowerCase()]: 1.0 }
      }
      return {
        emotions: emotions || { neutral: 1.0 },
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.0,
        facialLandmarks: data.facialLandmarks || null,
        advancedMetrics: data.advancedMetrics || null,
        microExpressions: data.microExpressions || null,
        emotionIntensity: data.emotionIntensity || null,
        timestamp: new Date().toISOString()
      }
    } catch {
      return null
    }
  }

  async calculateAdvancedEmotionMetrics(detection) {
    try {
      const landmarks = detection.landmarks.positions
      
      // Calculate facial symmetry
      const symmetry = this.calculateFacialSymmetry(landmarks)
      
      // Calculate micro-movement patterns
      const microMovements = this.analyzeMicroMovements(landmarks)
      
      // Calculate emotional valence and arousal
      const valenceArousal = this.calculateValenceArousal(detection.expressions)
      
      return {
        facialSymmetry: symmetry,
        microMovements,
        valence: valenceArousal.valence,
        arousal: valenceArousal.arousal,
        emotionalStability: this.calculateEmotionalStability(detection.expressions)
      }
    } catch (error) {
      console.error('Advanced metrics calculation failed:', error)
      return null
    }
  }

  calculateFacialSymmetry(landmarks) {
    // Calculate symmetry between left and right sides of face
    const leftSide = landmarks.slice(0, 17)
    const rightSide = landmarks.slice(17, 34)
    
    let symmetryScore = 0
    const pairs = Math.min(leftSide.length, rightSide.length)
    
    for (let i = 0; i < pairs; i++) {
      const leftPoint = leftSide[i]
      const rightPoint = rightSide[rightSide.length - 1 - i]
      
      const distance = Math.sqrt(
        Math.pow(leftPoint.x - rightPoint.x, 2) + 
        Math.pow(leftPoint.y - rightPoint.y, 2)
      )
      
      symmetryScore += distance
    }
    
    return 1 - (symmetryScore / (pairs * 100)) // Normalize to 0-1
  }

  analyzeMicroMovements(landmarks) {
    // Analyze subtle movements that indicate emotional state
    // Derive simple deterministic proxies from geometric distances
    const leftBrow = landmarks.slice(17, 22)
    const rightBrow = landmarks.slice(22, 27)
    const leftEye = landmarks.slice(36, 42)
    const rightEye = landmarks.slice(42, 48)
    const mouthLeft = landmarks[48]
    const mouthRight = landmarks[54]
    const noseLeft = landmarks[31]
    const noseRight = landmarks[35]
    const jawTop = landmarks[8] // chin

    const eyeCenterY = (leftEye.reduce((s, p) => s + p.y, 0) / leftEye.length + rightEye.reduce((s, p) => s + p.y, 0) / rightEye.length) / 2
    const leftBrowY = leftBrow.reduce((s, p) => s + p.y, 0) / leftBrow.length
    const rightBrowY = rightBrow.reduce((s, p) => s + p.y, 0) / rightBrow.length
    const eyebrowLift = Math.max(0, (eyeCenterY - (leftBrowY + rightBrowY) / 2) / 50)

    const mouthWidth = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y)
    const faceWidth = Math.hypot(noseRight.x - noseLeft.x, noseRight.y - noseLeft.y)
    const mouthCornerMovement = Math.max(0, Math.min(1, (mouthWidth / (faceWidth || 1)) - 1))

    const nostrilFlare = Math.max(0, Math.min(1, (faceWidth - 30) / 50))

    const jawDistance = Math.hypot(jawTop.x - mouthLeft.x, jawTop.y - mouthLeft.y)
    const jawTension = Math.max(0, Math.min(1, (jawDistance - 40) / 80))

    return {
      eyebrowMovement: Math.min(1, eyebrowLift),
      mouthCornerMovement,
      nostrilFlare,
      jawTension
    }
  }

  calculateValenceArousal(expressions) {
    // Calculate emotional valence (positive/negative) and arousal (calm/excited)
    const valence = (expressions.happy + expressions.surprise) - (expressions.sad + expressions.angry + expressions.fear + expressions.disgust)
    const arousal = expressions.surprise + expressions.fear + expressions.angry - expressions.sad
    
    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(-1, Math.min(1, arousal))
    }
  }

  calculateEmotionalStability(expressions) {
    // Calculate how stable/consistent the emotional state is
    const emotionValues = Object.values(expressions)
    const maxEmotion = Math.max(...emotionValues)
    const variance = this.calculateVariance(emotionValues)
    
    return maxEmotion > 0.7 ? 1 - variance : 0.5
  }

  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length
  }

  async detectMicroExpressions(detection) {
    // Detect brief, involuntary facial expressions
    const landmarks = detection.landmarks.positions
    // Without temporal analysis, avoid random detection; return conservative nulls
    return {
      detected: false,
      type: null,
      intensity: 0,
      duration: 0
    }
  }

  calculateEmotionIntensity(expressions) {
    const maxEmotion = Math.max(...Object.values(expressions))
    const emotionCount = Object.values(expressions).filter(val => val > 0.1).length
    
    return {
      overall: maxEmotion,
      complexity: emotionCount > 2 ? 'complex' : 'simple',
      dominance: maxEmotion > 0.7 ? 'strong' : maxEmotion > 0.4 ? 'moderate' : 'weak'
    }
  }

  async analyzeAttentionAdvanced(imageData, contextData = {}) {
    await this.initialize()
    
    try {
      // 1) Try Python backend for real model result (returns score + confidence)
      const pyRes = await this._pyTrackAttention(imageData)
      
      // 2) Optionally augment with local landmark-based details for UI
      const img = await this.loadImageFromData(imageData)
      const detections = await faceapi
        .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()

      if (detections.length === 0 && pyRes) {
        // If backend gave a value but no local landmarks, return minimal structure using backend score
        return {
          attentionScore: Math.round((pyRes.attention ?? 0) * 100),
          gazeAnalysis: { direction: null, onScreen: null, confidence: pyRes.confidence ?? 0 },
          headPose: { yaw: null, pitch: null, roll: null, facingCamera: null },
          eyeMetrics: { blinkRate: 0, eyeAspectRatio: null },
          focusMap: null,
          cognitiveLoad: null,
          engagementLevel: null,
          distractionIndicators: []
        }
      }
      if (detections.length === 0) return this.getFallbackAttentionAnalysis()

      const detection = detections[0]
      const landmarks = detection.landmarks.positions
      
      // Advanced gaze estimation
      const gazeAnalysis = await this.performGazeAnalysis(landmarks)
      
      // Head pose estimation
      const headPose = await this.estimateHeadPose(landmarks)
      
      // Eye tracking metrics
      const eyeMetrics = await this.calculateEyeMetrics(landmarks)
      
      // Attention focus mapping
      const focusMap = await this.generateFocusMap(gazeAnalysis, headPose)
      
      // Cognitive load assessment
      const cognitiveLoad = await this.assessCognitiveLoad(eyeMetrics, headPose)
      
      const localScore = this.calculateAttentionScore(gazeAnalysis, headPose, eyeMetrics)
      const finalScore = pyRes && typeof pyRes.attention === 'number' ? Math.round(pyRes.attention * 100) : localScore
      return {
        attentionScore: finalScore,
        gazeAnalysis,
        headPose,
        eyeMetrics,
        focusMap,
        cognitiveLoad,
        engagementLevel: this.calculateEngagementLevel(gazeAnalysis, eyeMetrics),
        distractionIndicators: this.detectDistractionIndicators(gazeAnalysis, headPose),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Advanced attention analysis failed:', error)
      return this.getFallbackAttentionAnalysis()
    }
  }

  async _pyTrackAttention(imageData) {
    try {
      const resp = await fetch(`${PY_BACKEND}/api/attention/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        credentials: USE_PROXY ? 'include' : 'same-origin',
        body: JSON.stringify({ frame: imageData, timestamp: new Date().toISOString() })
      })
      if (!resp.ok) return null
      const json = await resp.json()
      const data = json?.data || json
      if (!data) return null
      return { attention: data.attention, confidence: data.confidence }
    } catch {
      return null
    }
  }

  async performGazeAnalysis(landmarks) {
    // Advanced gaze direction estimation
    const leftEye = landmarks.slice(36, 42)
    const rightEye = landmarks.slice(42, 48)
    
    const leftEyeCenter = this.calculateCentroid(leftEye)
    const rightEyeCenter = this.calculateCentroid(rightEye)
    
    // Estimate gaze direction
    const gazeVector = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2
    }
    
    const onScreen = this.isGazeOnScreen(gazeVector)
    return {
      direction: this.categorizeGazeDirection(gazeVector),
      coordinates: gazeVector,
      confidence: 0.8,
      onScreen,
      fixationStability: onScreen ? 0.8 : 0.4
    }
  }

  calculateCentroid(points) {
    const x = points.reduce((sum, point) => sum + point.x, 0) / points.length
    const y = points.reduce((sum, point) => sum + point.y, 0) / points.length
    return { x, y }
  }

  categorizeGazeDirection(gazeVector) {
    const threshold = 10
    
    if (Math.abs(gazeVector.x) < threshold && Math.abs(gazeVector.y) < threshold) {
      return 'center'
    } else if (gazeVector.x > threshold) {
      return 'right'
    } else if (gazeVector.x < -threshold) {
      return 'left'
    } else if (gazeVector.y > threshold) {
      return 'down'
    } else {
      return 'up'
    }
  }

  isGazeOnScreen(gazeVector) {
    // Determine if gaze is directed at screen
    return Math.abs(gazeVector.x) < 30 && Math.abs(gazeVector.y) < 25
  }

  async estimateHeadPose(landmarks) {
    // Estimate head pose angles using facial landmarks
    const nose = landmarks[30]
    const leftEye = landmarks[36]
    const rightEye = landmarks[45]
    const mouth = landmarks[48]
    
    // Calculate angles (simplified)
    const yaw = Math.atan2(rightEye.x - leftEye.x, rightEye.y - leftEye.y) * 180 / Math.PI
    const pitch = Math.atan2(mouth.y - nose.y, mouth.x - nose.x) * 180 / Math.PI
    const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI
    
    return {
      yaw: Math.max(-45, Math.min(45, yaw)),
      pitch: Math.max(-30, Math.min(30, pitch)),
      roll: Math.max(-30, Math.min(30, roll)),
      confidence: 0.85,
      facingCamera: Math.abs(yaw) < 15 && Math.abs(pitch) < 10
    }
  }

  async calculateEyeMetrics(landmarks) {
    const leftEye = landmarks.slice(36, 42)
    const rightEye = landmarks.slice(42, 48)
    
    // Calculate eye aspect ratios
    const leftEAR = this.calculateEyeAspectRatio(leftEye)
    const rightEAR = this.calculateEyeAspectRatio(rightEye)
    const avgEAR = (leftEAR + rightEAR) / 2
    
    // Detect blinks
    const blinkDetected = avgEAR < 0.25
    
    // Deterministic proxy for pupil dilation: inverse relation to EAR (very rough)
    const pupilDilation = Math.max(0.5, Math.min(1.0, 1.2 - avgEAR))
    
    return {
      eyeAspectRatio: avgEAR,
      blinkDetected,
      blinkRate: this.calculateBlinkRate(),
      pupilDilation,
      eyeMovementVelocity: 0, // single-frame metric not available; avoid randoms
      saccadeFrequency: 0 // requires temporal data; avoid randoms
    }
  }

  calculateEyeAspectRatio(eyeLandmarks) {
    // Calculate eye aspect ratio for blink detection
    const A = Math.sqrt(Math.pow(eyeLandmarks[1].x - eyeLandmarks[5].x, 2) + Math.pow(eyeLandmarks[1].y - eyeLandmarks[5].y, 2))
    const B = Math.sqrt(Math.pow(eyeLandmarks[2].x - eyeLandmarks[4].x, 2) + Math.pow(eyeLandmarks[2].y - eyeLandmarks[4].y, 2))
    const C = Math.sqrt(Math.pow(eyeLandmarks[0].x - eyeLandmarks[3].x, 2) + Math.pow(eyeLandmarks[0].y - eyeLandmarks[3].y, 2))
    
    return (A + B) / (2.0 * C)
  }

  calculateBlinkRate() {
    // Without temporal series, return 0 to avoid fabricating data
    return 0
  }

  async generateFocusMap(gazeAnalysis, headPose) {
    // Generate attention focus heatmap
    const focusRegions = {
      center: gazeAnalysis.direction === 'center' ? 1.0 : 0.0,
      left: gazeAnalysis.direction === 'left' ? 1.0 : 0.0,
      right: gazeAnalysis.direction === 'right' ? 1.0 : 0.0,
      top: gazeAnalysis.direction === 'up' ? 1.0 : 0.0,
      bottom: gazeAnalysis.direction === 'down' ? 1.0 : 0.0
    }
    
    return {
      regions: focusRegions,
      primaryFocus: gazeAnalysis.direction,
      focusStability: gazeAnalysis.fixationStability,
      attentionDistribution: this.calculateAttentionDistribution(focusRegions)
    }
  }

  calculateAttentionDistribution(focusRegions) {
    const total = Object.values(focusRegions).reduce((a, b) => a + b, 0)
    const distribution = {}
    
    Object.entries(focusRegions).forEach(([region, value]) => {
      distribution[region] = (value / total) * 100
    })
    
    return distribution
  }

  async assessCognitiveLoad(eyeMetrics, headPose) {
    // Assess cognitive load based on eye and head movement patterns
    let cognitiveLoad = 0.5 // Base load
    
    // High blink rate indicates fatigue/high load
    if (eyeMetrics.blinkRate > 18) {
      cognitiveLoad += 0.2
    }
    
    // Rapid eye movements indicate processing
    if (eyeMetrics.eyeMovementVelocity > 7) {
      cognitiveLoad += 0.15
    }
    
    // Head movement indicates restlessness/difficulty
    const headMovement = Math.abs(headPose.yaw) + Math.abs(headPose.pitch)
    if (headMovement > 20) {
      cognitiveLoad += 0.1
    }
    
    // Pupil dilation indicates mental effort
    if (eyeMetrics.pupilDilation > 0.8) {
      cognitiveLoad += 0.1
    }
    
    return {
      level: Math.max(0, Math.min(1, cognitiveLoad)),
      category: cognitiveLoad > 0.7 ? 'high' : cognitiveLoad > 0.4 ? 'medium' : 'low',
      indicators: {
        blinkRate: eyeMetrics.blinkRate,
        eyeMovement: eyeMetrics.eyeMovementVelocity,
        headMovement,
        pupilDilation: eyeMetrics.pupilDilation
      }
    }
  }

  calculateAttentionScore(gazeAnalysis, headPose, eyeMetrics) {
    let score = 100
    
    // Penalize for looking away from screen
    if (!gazeAnalysis.onScreen) {
      score -= 30
    }
    
    // Penalize for head movement
    const headMovement = Math.abs(headPose.yaw) + Math.abs(headPose.pitch)
    score -= Math.min(25, headMovement)
    
    // Penalize for excessive blinking (fatigue)
    if (eyeMetrics.blinkRate > 20) {
      score -= Math.min(20, (eyeMetrics.blinkRate - 20) * 2)
    }
    
    // Bonus for stable fixation
    score += gazeAnalysis.fixationStability * 10
    
    return Math.max(0, Math.min(100, score))
  }

  calculateEngagementLevel(gazeAnalysis, eyeMetrics) {
    let engagement = 0.5
    
    if (gazeAnalysis.onScreen) engagement += 0.3
    if (gazeAnalysis.fixationStability > 0.7) engagement += 0.2
    if (eyeMetrics.saccadeFrequency > 3) engagement += 0.1 // Active visual scanning
    if (eyeMetrics.pupilDilation > 0.8) engagement += 0.1 // Mental effort
    
    return Math.max(0, Math.min(1, engagement))
  }

  detectDistractionIndicators(gazeAnalysis, headPose) {
    const indicators = []
    
    if (!gazeAnalysis.onScreen) {
      indicators.push({
        type: 'gaze_off_screen',
        severity: 'medium',
        description: 'Looking away from learning content'
      })
    }
    
    if (Math.abs(headPose.yaw) > 25) {
      indicators.push({
        type: 'head_turn',
        severity: 'low',
        description: 'Head turned away from optimal position'
      })
    }
    
    if (gazeAnalysis.fixationStability < 0.4) {
      indicators.push({
        type: 'unstable_gaze',
        severity: 'medium',
        description: 'Unstable visual attention'
      })
    }
    
    return indicators
  }

  async predictLearningOutcome(studentData, moduleData, cognitiveHistory) {
    await this.initialize()
    
    try {
      // Prepare features for prediction
      const features = this.preparePredictionFeatures(studentData, moduleData, cognitiveHistory)
      
      // If models failed to initialize, provide a heuristic-based fallback immediately
      const tfModel = this.models?.performance
      const brainNet = this.neuralNetworks?.learningPredictor
      
      let tfScore = null
      if (tfModel && typeof tfModel.predict === 'function') {
        try {
          const tensor = tf.tensor2d([features])
          const out = await tfModel.predict(tensor).data()
          tfScore = Array.isArray(out) ? out[0] : out
        } catch (e) {
          console.warn('TF prediction fallback due to error:', e)
        }
      }

      let brainScore = null
      if (this.isBrainRunnable(brainNet)) {
        try {
          // brain.js expects normalized input; we pass features vector directly
          brainScore = brainNet.run(features)
          // Some configs return object; coerce to number if needed
          if (brainScore && typeof brainScore === 'object') {
            const vals = Object.values(brainScore)
            brainScore = vals.length ? vals[0] : null
          }
        } catch (e) {
          console.warn('Brain.js prediction fallback due to error:', e)
        }
      }

      // Final score selection with graceful fallback
      const heuristic = this.simpleHeuristicScore(features)
      const combinedScore = this.combineScores(tfScore, brainScore, heuristic)
      
      // Combine predictions
      return {
        predictedScore: combinedScore * 100,
        confidence: this.calculatePredictionConfidence(features),
        factors: this.identifyKeyFactors(features),
        recommendations: this.generatePredictionRecommendations(combinedScore, features),
        riskAssessment: this.assessLearningRisk(combinedScore, features),
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Learning outcome prediction failed:', error)
      return this.getFallbackPrediction()
    }
  }

  simpleHeuristicScore(features) {
    // Heuristic using attention, performance, engagement (indices 0,1,8)
    const a = Number(features[0] ?? 0.5)
    const p = Number(features[1] ?? 0.7)
    const e = Number(features[8] ?? 0.5)
    return Math.max(0, Math.min(1, 0.5 * p + 0.3 * a + 0.2 * e))
  }

  combineScores(tfScore, brainScore, heuristic) {
    const scores = [tfScore, brainScore, heuristic].filter(v => typeof v === 'number' && !isNaN(v))
    if (scores.length === 0) return 0.75 // stable default
    // Weighted average: prefer TF then brain, then heuristic
    const weights = scores.map((v, i) => (i === 0 ? 0.5 : i === 1 ? 0.3 : 0.2))
    // If fewer than 3 scores, re-normalize weights
    const sumW = weights.slice(0, scores.length).reduce((a, b) => a + b, 0)
    const normW = weights.slice(0, scores.length).map(w => w / sumW)
    return scores.reduce((acc, v, i) => acc + v * normW[i], 0)
  }

  preparePredictionFeatures(studentData, moduleData, cognitiveHistory) {
    // Extract and normalize features for ML models
    const features = [
      // Student features
      (studentData.averageAttention || 50) / 100,
      (studentData.averagePerformance || 70) / 100,
      (studentData.studyStreak || 0) / 30,
      (studentData.completedModules || 0) / 20,
      
      // Module features
      (moduleData.difficulty || 2) / 4,
      (moduleData.estimatedDuration || 45) / 120,
      moduleData.hasPrerequisites ? 1 : 0,
      
      // Cognitive features
      (this.getAverageCognitive(cognitiveHistory, 'attention') || 50) / 100,
      (this.getAverageCognitive(cognitiveHistory, 'engagement') || 50) / 100,
      (this.getAverageCognitive(cognitiveHistory, 'fatigue') || 30) / 100,
      (this.getAverageCognitive(cognitiveHistory, 'confusion') || 30) / 100,
      
      // Temporal features
      this.getTimeOfDayFactor(),
      this.getDayOfWeekFactor(),
      this.getStudySessionLengthFactor(studentData.currentSessionTime || 30)
    ]
    
    return features
  }

  getAverageCognitive(history, metric) {
    if (!history || history.length === 0) return null
    
    const values = history.map(h => h[metric]).filter(v => v !== undefined)
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
  }

  getTimeOfDayFactor() {
    const hour = new Date().getHours()
    // Peak learning hours: 9-11 AM and 2-4 PM
    if ((hour >= 9 && hour <= 11) || (hour >= 14 && hour <= 16)) {
      return 1.0
    } else if (hour >= 7 && hour <= 19) {
      return 0.7
    } else {
      return 0.3
    }
  }

  getDayOfWeekFactor() {
    const day = new Date().getDay()
    // Weekdays generally better for learning
    return day >= 1 && day <= 5 ? 0.8 : 0.6
  }

  getStudySessionLengthFactor(sessionTime) {
    // Optimal session length is 25-45 minutes
    if (sessionTime >= 25 && sessionTime <= 45) {
      return 1.0
    } else if (sessionTime < 25) {
      return sessionTime / 25
    } else {
      return Math.max(0.3, 1 - (sessionTime - 45) / 60)
    }
  }

  calculatePredictionConfidence(features) {
    // Calculate confidence based on feature completeness and quality
    const completeness = features.filter(f => f !== null && !isNaN(f)).length / features.length
    const variance = this.calculateVariance(features.filter(f => f !== null))
    
    return Math.max(0.5, completeness * 0.7 + (1 - variance) * 0.3)
  }

  identifyKeyFactors(features) {
    const factorNames = [
      'Average Attention', 'Average Performance', 'Study Streak', 'Completed Modules',
      'Module Difficulty', 'Module Duration', 'Has Prerequisites',
      'Current Attention', 'Current Engagement', 'Current Fatigue', 'Current Confusion',
      'Time of Day', 'Day of Week', 'Session Length'
    ]
    
    const factors = features.map((value, index) => ({
      name: factorNames[index],
      value,
      impact: this.calculateFactorImpact(value, index)
    }))
    
    return factors
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 5)
  }

  calculateFactorImpact(value, index) {
    // Simplified impact calculation
    const weights = [0.3, 0.25, 0.1, 0.15, -0.2, -0.1, 0.05, 0.3, 0.25, -0.2, -0.25, 0.1, 0.05, 0.15]
    return (value || 0) * (weights[index] || 0)
  }

  generatePredictionRecommendations(score, features) {
    const recommendations = []
    
    if (score < 0.6) {
      recommendations.push({
        type: 'difficulty_adjustment',
        message: 'Consider reducing content difficulty',
        priority: 'high'
      })
      
      recommendations.push({
        type: 'break_suggestion',
        message: 'Take a break before continuing',
        priority: 'medium'
      })
    }
    
    if (features[9] > 0.6) { // High confusion
      recommendations.push({
        type: 'explanation_support',
        message: 'Request additional explanations or examples',
        priority: 'high'
      })
    }
    
    if (features[8] < 0.4) { // Low engagement
      recommendations.push({
        type: 'interactivity_boost',
        message: 'Switch to more interactive content',
        priority: 'medium'
      })
    }
    
    return recommendations
  }

  assessLearningRisk(score, features) {
    let riskLevel = 'low'
    const riskFactors = []
    
    if (score < 0.4) {
      riskLevel = 'high'
      riskFactors.push('Low predicted performance')
    }
    
    if (features[9] > 0.7) { // High confusion
      riskLevel = riskLevel === 'low' ? 'medium' : 'high'
      riskFactors.push('High confusion levels')
    }
    
    if (features[8] < 0.3) { // Very low engagement
      riskLevel = riskLevel === 'low' ? 'medium' : 'high'
      riskFactors.push('Very low engagement')
    }
    
    return {
      level: riskLevel,
      factors: riskFactors,
      mitigation: this.generateRiskMitigation(riskFactors)
    }
  }

  generateRiskMitigation(riskFactors) {
    const mitigation = []
    
    riskFactors.forEach(factor => {
      if (factor.includes('performance')) {
        mitigation.push('Review prerequisite concepts')
        mitigation.push('Switch to easier content temporarily')
      }
      if (factor.includes('confusion')) {
        mitigation.push('Request simplified explanations')
        mitigation.push('Use visual learning aids')
      }
      if (factor.includes('engagement')) {
        mitigation.push('Try interactive exercises')
        mitigation.push('Change study environment')
      }
    })
    
    return [...new Set(mitigation)] // Remove duplicates
  }

  async loadImageFromData(imageData) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = imageData
    })
  }

  getFallbackEmotionAnalysis() {
    // Avoid fabricating emotions; return minimal neutral-only when no data
    return {
      emotions: { neutral: 1.0 },
      confidence: 0.0,
      facialLandmarks: null,
      advancedMetrics: null,
      timestamp: new Date().toISOString()
    }
  }

  getFallbackAttentionAnalysis() {
    // Avoid synthetic values; indicate unavailable metrics explicitly
    return {
      attentionScore: null,
      gazeAnalysis: { direction: null, onScreen: null, confidence: 0 },
      headPose: { yaw: null, pitch: null, roll: null, facingCamera: null },
      eyeMetrics: { blinkRate: 0, eyeAspectRatio: null },
      focusMap: null
    }
  }

  getFallbackPrediction() {
    return {
      predictedScore: 75,
      confidence: 0.5,
      factors: [],
      recommendations: [{ type: 'general', message: 'Continue with current approach', priority: 'low' }],
      riskAssessment: { level: 'low', factors: [], mitigation: [] },
      timestamp: new Date().toISOString()
    }
  }
}

export default new AdvancedMLService()