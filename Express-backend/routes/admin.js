import express from 'express'
import { query } from '../config/database.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireRole } from '../middleware/auth.js'
import { body } from 'express-validator'

const router = express.Router()

// All routes require admin role
router.use(requireRole(['admin']))

// Get system overview
router.get('/overview', asyncHandler(async (req, res) => {
  // Get system statistics
  const statsResult = await query(`
    SELECT 
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '24 hours') as active_users_24h,
      (SELECT COUNT(*) FROM learning_sessions WHERE started_at >= NOW() - INTERVAL '24 hours') as sessions_24h,
      (SELECT AVG(attention_score) FROM learning_sessions WHERE started_at >= NOW() - INTERVAL '7 days') as avg_attention_7d,
      (SELECT COUNT(*) FROM wellness_entries WHERE created_at >= NOW() - INTERVAL '24 hours') as wellness_entries_24h
  `)

  // Get users needing support
  const supportResult = await query(`
    SELECT 
      u.id, u.name, u.avatar, u.last_login,
      ls.attention_score, ls.wellness_score, ls.started_at
    FROM users u
    LEFT JOIN LATERAL (
      SELECT attention_score, wellness_score, started_at
      FROM learning_sessions 
      WHERE user_id = u.id 
      ORDER BY started_at DESC 
      LIMIT 1
    ) ls ON true
    WHERE (ls.attention_score < 50 OR ls.wellness_score < 50)
    AND u.last_login >= NOW() - INTERVAL '7 days'
    ORDER BY COALESCE(ls.attention_score, 0) + COALESCE(ls.wellness_score, 0) ASC
    LIMIT 10
  `)

  // Get system alerts
  const alertsResult = await query(`
    SELECT 
      'low_attention' as type,
      COUNT(*) as count,
      'Users with attention below 50%' as description
    FROM learning_sessions ls
    JOIN users u ON ls.user_id = u.id
    WHERE ls.attention_score < 50 
    AND ls.started_at >= NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
      'high_stress' as type,
      COUNT(*) as count,
      'Users with high stress levels' as description
    FROM wellness_entries we
    JOIN users u ON we.user_id = u.id
    WHERE we.stress_level >= 8
    AND we.created_at >= NOW() - INTERVAL '24 hours'
  `)

  res.json({
    success: true,
    overview: {
      statistics: statsResult.rows[0],
      users_needing_support: supportResult.rows,
      system_alerts: alertsResult.rows
    }
  })
}))

// Get detailed user analytics
router.get('/users/:userId/analytics', asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { days = 30 } = req.query

  // Get user basic info
  const userResult = await query(
    'SELECT id, name, email, role, institution, created_at, last_login FROM users WHERE id = $1',
    [userId]
  )

  if (userResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  // Get learning analytics
  const learningResult = await query(
    `SELECT 
       DATE(started_at) as date,
       COUNT(*) as sessions,
       AVG(duration) as avg_duration,
       AVG(attention_score) as avg_attention,
       AVG(wellness_score) as avg_wellness,
       AVG(completion_percentage) as avg_completion
     FROM learning_sessions 
     WHERE user_id = $1 AND started_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(started_at)
     ORDER BY date`,
    [userId]
  )

  // Get wellness analytics
  const wellnessResult = await query(
    `SELECT 
       DATE(created_at) as date,
       AVG(mood_score) as avg_mood,
       AVG(stress_level) as avg_stress,
       AVG(energy_level) as avg_energy
     FROM wellness_entries 
     WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [userId]
  )

  // Get module progress
  const moduleResult = await query(
    `SELECT 
       lm.title, lm.category, lm.difficulty,
       ump.completion_percentage, ump.time_spent, ump.last_accessed
     FROM user_module_progress ump
     JOIN learning_modules lm ON ump.module_id = lm.id
     WHERE ump.user_id = $1
     ORDER BY ump.last_accessed DESC`,
    [userId]
  )

  res.json({
    success: true,
    user_analytics: {
      user_info: userResult.rows[0],
      learning_trends: learningResult.rows,
      wellness_trends: wellnessResult.rows,
      module_progress: moduleResult.rows,
      analysis_period: `${days} days`
    }
  })
}))

// Get cognitive load analysis
router.get('/cognitive-load', asyncHandler(async (req, res) => {
  const { time_range = 'week' } = req.query

  const interval = {
    'week': '7 days',
    'month': '30 days',
    'quarter': '90 days'
  }[time_range] || '7 days'

  const result = await query(
    `SELECT 
       lm.category as subject,
       lm.difficulty,
       AVG(ls.attention_score) as avg_attention,
       AVG(CASE WHEN ls.final_cognitive_state->>'confusion' IS NOT NULL 
            THEN (ls.final_cognitive_state->>'confusion')::float 
            ELSE 0 END) as avg_confusion,
       COUNT(ls.id) as session_count,
       COUNT(DISTINCT ls.user_id) as unique_users
     FROM learning_sessions ls
     JOIN learning_modules lm ON ls.module_id = lm.id
     WHERE ls.started_at >= NOW() - INTERVAL '${interval}'
     GROUP BY lm.category, lm.difficulty
     ORDER BY avg_confusion DESC, avg_attention ASC`,
  )

  res.json({
    success: true,
    cognitive_load_analysis: result.rows,
    time_range
  })
}))

// Push adaptive content to users
router.post('/push-content', [
  body('user_ids').isArray().withMessage('User IDs array required'),
  body('content_type').isString().withMessage('Content type required'),
  body('content_data').isObject().withMessage('Content data required')
], asyncHandler(async (req, res) => {
  const { user_ids, content_type, content_data, message } = req.body

  // Validate users exist
  const usersCheck = await query(
    'SELECT id FROM users WHERE id = ANY($1)',
    [user_ids]
  )

  if (usersCheck.rows.length !== user_ids.length) {
    return res.status(400).json({
      success: false,
      message: 'Some user IDs are invalid'
    })
  }

  // Create content push records
  const pushPromises = user_ids.map(userId => 
    query(
      `INSERT INTO content_pushes (user_id, content_type, content_data, message, created_at, status)
       VALUES ($1, $2, $3, $4, NOW(), 'pending')`,
      [userId, content_type, JSON.stringify(content_data), message]
    )
  )

  await Promise.all(pushPromises)

  res.json({
    success: true,
    message: `Content pushed to ${user_ids.length} users`,
    recipients: user_ids.length
  })
}))

// Get system performance metrics
router.get('/performance', asyncHandler(async (req, res) => {
  const { hours = 24 } = req.query

  // Get API performance metrics
  const apiMetrics = await query(`
    SELECT 
      COUNT(*) as total_requests,
      AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_response_time,
      COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
    FROM api_logs 
    WHERE created_at >= NOW() - INTERVAL '${hours} hours'
  `)

  // Get ML model performance
  const mlMetrics = await query(`
    SELECT 
      model_type,
      AVG(confidence_score) as avg_confidence,
      AVG(processing_time_ms) as avg_processing_time,
      COUNT(*) as total_predictions
    FROM ml_predictions 
    WHERE created_at >= NOW() - INTERVAL '${hours} hours'
    GROUP BY model_type
  `)

  // Get database performance
  const dbMetrics = await query(`
    SELECT 
      COUNT(*) as total_queries,
      AVG(duration_ms) as avg_query_time
    FROM query_logs 
    WHERE created_at >= NOW() - INTERVAL '${hours} hours'
  `)

  res.json({
    success: true,
    performance_metrics: {
      api: apiMetrics.rows[0] || {},
      ml_models: mlMetrics.rows,
      database: dbMetrics.rows[0] || {},
      time_window: `${hours} hours`
    }
  })
}))

// Update system settings
router.put('/settings', [
  body('settings').isObject().withMessage('Settings object required')
], asyncHandler(async (req, res) => {
  const { settings } = req.body

  // Update system settings
  await query(
    `INSERT INTO system_settings (key, value, updated_by, updated_at)
     VALUES ('global_config', $1, $2, NOW())
     ON CONFLICT (key) 
     DO UPDATE SET value = $1, updated_by = $2, updated_at = NOW()`,
    [JSON.stringify(settings), req.user.id]
  )

  res.json({
    success: true,
    message: 'System settings updated successfully'
  })
}))

export default router