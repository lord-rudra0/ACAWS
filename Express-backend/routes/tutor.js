import express from 'express'
import { body, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler.js'
import tutorService from '../services/tutorService.js'

const router = express.Router()

// Get available roadmaps
router.get('/roadmaps', asyncHandler(async (req, res) => {
  const maps = await tutorService.getRoadmaps()
  res.json({ success: true, roadmaps: maps })
}))

// Get chapter content
router.get('/chapters/:id', asyncHandler(async (req, res) => {
  const { id } = req.params
  const chapter = await tutorService.getChapter(id)
  if (!chapter) return res.status(404).json({ success: false, message: 'Chapter not found' })
  res.json({ success: true, chapter })
}))

// Submit quiz
router.post('/quizzes/:id/submit', [
  body('answers').isArray().withMessage('Answers array required'),
  body('timeTaken').optional().isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

  const userId = req.user?.id
  const { id } = req.params
  const { answers, timeTaken = 0, moduleId } = req.body

  const { result, suggestion } = await tutorService.submitQuiz(userId, id, answers, timeTaken, moduleId)
  res.json({ success: true, result, suggestion })
}))

// Get user progress
router.get('/progress', asyncHandler(async (req, res) => {
  const userId = req.user?.id
  const progress = await tutorService.getUserProgress(userId)
  res.json({ success: true, progress })
}))

export default router
