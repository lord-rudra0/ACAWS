import express from 'express'

// Config
const PY_API_BASE = process.env.PYTHON_API_URL || 'http://localhost:5000'

const router = express.Router()

// Helper: extract token from x-auth-token, Authorization header, or cookie
function extractToken(req) {
  // Highest priority: custom header from frontend when proxying
  const xToken = req.headers['x-auth-token']
  if (xToken && typeof xToken === 'string' && xToken.trim().length > 0) {
    return xToken.trim()
  }
  // Prefer Authorization header if present
  const authHeader = req.headers['authorization']
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  // Try cookies without extra deps
  const cookieHeader = req.headers['cookie'] || ''
  const parts = cookieHeader.split(';').map(p => p.trim())
  const tokenPair = parts.find(p => p.startsWith('token='))
  if (tokenPair) return decodeURIComponent(tokenPair.split('=')[1])
  return null
}

async function forwardJson(req, res, targetPath) {
  try {
    const token = extractToken(req)
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const resp = await fetch(`${PY_API_BASE}${targetPath}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body || {})
    })

    const text = await resp.text()
    let json
    try { json = JSON.parse(text) } catch { json = { success: false, detail: text } }

    return res.status(resp.status).json(json)
  } catch (err) {
    console.error('Python proxy error:', err)
    return res.status(502).json({ success: false, error: 'Bad Gateway', detail: String(err) })
  }
}

// Emotion analyze -> /api/emotion/analyze
router.post('/emotion/analyze', async (req, res) => {
  return forwardJson(req, res, '/api/emotion/analyze')
})

// Attention track -> /api/attention/track
router.post('/attention/track', async (req, res) => {
  return forwardJson(req, res, '/api/attention/track')
})

export default router
