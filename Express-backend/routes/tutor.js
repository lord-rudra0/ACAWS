import express from 'express'
import tutorService from '../services/tutorService.js'

const router = express.Router()

// List roadmaps
router.get('/roadmaps', async (req, res) => {
  try {
    const items = await tutorService.listRoadmaps()
    res.json({ ok: true, data: items })
  } catch (err) {
    console.error('GET /tutor/roadmaps', err)
    res.status(500).json({ ok: false, error: 'failed to list roadmaps' })
  }
})

// Get single roadmap
router.get('/roadmaps/:id', async (req, res) => {
  try {
    const item = await tutorService.getRoadmap(req.params.id)
    if (!item) return res.status(404).json({ ok: false, error: 'not found' })
    res.json({ ok: true, data: item })
  } catch (err) {
    console.error('GET /tutor/roadmaps/:id', err)
    res.status(500).json({ ok: false, error: 'failed to fetch roadmap' })
  }
})

// Get user progress for roadmap
router.get('/roadmaps/:id/progress', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id || null
    if (!userId) return res.status(400).json({ ok: false, error: 'user_id required' })
    const data = await tutorService.getUserProgress(userId, req.params.id)
    res.json({ ok: true, data })
  } catch (err) {
    console.error('GET /tutor/roadmaps/:id/progress', err)
    res.status(500).json({ ok: false, error: 'failed to fetch progress' })
  }
})

// Recommend next chapter for user in roadmap
router.get('/roadmaps/:id/recommend', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id || null
    if (!userId) return res.status(400).json({ ok: false, error: 'user_id required' })
    const ch = await tutorService.recommendNextChapter(userId, req.params.id)
    res.json({ ok: true, data: ch })
  } catch (err) {
    console.error('GET /tutor/roadmaps/:id/recommend', err)
    res.status(500).json({ ok: false, error: 'failed to compute recommendation' })
  }
})

// Create roadmap
router.post('/roadmaps', async (req, res) => {
  try {
    const rd = await tutorService.createRoadmap(req.body)
    res.status(201).json({ ok: true, data: rd })
  } catch (err) {
    console.error('POST /tutor/roadmaps', err)
    res.status(500).json({ ok: false, error: 'failed to create roadmap' })
  }
})

// Create chapter
router.post('/chapters', async (req, res) => {
  try {
    const ch = await tutorService.createChapter(req.body)
    res.status(201).json({ ok: true, data: ch })
  } catch (err) {
    console.error('POST /tutor/chapters', err)
    res.status(500).json({ ok: false, error: 'failed to create chapter' })
  }
})

// Create quiz
router.post('/quizzes', async (req, res) => {
  try {
    const q = await tutorService.createQuiz(req.body)
    res.status(201).json({ ok: true, data: q })
  } catch (err) {
    console.error('POST /tutor/quizzes', err)
    res.status(500).json({ ok: false, error: 'failed to create quiz' })
  }
})

// Submit quiz result
router.post('/quizzes/:quizId/submit', async (req, res) => {
  try {
    const userId = req.user?.id || req.body.user_id || 'anonymous'
    const quizId = req.params.quizId
    const payload = { quiz_id: quizId, answers: req.body.answers || [], score: req.body.score || 0 }
    const saved = await tutorService.submitQuizResult(userId, payload)
    res.status(201).json({ ok: true, data: saved })
  } catch (err) {
    console.error('POST /tutor/quizzes/:quizId/submit', err)
    res.status(500).json({ ok: false, error: 'failed to submit quiz result' })
  }
})

// Get user's history for a quiz
router.get('/quizzes/:quizId/history', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id || 'anonymous'
    const quizId = req.params.quizId
    const items = await tutorService.getUserQuizHistory(userId, quizId)
    res.json({ ok: true, data: items })
  } catch (err) {
    console.error('GET /tutor/quizzes/:quizId/history', err)
    res.status(500).json({ ok: false, error: 'failed to fetch history' })
  }
})

export default router
