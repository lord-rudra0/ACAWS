import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = express.Router()

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

// POST /api/ai/gemini
// Body: { prompt: string, model?: string, generationConfig?: object, systemInstruction?: string }
router.post('/gemini', asyncHandler(async (req, res) => {
  const { prompt, model = 'gemini-1.5-flash', generationConfig = {}, systemInstruction } = req.body || {}

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, message: 'prompt is required' })
  }

  const genAI = getGeminiClient()
  const genModel = genAI.getGenerativeModel({ model, systemInstruction })

  const result = await genModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }]}],
    generationConfig
  })

  const response = result?.response
  const text = response?.text?.() || ''
  return res.json({ success: true, model, output: text })
}))

export default router
