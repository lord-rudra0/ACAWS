import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = express.Router()

// Simple in-memory concurrency + pacing limiter
const MAX_CONCURRENT = Number(process.env.GEMINI_MAX_CONCURRENT || 1)
const MIN_INTERVAL_MS = Number(process.env.GEMINI_MIN_INTERVAL_MS || 1200)
let activeCount = 0
let lastCallAt = 0
const waitQueue = []

async function acquireSlot() {
  const canRun = () => activeCount < MAX_CONCURRENT && (Date.now() - lastCallAt) >= MIN_INTERVAL_MS
  if (canRun()) {
    activeCount += 1
    return
  }
  await new Promise(resolve => waitQueue.push(resolve))
  // Woken up: take slot
  activeCount += 1
}

function releaseSlot() {
  activeCount = Math.max(0, activeCount - 1)
  lastCallAt = Date.now()
  // Wake next waiter after respecting pacing window
  const next = waitQueue.shift()
  if (next) {
    const delay = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt))
    setTimeout(() => next(), delay)
  }
}

function getGeminiClient() {
  const apiKey = process.env.BACKEND_GEMINI_API_KEY
  if (!apiKey) {
    const hint = 'Missing BACKEND_GEMINI_API_KEY. Add it to Express-backend/.env'
    const err = new Error(hint)
    err.status = 500
    throw err
  }
  return new GoogleGenerativeAI(apiKey)
}

// Normalize Gemini SDK errors, especially 429 quota errors
function handleGeminiError(res, error) {
  const message = `[GoogleGenerativeAI Error]: ${error?.message || 'Unknown error'}`
  // Try to detect 429 and extract retry delay if present in the message
  const msg = String(error?.message || '')
  const is429 = msg.includes('429') || error?.status === 429
  let retryAfterSeconds = undefined
  // Parse retryDelay like "retryDelay":"51s"
  const retryMatch = msg.match(/retryDelay\"?:\"?(\d+)s\"?/i)
  if (retryMatch) {
    retryAfterSeconds = parseInt(retryMatch[1], 10)
  }

  if (is429) {
    if (retryAfterSeconds) {
      res.set('Retry-After', String(retryAfterSeconds))
    }
    return res.status(429).json({ success: false, message, retryAfterSeconds })
  }

  // Default internal error
  return res.status(500).json({ success: false, message })
}

// POST /api/ai/gemini
// Body: { prompt: string, model?: string, generationConfig?: object, systemInstruction?: string }
router.post('/gemini', asyncHandler(async (req, res) => {
  const { prompt, model = 'gemini-1.5-flash', generationConfig = {}, systemInstruction } = req.body || {}

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, message: 'prompt is required' })
  }

  try {
    await acquireSlot()
    const genAI = getGeminiClient()
    const genModel = genAI.getGenerativeModel({ model, systemInstruction })

    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }]}],
      generationConfig
    })

    const response = result?.response
    const text = response?.text?.() || ''
    return res.json({ success: true, model, output: text })
  } catch (error) {
    return handleGeminiError(res, error)
  } finally {
    releaseSlot()
  }
}))

// POST /api/ai/gemini-vision
// Body: { imageData: dataURL|string(base64), prompt?: string, context?: object, model?: string, generationConfig?: object }
router.post('/gemini-vision', asyncHandler(async (req, res) => {
  const { imageData, prompt = 'Analyze the educational content in this image.', context = {}, model = 'gemini-1.5-flash', generationConfig = {} } = req.body || {}

  if (!imageData || typeof imageData !== 'string') {
    return res.status(400).json({ success: false, message: 'imageData (base64 or data URL) is required' })
  }

  try {
    // Support data URL or raw base64
    const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData

    await acquireSlot()
    const genAI = getGeminiClient()
    const visionModel = genAI.getGenerativeModel({ model })

    const userPrompt = [
      `${prompt}\n\nContext: ${JSON.stringify(context)}`
    ]

    const parts = [
      { text: userPrompt.join('\n') },
      {
        inlineData: {
          data: base64,
          mimeType: 'image/jpeg'
        }
      }
    ]

    const result = await visionModel.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig
    })

    const response = result?.response
    const text = response?.text?.() || ''
    return res.json({ success: true, model, output: text })
  } catch (error) {
    return handleGeminiError(res, error)
  } finally {
    releaseSlot()
  }
}))

export default router
