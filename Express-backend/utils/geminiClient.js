import { GoogleGenerativeAI } from '@google/generative-ai'

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
  activeCount += 1
}

function releaseSlot() {
  activeCount = Math.max(0, activeCount - 1)
  lastCallAt = Date.now()
  const next = waitQueue.shift()
  if (next) {
    const delay = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastCallAt))
    setTimeout(() => next(), delay)
  }
}

function getGeminiClient() {
  const apiKey = process.env.BACKEND_GEMINI_API_KEY
  if (!apiKey) {
    const err = new Error('Missing BACKEND_GEMINI_API_KEY in environment')
    err.status = 500
    throw err
  }
  try {
    return new GoogleGenerativeAI(apiKey)
  } catch (e) {
    const err = new Error('Failed to initialize Gemini client')
    err.status = 500
    throw err
  }
}

async function sendPrompt({ prompt, model = 'gemini-1.5-flash', systemInstruction = '', generationConfig = {} }) {
  await acquireSlot()
  try {
    const client = getGeminiClient()
    const genModel = client.getGenerativeModel({ model, systemInstruction })
    const result = await genModel.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig })
    const text = result?.response?.text?.() || ''
    return { text }
  } catch (e) {
    throw e
  } finally {
    releaseSlot()
  }
}

export { sendPrompt, getGeminiClient }
