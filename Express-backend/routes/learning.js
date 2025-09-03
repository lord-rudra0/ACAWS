import express from 'express'
import { body, validationResult } from 'express-validator'
import { query } from '../config/database.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import mongoose from 'mongoose'
import LearningModule from '../models/LearningModule.js'
import tutorService from '../services/tutorService.js'
import LearningSession from '../models/LearningSession.js'
import LearningDebugLog from '../models/LearningDebugLog.js'

const router = express.Router()

// Get learning modules (MongoDB)
router.get('/modules', asyncHandler(async (req, res) => {
  const { category = '', difficulty = '', search = '' } = req.query

  const filter = { }
  if (category) filter.category = category
  if (difficulty) filter.difficulty = difficulty
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ]

  const modules = await LearningModule.find(filter).sort({ difficulty: 1, created_at: 1 })
  res.json({ success: true, modules })
}))

// Create learning module (basic)
router.post('/modules', [
  body('title').isLength({ min: 3 }).withMessage('Title required'),
  body('description').isLength({ min: 5 }).withMessage('Description required'),
  body('category').isString().withMessage('Category required'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be positive')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() })
  }

  const { title, description, category, difficulty, duration, topics = [], prerequisites = [], ai_meta = {} } = req.body
  const doc = await LearningModule.create({ title, description, category, difficulty, duration, topics, prerequisites, ai_meta, created_at: new Date() })
  // Also create a lightweight TutorRoadmap so modules appear in AI/Tutor listings
  try {
    const roadmapPayload = {
      title: title,
      description: description || '',
      meta: { linkedModuleId: doc._id, category, difficulty, duration, ai_meta }
    }
    const rd = await tutorService.createRoadmap(roadmapPayload)
    res.status(201).json({ success: true, module: doc.toJSON(), tutorRoadmap: rd })
  } catch (e) {
    // If tutor roadmap creation fails, still return module but warn
    console.warn('Failed to create linked TutorRoadmap for module', e)
    res.status(201).json({ success: true, module: doc.toJSON(), tutorRoadmap: null })
  }
}))

// Get user's module progress
router.get('/progress', asyncHandler(async (req, res) => {
  const userId = req.user.id

  const result = await query(
    `SELECT 
       lm.id, lm.title, lm.difficulty, lm.duration,
       ump.completion_percentage, ump.last_accessed, ump.time_spent,
       ump.current_section, ump.quiz_scores
     FROM learning_modules lm
     LEFT JOIN user_module_progress ump ON lm.id = ump.module_id AND ump.user_id = $1
     WHERE lm.active = true
     ORDER BY lm.difficulty, lm.created_at`,
    [userId]
  )

  res.json({
    success: true,
    progress: result.rows
  })
}))

// Start learning session
router.post('/sessions/start', [
  body('module_id').isUUID().withMessage('Valid module ID required'),
  body('session_type').isIn(['study', 'practice', 'assessment']).withMessage('Invalid session type')
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
  const { module_id, session_type, initial_cognitive_state } = req.body

  // Check if module exists
  const moduleCheck = await query(
    'SELECT id, title FROM learning_modules WHERE id = $1 AND active = true',
    [module_id]
  )

  if (moduleCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Learning module not found'
    })
  }

  // Create learning session
  const sessionResult = await query(
    `INSERT INTO learning_sessions 
     (user_id, module_id, session_type, initial_cognitive_state, started_at, status)
     VALUES ($1, $2, $3, $4, NOW(), 'active')
     RETURNING id, started_at`,
    [userId, module_id, session_type, JSON.stringify(initial_cognitive_state || {})]
  )

  const session = sessionResult.rows[0]

  res.status(201).json({
    success: true,
    message: 'Learning session started',
    session: {
      id: session.id,
      module_id,
      session_type,
      started_at: session.started_at,
      status: 'active'
    }
  })
}))

// Update session progress
router.put('/sessions/:sessionId/progress', [
  body('cognitive_state').isObject().withMessage('Cognitive state data required'),
  body('content_progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be 0-100')
], asyncHandler(async (req, res) => {
  const { sessionId } = req.params
  const userId = req.user.id
  const { cognitive_state, content_progress, interactions, adaptations } = req.body

  // Verify session belongs to user
  const sessionCheck = await query(
    'SELECT id FROM learning_sessions WHERE id = $1 AND user_id = $2 AND status = $3',
    [sessionId, userId, 'active']
  )

  if (sessionCheck.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Active session not found'
    })
  }

  // Update session progress
  await query(
    `UPDATE learning_sessions SET
     current_cognitive_state = $1,
     content_progress = $2,
     interactions = $3,
     adaptations_applied = $4,
     last_updated = NOW()
     WHERE id = $5`,
    [
      JSON.stringify(cognitive_state),
      content_progress,
      JSON.stringify(interactions || []),
      JSON.stringify(adaptations || {}),
      sessionId
    ]
  )

  res.json({
    success: true,
    message: 'Session progress updated'
  })
}))

// End learning session
router.put('/sessions/:sessionId/end', [
  body('final_cognitive_state').optional().isObject(),
  body('completion_percentage').isInt({ min: 0, max: 100 }).withMessage('Completion must be 0-100')
], asyncHandler(async (req, res) => {
  const { sessionId } = req.params
  const userId = req.user.id
  const { final_cognitive_state, completion_percentage, session_feedback } = req.body

  // Calculate session duration and update
  const result = await query(
    `UPDATE learning_sessions SET
     status = 'completed',
     ended_at = NOW(),
     duration = EXTRACT(EPOCH FROM (NOW() - started_at))/60,
     final_cognitive_state = $1,
     completion_percentage = $2,
     session_feedback = $3
     WHERE id = $4 AND user_id = $5 AND status = 'active'
     RETURNING id, duration, module_id`,
    [
      JSON.stringify(final_cognitive_state || {}),
      completion_percentage,
      JSON.stringify(session_feedback || {}),
      sessionId,
      userId
    ]
  )

  if (result.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'Active session not found'
    })
  }

  const session = result.rows[0]

  // Update module progress
  await query(
    `INSERT INTO user_module_progress (user_id, module_id, completion_percentage, last_accessed, time_spent)
     VALUES ($1, $2, $3, NOW(), $4)
     ON CONFLICT (user_id, module_id)
     DO UPDATE SET
       completion_percentage = GREATEST(user_module_progress.completion_percentage, $3),
       last_accessed = NOW(),
       time_spent = user_module_progress.time_spent + $4`,
    [userId, session.module_id, completion_percentage, session.duration]
  )

  res.json({
    success: true,
    message: 'Learning session completed',
    session: {
      id: session.id,
      duration: session.duration,
      completion_percentage
    }
  })
}))

// Save full session summary (Mongo) - used by frontend to persist AI-generated session summaries
router.post('/sessions/save', asyncHandler(async (req, res) => {
  const userId = req.user?.id
  const { module_id, session_type = 'study', summary = {}, duration, cognitiveHistory = [], adaptations = {}, metrics = {} } = req.body

  if (!module_id) {
    return res.status(400).json({ success: false, message: 'module_id required' })
  }

  const doc = await LearningSession.create({
    user_id: userId,
    module_id,
    session_type,
    status: 'completed',
    initial_cognitive_state: summary.initial_cognitive_state || {},
    final_cognitive_state: summary.final_cognitive_state || {},
    content_progress: summary.completion_percentage || 100,
    interactions: summary.interactions || [],
    adaptations_applied: adaptations || {},
    attention_score: metrics.attention_score,
    wellness_score: metrics.wellness_score,
    completion_percentage: summary.completion_percentage || 100,
    started_at: summary.started_at ? new Date(summary.started_at) : new Date(),
    ended_at: summary.ended_at ? new Date(summary.ended_at) : new Date(),
    last_updated: new Date()
  })

  // Also store cognitiveHistory as separate interactions if provided
  if (Array.isArray(cognitiveHistory) && cognitiveHistory.length > 0) {
    doc.interactions = doc.interactions.concat(cognitiveHistory.map(ch => ({ type: 'cognitive', payload: ch })))
    await doc.save()
  }

  res.status(201).json({ success: true, session: doc.toJSON() })
}))

// Persist prediction history for analytics
router.post('/predictions', asyncHandler(async (req, res) => {
  const userId = req.user?.id
  const { module_id, prediction } = req.body

  if (!module_id || !prediction) {
    return res.status(400).json({ success: false, message: 'module_id and prediction required' })
  }

  // find latest session for user and module (within last day) to attach prediction
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  let sessionDoc = await LearningSession.findOne({ user_id: userId, module_id, started_at: { $gte: since } }).sort({ started_at: -1 })

  if (!sessionDoc) {
    // create a minimal session doc to hold prediction history
    sessionDoc = await LearningSession.create({ user_id: userId, module_id, session_type: 'study', status: 'completed', started_at: new Date(), ended_at: new Date(), last_updated: new Date() })
  }

  sessionDoc.prediction_history = sessionDoc.prediction_history || []
  sessionDoc.prediction_history.push({ ...prediction, timestamp: new Date() })
  await sessionDoc.save()

  res.json({ success: true, prediction: prediction })
}))

// Dev debug: render raw LearningModule documents in a styled HTML view and log access
router.get('/modules/debug', asyncHandler(async (req, res) => {
  // allow basic query filters for convenience
  const { category = '', difficulty = '', search = '' } = req.query

  const filter = {}
  if (category) filter.category = category
  if (difficulty) filter.difficulty = difficulty
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } }
  ]

  const modules = await LearningModule.find(filter).sort({ difficulty: 1, created_at: 1 })

  // store a debug access log (important things persisted)
  try {
    await LearningDebugLog.create({
      user_id: req.user?.id || null,
      ip: req.ip,
      path: req.originalUrl,
      params: req.query || {},
      user_agent: req.get('User-Agent') || '',
      notes: `Rendered modules debug view (${modules.length} modules)`
    })
  } catch (e) {
    console.warn('Failed to write LearningDebugLog', e)
  }

  // also show recent debug logs so developers can see important persisted info
  const recentLogs = await LearningDebugLog.find({}).sort({ createdAt: -1 }).limit(30)

  // small helper
  const escapeHtml = (str) => {
    if (str === null || str === undefined) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  const moduleRows = modules.map(m => {
    return `
      <div class="module-card">
        <div class="module-header"><strong>${escapeHtml(m.title)}</strong> <span class="muted">(${escapeHtml(m._id)})</span></div>
        <div class="module-meta">${escapeHtml(m.category || '')} • ${escapeHtml(m.difficulty || '')} • ${escapeHtml(m.duration || '')} min</div>
        <div class="module-desc">${escapeHtml(m.description || '')}</div>
        <pre class="module-json">${escapeHtml(JSON.stringify(m.toObject ? m.toObject() : m, null, 2))}</pre>
      </div>
    `
  }).join('\n')

  const logRows = recentLogs.map(l => `
    <tr>
      <td>${escapeHtml(String(l._id))}</td>
      <td>${escapeHtml(String(l.user_id || 'anon'))}</td>
      <td>${escapeHtml(l.ip || '')}</td>
      <td>${escapeHtml(JSON.stringify(l.params || {}))}</td>
      <td>${escapeHtml(l.notes || '')}</td>
      <td>${escapeHtml(new Date(l.createdAt).toLocaleString())}</td>
    </tr>
  `).join('')

  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Learning Modules — Debug</title>
    <style>
      body { font-family: Inter, system-ui, -apple-system, Roboto, 'Segoe UI', Arial; background:#f7fafc; color:#0f172a; padding:20px }
      h1 { margin:0 0 12px 0 }
      .muted { color:#64748b; font-size:12px }
      .module-card { background: white; border-radius:8px; padding:12px; margin-bottom:12px; box-shadow:0 1px 2px rgba(2,6,23,0.06) }
      .module-header { font-size:16px; margin-bottom:6px }
      .module-meta { color:#475569; font-size:13px; margin-bottom:8px }
      .module-desc { margin-bottom:8px }
      .module-json { background:#0f172a; color:#f8fafc; padding:10px; border-radius:6px; overflow:auto; max-height:260px }
      table.logs { width:100%; border-collapse:collapse; margin-top:18px }
      table.logs th, table.logs td { border:1px solid #e2e8f0; padding:8px; text-align:left; font-size:13px }
      .controls { margin-bottom:12px }
      .badge { display:inline-block; background:#e2e8f0; padding:4px 8px; border-radius:999px; font-size:12px; margin-right:6px }
    </style>
  </head>
  <body>
    <h1>Learning Modules — Debug</h1>
    <div class="controls">
      <span class="badge">Modules: ${modules.length}</span>
      <span class="badge">Recent logs: ${recentLogs.length}</span>
    </div>
    <div id="modules-list">
      ${moduleRows}
    </div>

    <h2>Recent Debug Logs</h2>
    <table class="logs">
      <thead>
        <tr><th>id</th><th>user</th><th>ip</th><th>params</th><th>notes</th><th>time</th></tr>
      </thead>
      <tbody>
        ${logRows}
      </tbody>
    </table>
  </body>
  </html>`

  res.set('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
}))

// Get learning recommendations
router.get('/recommendations', asyncHandler(async (req, res) => {
  const userId = req.user.id

  // Get user's learning history and performance
  const historyResult = await query(
    `SELECT 
       ls.module_id,
       lm.title,
       lm.difficulty,
       lm.category,
       AVG(ls.attention_score) as avg_attention,
       AVG(ls.completion_percentage) as avg_completion,
       COUNT(*) as session_count
     FROM learning_sessions ls
     JOIN learning_modules lm ON ls.module_id = lm.id
     WHERE ls.user_id = $1 AND ls.status = 'completed'
     GROUP BY ls.module_id, lm.title, lm.difficulty, lm.category
     ORDER BY AVG(ls.completion_percentage) DESC`,
    [userId]
  )

  // Get modules not yet attempted
  const untriedResult = await query(
    `SELECT id, title, description, difficulty, category, duration
     FROM learning_modules lm
     WHERE lm.active = true
     AND NOT EXISTS (
       SELECT 1 FROM learning_sessions ls 
       WHERE ls.module_id = lm.id AND ls.user_id = $1
     )
     ORDER BY 
       CASE difficulty 
         WHEN 'beginner' THEN 1 
         WHEN 'intermediate' THEN 2 
         WHEN 'advanced' THEN 3 
         ELSE 4 
       END`,
    [userId]
  )

  // Generate recommendations based on performance
  const recommendations = {
    continue_learning: historyResult.rows.filter(m => m.avg_completion < 100).slice(0, 3),
    new_modules: untriedResult.rows.slice(0, 5),
    review_needed: historyResult.rows.filter(m => m.avg_attention < 70).slice(0, 3)
  }

  res.json({
    success: true,
    recommendations
  })
}))

// Submit quiz/assessment
router.post('/assessments', [
  body('module_id').isUUID().withMessage('Valid module ID required'),
  body('answers').isArray().withMessage('Answers array required'),
  body('time_taken').isInt({ min: 1 }).withMessage('Time taken must be positive integer')
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
  const { module_id, answers, time_taken, cognitive_state } = req.body

  // Calculate score (simplified - in real app would compare with correct answers)
  const score = Math.floor(Math.random() * 30) + 70 // Mock score 70-100

  // Save assessment result
  const result = await query(
    `INSERT INTO assessment_results 
     (user_id, module_id, answers, score, time_taken, cognitive_state, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, score`,
    [userId, module_id, JSON.stringify(answers), score, time_taken, JSON.stringify(cognitive_state || {})]
  )

  res.status(201).json({
    success: true,
    message: 'Assessment submitted successfully',
    result: {
      id: result.rows[0].id,
      score: result.rows[0].score,
      time_taken,
      feedback: score >= 80 ? 'Excellent work!' : score >= 70 ? 'Good job!' : 'Keep practicing!'
    }
  })
}))

export default router