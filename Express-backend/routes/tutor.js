import express from 'express'
import tutorService from '../services/tutorService.js'
import { sendPrompt } from '../utils/geminiClient.js'

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

// Composite user-state endpoint for fast frontend hydration
router.get('/user-state', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id || null
    const roadmapId = req.query.roadmap_id || null
    if (!userId) return res.status(400).json({ ok: false, error: 'user_id required' })
    const state = await tutorService.getUserState(userId, roadmapId)
    res.json({ ok: true, data: state })
  } catch (err) {
    console.error('GET /tutor/user-state', err)
    res.status(500).json({ ok: false, error: 'failed to compute user state' })
  }
})

// Get scheduled reviews for a user (questions due)
router.get('/reviews/scheduled', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id
    if (!userId) return res.status(400).json({ ok: false, error: 'user_id required' })
    const items = await tutorService.getScheduledReviews(userId)
    res.json({ ok: true, data: items })
  } catch (err) {
    console.error('GET /tutor/reviews/scheduled', err)
    res.status(500).json({ ok: false, error: 'failed to fetch scheduled reviews' })
  }
})

// Dev-only seeder to create a sample roadmap with chapters and quizzes
router.post('/seed-sample', async (req, res) => {
  try {
    // Very small dev-only seeder
    const sample = {
      title: 'Sample Roadmap: Intro to AI',
      description: 'A short sample roadmap to test the tutor UI',
      chapters: []
    }
    const rd = await tutorService.createRoadmap({ title: sample.title, description: sample.description })
    const ch1 = await tutorService.createChapter({ title: 'Chapter 1: Basics', content: '<p>Intro content</p>', position: 1 })
    const quiz1 = await tutorService.createQuiz({ title: 'Quiz 1', questions: [{ question: 'What is AI?', choices: ['Tool', 'Science', 'Concept'], correctIndex: 2, points: 1 }] })
    ch1.quizzes = [quiz1._id]
    await ch1.save()
    rd.chapters = [ch1._id]
    await rd.save()
    res.json({ ok: true, data: { roadmap: rd, chapter: ch1, quiz: quiz1 } })
  } catch (err) {
    console.error('POST /tutor/seed-sample', err)
    res.status(500).json({ ok: false, error: 'seeding failed' })
  }
})

// Generate an AI roadmap (server-side) and persist
router.post('/generate', async (req, res) => {
  try {
    const { subject = 'Introduction to AI', difficulty = 'beginner', chapters = 5 } = req.body || {}
    // Construct a prompt for the AI to produce a JSON roadmap with chapters and quizzes
    const prompt = `Generate a learning roadmap for subject: "${subject}" with difficulty "${difficulty}" containing ${chapters} chapters. Output ONLY valid JSON with keys: title, description, chapters. Each chapter should be an object with keys: title, content (html), position, quizzes (array). Each quiz should have: title, questions (array of question objects). Each question: question, choices (array), correctIndex (number), points (number). Keep content concise.`

    const out = await sendPrompt({ prompt })
    const jsonMatch = out.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ ok: false, error: 'AI did not return JSON' })
    let parsed
    try { parsed = JSON.parse(jsonMatch[0]) } catch (e) { return res.status(500).json({ ok: false, error: 'Failed to parse AI JSON' }) }

    // Persist roadmap and nested docs
    const rd = await tutorService.createRoadmap({ title: parsed.title || subject, description: parsed.description || '' })
    for (const ch of parsed.chapters || []) {
      const chDoc = await tutorService.createChapter({ title: ch.title, content: ch.content, position: ch.position || 0 })
      const quizIds = []
      for (const q of ch.quizzes || []) {
        const qDoc = await tutorService.createQuiz(q)
        quizIds.push(qDoc._id)
      }
      chDoc.quizzes = quizIds
      await chDoc.save()
      rd.chapters.push(chDoc._id)
    }
    await rd.save()
    res.json({ ok: true, roadmap: rd })
  } catch (err) {
    console.error('POST /tutor/generate failed', err)
    res.status(500).json({ ok: false, error: 'generation failed' })
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
