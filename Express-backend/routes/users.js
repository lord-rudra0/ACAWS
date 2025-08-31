import express from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireRole } from '../middleware/auth.js'
import mongoose from 'mongoose'
import User from '../models/User.js'
import LearningSession from '../models/LearningSession.js'
import UserModuleProgress from '../models/UserModuleProgress.js'
import AssessmentResult from '../models/AssessmentResult.js'
import WellnessEntry from '../models/WellnessEntry.js'

const router = express.Router()

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const userId = req.user.id

  const userDoc = await User.findById(userId).select('name email role institution bio avatar preferences created_at last_login')
  if (!userDoc) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  const user = userDoc.toJSON()

  res.json({
    success: true,
    user: {
      ...user,
      preferences: user.preferences || {}
    }
  })
}))

// Update user profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('institution').optional().trim()
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
  const { name, bio, institution, avatar } = req.body

  const userDoc = await User.findByIdAndUpdate(
    userId,
    {
      ...(name !== undefined ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(institution !== undefined ? { institution } : {}),
      ...(avatar !== undefined ? { avatar } : {}),
    },
    { new: true }
  ).select('id name email role institution bio avatar')

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: userDoc?.toJSON()
  })
}))

// Update user preferences
router.put('/preferences', asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { preferences } = req.body

  const userDoc = await User.findByIdAndUpdate(
    userId,
    { preferences: preferences || {} },
    { new: true }
  ).select('preferences')

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    preferences: userDoc?.preferences || {}
  })
}))

// Get user learning statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const userId = req.user.id

  // Learning sessions aggregate
  const sessionsAgg = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    { $group: {
        _id: null,
        total_sessions: { $sum: 1 },
        total_time_minutes: { $sum: { $cond: [
          { $and: ['$started_at', '$ended_at'] },
          { $divide: [{ $subtract: ['$ended_at', '$started_at'] }, 1000 * 60] },
          0
        ] } },
        avg_attention: { $avg: '$attention_score' },
        avg_wellness: { $avg: '$wellness_score' }
    }}
  ])

  const completedModules = await UserModuleProgress.countDocuments({ user_id: new mongoose.Types.ObjectId(userId), completion_percentage: 100 })

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const perfAgg = await AssessmentResult.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since } } },
    { $group: { _id: null, avg_score: { $avg: '$score' }, total_assessments: { $sum: 1 } } }
  ])

  const s = sessionsAgg[0] || {}
  const p = perfAgg[0] || {}
  const stats = {
    learning: {
      total_sessions: s.total_sessions || 0,
      total_time_minutes: Math.round(s.total_time_minutes || 0),
      average_attention: s.avg_attention || 0,
      completed_modules: completedModules || 0
    },
    wellness: {
      average_wellness_score: s.avg_wellness || 0
    },
    performance: {
      average_score: p.avg_score || 0,
      total_assessments: p.total_assessments || 0
    }
  }

  res.json({
    success: true,
    stats
  })
}))

// Get all users (admin only)
router.get('/all', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', role = '' } = req.query

  const queryObj = {}
  if (role) queryObj.role = role
  if (search) queryObj.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } }
  ]

  const skip = (Number(page) - 1) * Number(limit)

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: queryObj },
      { $sort: { created_at: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      { $lookup: { from: 'learningsessions', localField: '_id', foreignField: 'user_id', as: 'sessions' } },
      { $addFields: { session_count: { $size: '$sessions' } } },
      { $project: { password: 0, sessions: 0 } }
    ]),
    User.countDocuments(queryObj)
  ])

  res.json({
    success: true,
    users,
    pagination: {
      current_page: Number(page),
      total_pages: Math.ceil(total / Number(limit)),
      total_users: total,
      limit: Number(limit)
    }
  })
}))

// Update user role (admin only)
router.put('/:userId/role', requireRole(['admin']), [
  body('role').isIn(['student', 'educator', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { userId } = req.params
  const { role } = req.body

  const userDoc = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('id name email role')

  if (!userDoc) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  res.json({
    success: true,
    message: 'User role updated successfully',
    user: userDoc.toJSON()
  })
}))

// Delete user (admin only)
router.delete('/:userId', requireRole(['admin']), asyncHandler(async (req, res) => {
  const { userId } = req.params

  const userDoc = await User.findById(userId)
  if (!userDoc) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    })
  }

  // Delete user (consider cascading in future if needed)
  await User.deleteOne({ _id: userId })

  res.json({
    success: true,
    message: 'User deleted successfully'
  })
}))

// Get user activity summary
router.get('/:userId/activity', requireRole(['admin', 'educator']), asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { days = 7 } = req.query

  const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000)

  const learningAgg = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: since } } },
    { $project: {
        date: { $dateToString: { format: '%Y-%m-%d', date: '$started_at' } },
        duration: { $cond: [ { $and: ['$started_at', '$ended_at'] }, { $divide: [{ $subtract: ['$ended_at', '$started_at'] }, 1000 * 60] }, 0 ] },
        attention_score: 1,
        wellness_score: 1
    }},
    { $group: {
        _id: '$date',
        sessions: { $sum: 1 },
        avg_duration: { $avg: '$duration' },
        avg_attention: { $avg: '$attention_score' },
        avg_wellness: { $avg: '$wellness_score' }
    }},
    { $project: { _id: 0, date: '$_id', sessions: 1, avg_duration: 1, avg_attention: 1, avg_wellness: 1 } },
    { $sort: { date: -1 } }
  ])

  const wellnessAgg = await WellnessEntry.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since } } },
    { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } }, mood_score: 1, stress_level: 1, energy_level: 1 } },
    { $group: { _id: '$date', avg_mood: { $avg: '$mood_score' }, avg_stress: { $avg: '$stress_level' }, avg_energy: { $avg: '$energy_level' } } },
    { $project: { _id: 0, date: '$_id', avg_mood: 1, avg_stress: 1, avg_energy: 1 } },
    { $sort: { date: -1 } }
  ])

  res.json({
    success: true,
    activity: {
      learning_sessions: learningAgg,
      wellness_trends: wellnessAgg,
      summary: {
        total_days: Number(days),
        data_points: learningAgg.length
      }
    }
  })
}))

export default router