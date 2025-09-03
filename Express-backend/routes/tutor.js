import express from 'express'
import tutorService from '../services/tutorService.js'
import { sendPrompt } from '../utils/geminiClient.js'
import { parseRoadmapFromText } from '../utils/aiParsing.js'

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

    // Improved prompt: be explicit about JSON and provide a strict schema example to encourage valid JSON output.
    const prompt = `You are an assistant that outputs STRICTLY valid JSON. Produce a learning roadmap for the subject: "${subject}" with difficulty "${difficulty}" containing ${chapters} chapters. Respond with a single JSON object only. Schema example (use same keys): {\n  "title": "...",\n  "description": "...",\n  "chapters": [ { "title": "...", "content": "<p>...</p>", "position": 1, "quizzes": [ { "title": "...", "questions": [ { "question": "...", "choices": ["a","b","c"], "correctIndex": 0, "points": 1 } ] } ] } ]\n}\n
- Use HTML for chapter.content.\n- Keep text concise (1-3 sentences per chapter).\n- DO NOT include any commentary, explanation, or markdown around the JSON.\n`

    // Retry/backoff parameters
    const maxAttempts = Number(process.env.GENERATE_RETRY_ATTEMPTS || 3)
    const baseDelayMs = 500 // initial backoff

    let attempt = 0
    let parsed = null
    let lastRaw = ''
    while (attempt < maxAttempts && !parsed) {
      attempt += 1
      const out = await sendPrompt({ prompt })
      const rawText = out?.text || ''
      lastRaw = rawText
      if ((process.env.NODE_ENV || 'development') === 'development') {
        console.log(`AI /generate raw output (attempt ${attempt}):`, rawText.slice(0, 4000))
      }

      const { parsed: p, error } = parseRoadmapFromText(rawText)
      if (p) {
        parsed = p
        break
      }

      // failed parse -> backoff then retry (with jitter)
      if (attempt < maxAttempts) {
        const jitter = Math.floor(Math.random() * 200)
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter
        if ((process.env.NODE_ENV || 'development') === 'development') {
          console.log(`/generate parse failed (attempt ${attempt}):`, error, 'retrying in', delay, 'ms')
        }
        await new Promise(r => setTimeout(r, delay))
      }
    }

    if (!parsed) {
      return res.status(500).json({ ok: false, error: 'Failed to parse AI JSON after retries', raw: lastRaw.slice(0, 1000) })
    }

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

    // Return under `data.roadmap` to match frontend expectations (tutorAPI.generateRoadmap -> gen.data.roadmap)
    res.json({ ok: true, data: { roadmap: rd } })
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

// Ask AI teacher to teach a chapter (server-side prompt)
router.post('/teach', async (req, res) => {
  try {
    const { roadmap_id, chapter_id, user_context = {} } = req.body || {}
    if (!roadmap_id || !chapter_id) return res.status(400).json({ ok: false, error: 'roadmap_id and chapter_id required' })

    const roadmap = await tutorService.getRoadmap(roadmap_id)
    const chapter = await tutorService.getChapter ? await tutorService.getChapter(chapter_id) : (roadmap && roadmap.chapters ? roadmap.chapters.find(c => (c._id || c.id || c).toString() === chapter_id.toString()) : null)

    if (!roadmap || !chapter) return res.status(404).json({ ok: false, error: 'roadmap or chapter not found' })

    // Build a teacher-style prompt: ask the assistant to teach this chapter,
    // adapt to user_context (knowledge level, recent mistakes) and provide:
    // 1) short explanation, 2) 3 quick examples, 3) 2 practice questions with answers, 4) suggested next steps
    const prompt = `You are an expert teacher. Teach the chapter titled "${chapter.title}" from roadmap "${roadmap.title}". Chapter content: ${chapter.content || chapter.summary || ''}. Adapt your explanation to the following user context: ${JSON.stringify(user_context)}. Provide: a concise explanation (3-5 sentences), three brief worked examples, two practice questions with answers, and suggested next steps. Output only JSON with keys: explanation, examples (array), practice_questions (array of {question, answer}), next_steps (array).`

    const out = await sendPrompt({ prompt, model: 'gemini-pro', systemInstruction: 'You are a helpful teacher.' })
    const rawText = out?.text || ''
    if ((process.env.NODE_ENV || 'development') === 'development') {
      console.log('AI /teach raw output:', rawText.slice(0, 4000))
    }

    // Try to extract JSON with a tolerant extractor
    const extractJson = (text) => {
      if (!text) return null
      const m = text.match(/\{[\s\S]*\}/)
      if (m) return m[0]
      const si = text.indexOf('{')
      const ei = text.lastIndexOf('}')
      if (si !== -1 && ei !== -1 && ei > si) return text.slice(si, ei + 1)
      return null
    }

    let parsed = null
    try {
      const j = extractJson(rawText)
      if (j) parsed = JSON.parse(j)
    } catch (e) {
      // ignore parse error, we'll return raw
    }

    res.json({ ok: true, data: parsed || { raw: rawText } })
  } catch (err) {
    console.error('POST /tutor/teach', err)
    res.status(500).json({ ok: false, error: 'teaching generation failed' })
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
