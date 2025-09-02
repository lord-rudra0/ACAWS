import express from 'express'
import fs from 'fs'
import path from 'path'
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
  try {
    const client = new GoogleGenerativeAI(apiKey)
    console.log('✅ [Gemini] Connected to Gemini (backend)')
    return client
  } catch (e) {
    console.error('❌ [Gemini] Failed to initialize Gemini client', e)
    const err = new Error('Failed to initialize Gemini client')
    err.status = 500
    throw err
  }
}

// Normalize Gemini SDK errors, especially 429 quota errors
function handleGeminiError(res, error) {
  const message = `[GoogleGenerativeAI Error]: ${error?.message || 'Unknown error'}`
  // Try to detect 429 and extract retry delay if present in the message
  const msg = String(error?.message || '')
  const is429 = msg.includes('429') || error?.status === 429
  let retryAfterSeconds = undefined
  // Parse retryDelay like "retryDelay":"51s"
  const retryMatch = msg.match(/retryDelay"?:"?(\d+)s"?/i)
  if (retryMatch) {
    retryAfterSeconds = parseInt(retryMatch[1], 10)
  }

  // Also support explicit field on error (some SDKs may provide it)
  if (!retryAfterSeconds && error?.retryAfterSeconds) retryAfterSeconds = Number(error.retryAfterSeconds)

  if (is429) {
    // Prefer to set Retry-After header in seconds when available
    if (retryAfterSeconds) {
      try { res.set('Retry-After', String(retryAfterSeconds)) } catch (e) {}
    }
    console.warn('[Gemini] 429 rate limit returned. Suggest Retry-After:', retryAfterSeconds)
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

  // POST /api/ai/gemini-vision-json
  // Body: { imageData: dataURL|string(base64), context?: object, model?: string, generationConfig?: object }
  // Returns parsed JSON: { attention: number, cognitive_load: number, engagement: number, emotional_state: string }
  router.post('/gemini-vision-json', asyncHandler(async (req, res) => {
    const { imageData, context = {}, model = 'gemini-1.5-flash', generationConfig = {} } = req.body || {}

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({ success: false, message: 'imageData (base64 or data URL) is required' })
    }

    try {
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData

      await acquireSlot()
      const genAI = getGeminiClient()
      const visionModel = genAI.getGenerativeModel({ model })

      // Strict instruction: return ONLY a JSON object with the four keys. Provide an example.
      const strictInstruction = `Analyze the face in the provided image and RETURN ONLY valid JSON with exactly these keys: attention (number 0-100), cognitive_load (number 0-100), engagement (number 0-100), emotional_state (one of \"happy\",\"neutral\",\"sad\",\"angry\",\"surprised\",\"fearful\"). Do NOT include any explanatory text. Example response: {"attention":72,"cognitive_load":33,"engagement":64,"emotional_state":"neutral"}`

      const userPrompt = [
        `${strictInstruction}\n\nContext: ${JSON.stringify(context)}`
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

      // Try to extract first JSON object from the text
      const jsonMatch = text.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          // Basic validation of expected keys
          const ok = parsed && typeof parsed.attention === 'number' && typeof parsed.cognitive_load === 'number' && typeof parsed.engagement === 'number' && typeof parsed.emotional_state === 'string'
          if (ok) {
            return res.json({ success: true, parsed, raw: text })
          }
          // If validation fails, still return parsed and raw for inspection
          return res.json({ success: true, parsed, raw: text, warning: 'Parsed JSON did not fully validate expected types' })
        } catch (e) {
          // fall through to return raw
          return res.json({ success: true, parsed: null, raw: text, warning: 'Failed to parse JSON' })
        }
      }

      // No JSON found in response
      return res.json({ success: true, parsed: null, raw: text, warning: 'No JSON object found in Gemini response' })
    } catch (error) {
      return handleGeminiError(res, error)
    } finally {
      releaseSlot()
    }
  }))

// Admin: fetch latest auto-run result
// GET /api/ai/gemini-auto/latest
router.get('/gemini-auto/latest', asyncHandler(async (req, res) => {
  try {
    const files = await fs.promises.readdir(DECODED_GLOB_DIR)
    const candidates = files.filter(f => f.startsWith('gemini_auto_result_') && f.endsWith('.json'))
    if (!candidates.length) return res.status(404).json({ success: false, message: 'No auto results found' })
    const statsPromises = candidates.map(async (f) => {
      const p = path.join(DECODED_GLOB_DIR, f)
      const s = await fs.promises.stat(p)
      return { file: p, mtime: s.mtimeMs }
    })
    const stats = await Promise.all(statsPromises)
    stats.sort((a, b) => b.mtime - a.mtime)
    const latestPath = stats[0].file
    const content = await fs.promises.readFile(latestPath, 'utf8')
    const parsed = JSON.parse(content)
    return res.json({ success: true, path: latestPath, result: parsed })
  } catch (e) {
    console.error('[AutoGemini] Failed to read latest result', e)
    return res.status(500).json({ success: false, message: 'Failed to read latest result' })
  }
}))

// Admin: trigger immediate auto-capture run (server-side)
// POST /api/ai/gemini-auto/run
router.post('/gemini-auto/run', asyncHandler(async (req, res) => {
  try {
    const latest = await findLatestDecodedImage()
    if (!latest) return res.status(404).json({ success: false, message: 'No decoded images available to send' })
    console.log('[AutoGemini] Manual run triggered via API. Sending:', latest)
    const out = await sendImageFileToGemini(latest)
    if (!out) return res.status(500).json({ success: false, message: 'Failed to get a response from Gemini' })
    return res.json({ success: true, result: out })
  } catch (e) {
    console.error('[AutoGemini] Manual run failed', e)
    return res.status(500).json({ success: false, message: 'Manual run failed' })
  }
}))

// Public: frontend can POST current captured frame here and receive parsed JSON from Gemini
// POST /api/ai/gemini-auto/submit
// Body: { imageData: dataURL|string(base64), context?: object }
router.post('/gemini-auto/submit', asyncHandler(async (req, res) => {
  const { imageData, context = {} } = req.body || {}
  if (!imageData || typeof imageData !== 'string') return res.status(400).json({ success: false, message: 'imageData is required' })
  try {
    const out = await sendImageDataToGemini(imageData, context)
    if (!out) return res.status(500).json({ success: false, message: 'Failed to get response from Gemini' })
    return res.json({ success: true, result: out })
  } catch (e) {
    console.error('[AutoGemini] Submit failed', e)
    return res.status(500).json({ success: false, message: 'Submit failed' })
  }
}))

// Debug echo endpoint for connectivity checks
router.post('/debug/echo', asyncHandler(async (req, res) => {
  const payload = req.body || {}
  console.log('[DebugEcho] received payload keys:', Object.keys(payload))
  return res.json({ success: true, echoed: payload, timestamp: Date.now() })
}))

export default router

// -------------------------
// Background auto-capture -> Gemini sender
// -------------------------
// Support either BACKEND_GEMINI_AUTO_CAPTURE (legacy) or BACKEND_GEMINI_AUTO_CAPTURE_ENABLED
const AUTO_ENV = process.env.BACKEND_GEMINI_AUTO_CAPTURE_ENABLED ?? process.env.BACKEND_GEMINI_AUTO_CAPTURE ?? 'false'
const AUTO_ENABLED = String(AUTO_ENV).toLowerCase() === 'true'
const AUTO_INTERVAL_MIN = Number(process.env.BACKEND_GEMINI_AUTO_CAPTURE_INTERVAL_MIN || 5)
const DECODED_GLOB_DIR = process.env.BACKEND_DECODED_DIR || '/tmp'

async function findLatestDecodedImage() {
  try {
    const files = await fs.promises.readdir(DECODED_GLOB_DIR)
    const candidates = files.filter(f => f.startsWith('enhanced_decoded_') && f.endsWith('.jpg'))
    if (!candidates.length) return null
    // choose latest by mtime
    const statsPromises = candidates.map(async (f) => {
      const p = path.join(DECODED_GLOB_DIR, f)
      const s = await fs.promises.stat(p)
      return { file: p, mtime: s.mtimeMs }
    })
    const stats = await Promise.all(statsPromises)
    stats.sort((a, b) => b.mtime - a.mtime)
    return stats[0].file
  } catch (e) {
    console.error('[AutoGemini] Failed to list decoded images', e)
    return null
  }
}

async function sendImageFileToGemini(filePath) {
  try {
    const buf = await fs.promises.readFile(filePath)
    const base64 = buf.toString('base64')

    await acquireSlot()
    const genAI = getGeminiClient()
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const strictInstruction = `Analyze the face in the provided image and RETURN ONLY valid JSON with exactly these keys: attention (number 0-100), cognitive_load (number 0-100), engagement (number 0-100), emotional_state (one of "happy","neutral","sad","angry","surprised","fearful"). Do NOT include any explanatory text. Example response: {"attention":72,"cognitive_load":33,"engagement":64,"emotional_state":"neutral"}`

    const userPrompt = [ `${strictInstruction}\n\nContext: {"source":"auto-server"}` ]

    const parts = [
      { text: userPrompt.join('\n') },
      { inlineData: { data: base64, mimeType: 'image/jpeg' } }
    ]

    const result = await visionModel.generateContent({ contents: [{ role: 'user', parts }], generationConfig: {} })
    const responseText = result?.response?.text?.() || ''

    // Try to parse JSON
    let parsed = null
    let warning = null
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (e) {
        warning = 'Failed to parse JSON'
      }
    } else {
      warning = 'No JSON found in Gemini reply'
    }

    const out = { timestamp: Date.now(), file: filePath, parsed, raw: responseText, warning }
    const outPath = path.join(DECODED_GLOB_DIR, `gemini_auto_result_${Date.now()}.json`)
    await fs.promises.writeFile(outPath, JSON.stringify(out, null, 2))
    console.log('[AutoGemini] Saved result to', outPath)
    return out
  } catch (e) {
    console.error('[AutoGemini] Error sending image to Gemini', e)
    return null
  } finally {
    releaseSlot()
  }
}

// Send raw base64 image data (no file) to Gemini and save result similarly
async function sendImageDataToGemini(imageBase64, context = {}) {
  try {
    const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64

    await acquireSlot()
    const genAI = getGeminiClient()
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const strictInstruction = `Analyze the face in the provided image and RETURN ONLY valid JSON with exactly these keys: attention (number 0-100), cognitive_load (number 0-100), engagement (number 0-100), emotional_state (one of "happy","neutral","sad","angry","surprised","fearful"). Do NOT include any explanatory text. Example response: {"attention":72,"cognitive_load":33,"engagement":64,"emotional_state":"neutral"}`

    const userPrompt = [ `${strictInstruction}\n\nContext: ${JSON.stringify(context)}` ]

    const parts = [
      { text: userPrompt.join('\n') },
      { inlineData: { data: base64, mimeType: 'image/jpeg' } }
    ]

    const result = await visionModel.generateContent({ contents: [{ role: 'user', parts }], generationConfig: {} })
    const responseText = result?.response?.text?.() || ''

    // Try to parse JSON
    let parsed = null
    let warning = null
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (e) {
        warning = 'Failed to parse JSON'
      }
    } else {
      warning = 'No JSON found in Gemini reply'
    }

    const out = { timestamp: Date.now(), parsed, raw: responseText, warning }
    // Save result for audit
    try {
      const outPath = path.join(DECODED_GLOB_DIR, `gemini_auto_result_${Date.now()}.json`)
      await fs.promises.writeFile(outPath, JSON.stringify({ ...out, context }, null, 2))
      console.log('[AutoGemini] Saved result to', outPath)
    } catch (e) {
      console.warn('[AutoGemini] Failed to persist result file', e)
    }

    return out
  } catch (e) {
    console.error('[AutoGemini] Error sending image data to Gemini', e)
    return null
  } finally {
    releaseSlot()
  }
}

async function runAutoCaptureCycle() {
  try {
    const latest = await findLatestDecodedImage()
    if (!latest) {
      console.log('[AutoGemini] No decoded images found')
      return
    }
    console.log('[AutoGemini] Found latest image:', latest)
    await sendImageFileToGemini(latest)
  } catch (e) {
    console.error('[AutoGemini] Cycle failed', e)
  }
}

// Kick off background scheduler if enabled
if (AUTO_ENABLED) {
  console.log(`[AutoGemini] Enabled (env=${AUTO_ENV}). Interval: ${AUTO_INTERVAL_MIN} minute(s). Watching ${DECODED_GLOB_DIR}`)
  // Run immediately then schedule
  runAutoCaptureCycle().catch(() => {})
  setInterval(() => runAutoCaptureCycle().catch(() => {}), Math.max(1, AUTO_INTERVAL_MIN) * 60 * 1000)
} else {
  console.log('[AutoGemini] Disabled. Set BACKEND_GEMINI_AUTO_CAPTURE=true or BACKEND_GEMINI_AUTO_CAPTURE_ENABLED=true to enable.')
}
