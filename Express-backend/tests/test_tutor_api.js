import fetch from 'node-fetch'
import dotenv from 'dotenv'
dotenv.config({ path: new URL('../.env', import.meta.url).pathname })

const BASE = process.env.API_BASE || 'http://localhost:3001'
const AUTH = process.env.TEST_AUTH_TOKEN || process.env.AUTH_TOKEN || ''

async function call(path, opts = {}) {
  opts.headers = opts.headers || {}
  if (AUTH) opts.headers['authorization'] = `Bearer ${AUTH}`
  const res = await fetch(BASE + path, opts)
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch(e) { json = text }
  return { status: res.status, body: json }
}

async function run() {
  console.log('GET /api/tutor/roadmaps')
  console.log(await call('/api/tutor/roadmaps'))

  // attempt to fetch first roadmap and open its first chapter
  const rm = await call('/api/tutor/roadmaps')
  if (rm.status === 200 && Array.isArray(rm.body) && rm.body.length > 0) {
    const first = rm.body[0]
    const chapterId = first.chapters && first.chapters[0]
    if (chapterId) {
      console.log('GET /api/tutor/chapters/' + chapterId)
      console.log(await call('/api/tutor/chapters/' + chapterId))
    }
  }

  console.log('GET /api/tutor/progress')
  console.log(await call('/api/tutor/progress'))
}

run().catch(e => { console.error(e); process.exit(1) })
