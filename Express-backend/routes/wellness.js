import express from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import mongoose from 'mongoose'
import WellnessEntry from '../models/WellnessEntry.js'
import DailyWellnessSummary from '../models/DailyWellnessSummary.js'
import { query } from '../config/database.js'

const router = express.Router()

// Record wellness entry (MongoDB)
router.post('/entries', [
  body('mood_score').isInt({ min: 1, max: 10 }).withMessage('Mood score must be 1-10'),
  body('stress_level').isInt({ min: 1, max: 10 }).withMessage('Stress level must be 1-10'),
  body('energy_level').isInt({ min: 1, max: 10 }).withMessage('Energy level must be 1-10')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const userId = req.user.id
  const { 
    mood_score, 
    stress_level, 
    energy_level, 
    sleep_hours, 
    sleep_quality,
    notes,
    mood_tags 
  } = req.body

  const doc = await WellnessEntry.create({
    user_id: new mongoose.Types.ObjectId(userId),
    mood_score,
    stress_level,
    energy_level,
    sleep_hours,
    sleep_quality,
    notes,
    mood_tags: mood_tags || [],
    created_at: new Date()
  })

  // Calculate wellness score
  const wellness_score = Math.round(
    (mood_score * 0.3 + (11 - stress_level) * 0.3 + energy_level * 0.4) * 10
  )

  res.status(201).json({
    success: true,
    message: 'Wellness entry recorded',
    entry: { id: doc.id, wellness_score, created_at: doc.created_at }
  })
}))

// Upsert daily wellness summary (MongoDB)
router.post('/daily-summary', [
  body('date').isString().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  body('wellness_score').optional().isNumeric(),
  body('sessions').optional().isInt({ min: 0 }),
  body('goals').optional().isArray(),
  body('goals_achieved').optional().isInt({ min: 0 }),
  body('goals_total').optional().isInt({ min: 0 }),
  body('avg_focus').optional().isNumeric(),
  body('tips_sample').optional().isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() })
  }

  const userId = req.user.id
  const { date, wellness_score, sessions, goals = [], goals_achieved, goals_total, avg_focus, tips_sample = [], meta } = req.body

  const update = {
    user_id: new mongoose.Types.ObjectId(userId),
    date,
    wellness_score,
    sessions,
    goals,
    goals_achieved,
    goals_total,
    avg_focus,
    tips_sample,
    meta
  }

  const doc = await DailyWellnessSummary.findOneAndUpdate(
    { user_id: new mongoose.Types.ObjectId(userId), date },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  res.status(201).json({ success: true, message: 'Daily summary saved', summary: doc })
}))

// Get wellness history (MongoDB)
router.get('/history', asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { days = 30 } = req.query

  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)
  const docs = await WellnessEntry.find({ user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since } }).sort({ created_at: -1 })

  const entries = docs.map(e => ({
    id: e.id,
    mood_score: e.mood_score,
    stress_level: e.stress_level,
    energy_level: e.energy_level,
    sleep_hours: e.sleep_hours,
    sleep_quality: e.sleep_quality,
    notes: e.notes,
    mood_tags: e.mood_tags,
    created_at: e.created_at,
    wellness_score: (e.mood_score * 0.3 + (11 - e.stress_level) * 0.3 + e.energy_level * 0.4) * 10
  }))

  // Calculate trends
  const trends = {
    mood_trend: calculateTrend(entries.map(e => e.mood_score)),
    stress_trend: calculateTrend(entries.map(e => e.stress_level)),
    energy_trend: calculateTrend(entries.map(e => e.energy_level)),
    wellness_trend: calculateTrend(entries.map(e => e.wellness_score))
  }

  res.json({
    success: true,
    history: entries,
    trends,
    summary: {
      total_entries: entries.length,
      average_wellness: entries.length > 0 ? 
        Math.round(entries.reduce((sum, e) => sum + e.wellness_score, 0) / entries.length) : 0,
      days_tracked: days
    }
  })
}))

// Get wellness insights
router.get('/insights', asyncHandler(async (req, res) => {
  const userId = req.user.id

  // Mongo-only insights: last 7 days of wellness entries
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const docs = await WellnessEntry.find({
    user_id: new mongoose.Types.ObjectId(userId),
    created_at: { $gte: since }
  }).sort({ created_at: 1 })

  const recentRows = docs.map(d => ({
    mood_score: d.mood_score,
    stress_level: d.stress_level,
    energy_level: d.energy_level,
    created_at: d.created_at
  }))
  const correlationRows = [] // No PG correlations in Mongo-only mode

  // Generate insights
  const insights = generateWellnessInsights(recentRows, correlationRows)

  res.json({
    success: true,
    insights,
    data_points: recentRows.length,
    correlation_data_points: correlationRows.length
  })
}))

// Mood analytics aggregated by day over a time range
router.get('/mood-analytics', asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { time_range = 'week' } = req.query

  const rangeToDays = { week: 7, month: 30, quarter: 90 }
  const days = rangeToDays[time_range] || 7
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const data = await WellnessEntry.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since } } },
    { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        avg_mood: { $avg: '$mood_score' },
        avg_stress: { $avg: '$stress_level' },
        avg_energy: { $avg: '$energy_level' },
        entries: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ])

  const series = data.map(d => ({
    date: d._id,
    mood: Math.round(d.avg_mood * 10) / 10,
    stress: Math.round(d.avg_stress * 10) / 10,
    energy: Math.round(d.avg_energy * 10) / 10,
    entries: d.entries
  }))

  res.json({ success: true, time_range, data: series })
}))

// Record break activity
router.post('/breaks', [
  body('activity_type').isString().withMessage('Activity type required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be positive')
], asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { activity_type, duration, effectiveness_rating, notes } = req.body

  const result = await query(
    `INSERT INTO break_activities 
     (user_id, activity_type, duration, effectiveness_rating, notes, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id`,
    [userId, activity_type, duration, effectiveness_rating, notes]
  )

  res.status(201).json({
    success: true,
    message: 'Break activity recorded',
    activity_id: result.rows[0].id
  })
}))

// Get break recommendations
router.get('/break-recommendations', asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { current_stress = 5, current_energy = 5, session_duration = 30 } = req.query

  // Get user's preferred break activities
  const preferencesResult = await query(
    `SELECT activity_type, AVG(effectiveness_rating) as avg_effectiveness
     FROM break_activities 
     WHERE user_id = $1 AND effectiveness_rating IS NOT NULL
     GROUP BY activity_type
     ORDER BY avg_effectiveness DESC`,
    [userId]
  )

  // Generate recommendations based on current state
  const recommendations = generateBreakRecommendations(
    parseInt(current_stress),
    parseInt(current_energy),
    parseInt(session_duration),
    preferencesResult.rows
  )

  res.json({
    success: true,
    recommendations,
    personalized: preferencesResult.rows.length > 0
  })
}))

// Helper functions
function calculateTrend(values) {
  if (values.length < 3) return 'insufficient_data'
  
  const recent = values.slice(-3)
  const older = values.slice(0, 3)
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
  
  const difference = recentAvg - olderAvg
  
  if (difference > 0.5) return 'improving'
  if (difference < -0.5) return 'declining'
  return 'stable'
}

function generateWellnessInsights(recentData, correlationData) {
  const insights = []
  
  if (recentData.length === 0) {
    return [{ type: 'no_data', message: 'Start tracking your wellness to get personalized insights!' }]
  }

  // Mood insights
  const avgMood = recentData.reduce((sum, entry) => sum + entry.mood_score, 0) / recentData.length
  if (avgMood < 5) {
    insights.push({
      type: 'mood_concern',
      message: 'Your mood has been below average recently. Consider wellness activities.',
      priority: 'high'
    })
  }

  // Stress insights
  const avgStress = recentData.reduce((sum, entry) => sum + entry.stress_level, 0) / recentData.length
  if (avgStress > 7) {
    insights.push({
      type: 'stress_management',
      message: 'High stress levels detected. Regular breaks and relaxation techniques recommended.',
      priority: 'high'
    })
  }

  // Energy insights
  const avgEnergy = recentData.reduce((sum, entry) => sum + entry.energy_level, 0) / recentData.length
  if (avgEnergy < 5) {
    insights.push({
      type: 'energy_optimization',
      message: 'Low energy levels may be affecting your learning. Focus on sleep and nutrition.',
      priority: 'medium'
    })
  }

  // Correlation insights
  if (correlationData.length > 5) {
    const moodAttentionCorr = calculateCorrelation(
      correlationData.map(d => d.mood_score),
      correlationData.map(d => d.attention_score)
    )
    
    if (moodAttentionCorr > 0.6) {
      insights.push({
        type: 'correlation',
        message: 'Your mood strongly correlates with attention. Mood management can improve focus.',
        priority: 'medium'
      })
    }
  }

  return insights
}

function generateBreakRecommendations(stress, energy, sessionDuration, userPreferences) {
  const recommendations = []
  
  // Base recommendations on current state
  if (stress >= 7) {
    recommendations.push({
      type: 'breathing_exercise',
      title: 'Deep Breathing',
      description: '4-7-8 breathing technique for stress relief',
      duration: 5,
      priority: 'high'
    })
  }

  if (energy <= 4) {
    recommendations.push({
      type: 'light_exercise',
      title: 'Energizing Movement',
      description: 'Light stretching or short walk',
      duration: 10,
      priority: 'high'
    })
  }

  if (sessionDuration >= 45) {
    recommendations.push({
      type: 'eye_rest',
      title: 'Eye Rest',
      description: '20-20-20 rule for eye strain relief',
      duration: 3,
      priority: 'medium'
    })
  }

  // Add personalized recommendations based on user history
  userPreferences.forEach(pref => {
    if (pref.avg_effectiveness >= 4) {
      recommendations.push({
        type: pref.activity_type,
        title: `Your Favorite: ${pref.activity_type}`,
        description: 'Based on your previous positive experiences',
        duration: 5,
        priority: 'medium',
        personalized: true
      })
    }
  })

  return recommendations.slice(0, 5) // Limit to 5 recommendations
}

function calculateCorrelation(x, y) {
  if (x.length !== y.length || x.length === 0) return 0
  
  const n = x.length
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)
  
  const numerator = n * sumXY - sumX * sumY
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
  
  return denominator === 0 ? 0 : numerator / denominator
}

export default router