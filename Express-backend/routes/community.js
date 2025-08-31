import express from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Discussion from '../models/Discussion.js'
import DiscussionLike from '../models/DiscussionLike.js'
import DiscussionReply from '../models/DiscussionReply.js'
import DiscussionReplyLike from '../models/DiscussionReplyLike.js'
import WellnessShare from '../models/WellnessShare.js'
import WellnessShareLike from '../models/WellnessShareLike.js'
import Challenge from '../models/Challenge.js'
import ChallengeParticipant from '../models/ChallengeParticipant.js'
import LearningSession from '../models/LearningSession.js'

const router = express.Router()

// Get community discussions
router.get('/discussions', asyncHandler(async (req, res) => {
  const { category = '', search = '', page = 1, limit = 10 } = req.query
  const userId = req.user?.id

  const match = { active: true }
  if (category) match.category = category
  if (search) match.$or = [
    { title: { $regex: search, $options: 'i' } },
    { content: { $regex: search, $options: 'i' } }
  ]

  const skip = (Number(page) - 1) * Number(limit)
  const pipeline = [
    { $match: match },
    { $sort: { created_at: -1 } },
    { $skip: skip },
    { $limit: Number(limit) },
    { $lookup: { from: 'users', localField: 'author_id', foreignField: '_id', as: 'author' } },
    { $lookup: { from: 'discussionlikes', localField: '_id', foreignField: 'discussion_id', as: 'likesArr' } },
    { $lookup: { from: 'discussionreplies', localField: '_id', foreignField: 'discussion_id', as: 'repliesArr' } },
    { $addFields: {
      author_name: { $ifNull: [{ $arrayElemAt: ['$author.name', 0] }, '' ] },
      author_avatar: { $ifNull: [{ $arrayElemAt: ['$author.avatar', 0] }, '' ] },
      likes: { $size: '$likesArr' },
      replies: { $size: '$repliesArr' },
      user_liked: userId ? { $gt: [ { $size: { $filter: { input: '$likesArr', as: 'l', cond: { $eq: ['$$l.user_id', new mongoose.Types.ObjectId(userId)] } } } }, 0 ] } : false
    } },
    { $project: { author: 0, likesArr: 0, repliesArr: 0 } }
  ]

  const discussions = await Discussion.aggregate(pipeline)
  res.json({
    success: true,
    discussions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      has_more: discussions.length === Number(limit)
    }
  })
}))

// Create new discussion
router.post('/discussions', [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be 5-200 characters'),
  body('content').trim().isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 characters'),
  body('category').isIn(['general', 'study_tips', 'wellness', 'technical', 'feedback']).withMessage('Invalid category')
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
  const { title, content, category, tags } = req.body

  const doc = new Discussion({
    author_id: new mongoose.Types.ObjectId(userId),
    title,
    content,
    category,
    tags: tags || [],
    active: true,
    created_at: new Date()
  })
  await doc.save()

  res.status(201).json({
    success: true,
    message: 'Discussion created successfully',
    discussion: doc.toJSON()
  })
}))

// Like/unlike discussion
router.post('/discussions/:discussionId/like', asyncHandler(async (req, res) => {
  const { discussionId } = req.params
  const userId = req.user.id

  const likeDoc = await DiscussionLike.findOne({ discussion_id: discussionId, user_id: userId })
  if (likeDoc) {
    await DiscussionLike.deleteOne({ _id: likeDoc._id })
    return res.json({ success: true, message: 'Discussion unliked', liked: false })
  }

  await DiscussionLike.create({ discussion_id: discussionId, user_id: userId, created_at: new Date() })
  res.json({ success: true, message: 'Discussion liked', liked: true })
}))

// Add reply to discussion
router.post('/discussions/:discussionId/replies', [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Reply content must be 1-2000 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }

  const { discussionId } = req.params
  const userId = req.user.id
  const { content, parent_reply_id } = req.body

  // Verify discussion exists
  const discussionDoc = await Discussion.findOne({ _id: discussionId, active: true })
  if (!discussionDoc) {
    return res.status(404).json({
      success: false,
      message: 'Discussion not found'
    })
  }

  const reply = await DiscussionReply.create({
    discussion_id: discussionId,
    author_id: userId,
    content,
    parent_reply_id: parent_reply_id || null,
    created_at: new Date()
  })

  res.status(201).json({
    success: true,
    message: 'Reply added successfully',
    reply: reply.toJSON()
  })
}))

// Get discussion replies
router.get('/discussions/:discussionId/replies', asyncHandler(async (req, res) => {
  const { discussionId } = req.params

  const replies = await DiscussionReply.aggregate([
    { $match: { discussion_id: new mongoose.Types.ObjectId(discussionId) } },
    { $lookup: { from: 'users', localField: 'author_id', foreignField: '_id', as: 'author' } },
    { $lookup: { from: 'discussionreplylikes', localField: '_id', foreignField: 'reply_id', as: 'likesArr' } },
    { $addFields: {
      author_name: { $ifNull: [{ $arrayElemAt: ['$author.name', 0] }, '' ] },
      author_avatar: { $ifNull: [{ $arrayElemAt: ['$author.avatar', 0] }, '' ] },
      likes: { $size: '$likesArr' }
    } },
    { $project: { author: 0, likesArr: 0 } },
    { $sort: { created_at: 1 } }
  ])

  res.json({ success: true, replies })
}))

// Get leaderboard
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { time_range = 'month', limit = 10 } = req.query

  const sinceMap = { week: 7, month: 30, quarter: 90 }
  const days = sinceMap[time_range] || 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const pipeline = [
    { $match: { started_at: { $gte: since } } },
    { $group: {
      _id: '$user_id',
      sessions: { $sum: 1 },
      total_time: { $sum: { $cond: [
        { $and: ['$started_at', '$ended_at'] },
        { $divide: [{ $subtract: ['$ended_at', '$started_at'] }, 1000 * 60] },
        0
      ] } },
      avg_attention: { $avg: '$attention_score' },
      avg_completion: { $avg: '$completion_percentage' }
    }},
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    { $match: { 'user.role': { $in: ['student', 'educator'] } } },
    { $addFields: { points: { $add: [ { $multiply: ['$sessions', 10] }, { $multiply: ['$total_time', 0.1] }, { $multiply: ['$avg_attention', 2] } ] } } },
    { $sort: { points: -1 } },
    { $limit: Number(limit) },
    { $project: { id: '$_id', name: '$user.name', avatar: '$user.avatar', sessions: 1, total_time: 1, avg_attention: 1, avg_completion: 1, points: 1, _id: 0 } }
  ]

  const rows = await LearningSession.aggregate(pipeline)
  const leaderboard = rows.map((user, index) => ({ ...user, rank: index + 1, points: Math.round(user.points || 0) }))

  res.json({ success: true, leaderboard, time_range })
}))

// Get wellness sharing board
router.get('/wellness-board', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query

  const posts = await WellnessShare.aggregate([
    { $match: { active: true } },
    { $lookup: { from: 'wellnesssharelikes', localField: '_id', foreignField: 'share_id', as: 'likesArr' } },
    { $addFields: { hearts: { $size: '$likesArr' } } },
    { $project: { likesArr: 0 } },
    { $sort: { created_at: -1 } },
    { $limit: Number(limit) }
  ])

  res.json({ success: true, wellness_posts: posts })
}))

// Create wellness share
router.post('/wellness-board', [
  body('mood_category').isIn(['happy', 'grateful', 'motivated', 'peaceful', 'excited', 'calm']).withMessage('Invalid mood category'),
  body('message').trim().isLength({ min: 1, max: 280 }).withMessage('Message must be 1-280 characters')
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
  const { mood_category, message } = req.body

  const post = await WellnessShare.create({ user_id: userId, mood_category, message, created_at: new Date(), active: true })
  res.status(201).json({ success: true, message: 'Wellness post shared successfully', post: post.toJSON() })
}))

// Get community challenges
router.get('/challenges', asyncHandler(async (req, res) => {
  const userId = req.user.id

  const challenges = await Challenge.aggregate([
    { $match: { active: true, end_date: { $gt: new Date() } } },
    { $lookup: { from: 'challengeparticipants', localField: '_id', foreignField: 'challenge_id', as: 'parts' } },
    { $addFields: {
      participants: { $size: '$parts' },
      user_joined: { $gt: [ { $size: { $filter: { input: '$parts', as: 'p', cond: { $eq: ['$$p.user_id', new mongoose.Types.ObjectId(userId)] } } } }, 0 ] },
      user_progress: { $ifNull: [ { $let: { vars: { m: { $arrayElemAt: [ { $filter: { input: '$parts', as: 'p', cond: { $eq: ['$$p.user_id', new mongoose.Types.ObjectId(userId)] } } }, 0 ] } }, in: '$$m.progress' } }, 0 ] }
    } },
    { $project: { parts: 0 } },
    { $sort: { start_date: -1 } }
  ])

  res.json({ success: true, challenges })
}))

// Join challenge
router.post('/challenges/:challengeId/join', asyncHandler(async (req, res) => {
  const { challengeId } = req.params
  const userId = req.user.id
  // Check if challenge exists and is active
  const challengeDoc = await Challenge.findOne({ _id: challengeId, active: true, end_date: { $gt: new Date() } })
  if (!challengeDoc) {
    return res.status(404).json({
      success: false,
      message: 'Challenge not found or expired'
    })
  }
  // Check if already joined
  const participant = await ChallengeParticipant.findOne({ challenge_id: challengeId, user_id: userId })
  if (participant) {
    return res.status(400).json({
      success: false,
      message: 'Already joined this challenge'
    })
  }
  // Join challenge
  await ChallengeParticipant.create({ challenge_id: challengeId, user_id: userId, joined_at: new Date(), progress: 0 })
  res.json({ success: true, message: 'Successfully joined challenge' })
}))

export default router