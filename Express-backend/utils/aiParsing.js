// Lightweight AI output parsing and roadmap validation helpers
export function tryExtractJson(text) {
  if (!text) return null
  const firstMatch = text.match(/\{[\s\S]*\}/)
  if (firstMatch) return firstMatch[0]
  const startIdx = text.indexOf('{')
  const endIdx = text.lastIndexOf('}')
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) return text.slice(startIdx, endIdx + 1)
  return null
}

export function sanitizeJson(text) {
  if (!text) return text
  let san = text
  // remove common trailing commas
  san = san.replace(/,\s*([}\]])/g, '$1')
  // convert single-quoted strings to double where safe (naive)
  san = san.replace(/\'([^']*)\'/g, '"$1"')
  return san
}

export function validateRoadmap(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (!obj.title || typeof obj.title !== 'string') return false
  if (!('chapters' in obj) || !Array.isArray(obj.chapters)) return false
  // Basic check for chapters structure
  for (const ch of obj.chapters) {
    if (!ch || typeof ch !== 'object') return false
    if (!ch.title || typeof ch.title !== 'string') return false
    if (!('quizzes' in ch) || !Array.isArray(ch.quizzes)) return false
    for (const q of ch.quizzes) {
      if (!q || typeof q !== 'object') return false
      if (!q.title || typeof q.title !== 'string') return false
      if (!Array.isArray(q.questions)) return false
      for (const ques of q.questions) {
        if (!ques || typeof ques !== 'object') return false
        if (!ques.question || typeof ques.question !== 'string') return false
        if (!Array.isArray(ques.choices)) return false
        if (typeof ques.correctIndex !== 'number') return false
      }
    }
  }
  return true
}

export function parseRoadmapFromText(text) {
  const extracted = tryExtractJson(text)
  if (!extracted) return { parsed: null, error: 'no-json' }
  try {
    const parsed = JSON.parse(extracted)
    if (!validateRoadmap(parsed)) return { parsed: null, error: 'invalid-schema' }
    return { parsed, error: null }
  } catch (e) {
    // try sanitization
    try {
      const san = sanitizeJson(extracted)
      const parsed = JSON.parse(san)
      if (!validateRoadmap(parsed)) return { parsed: null, error: 'invalid-schema' }
      return { parsed, error: null }
    } catch (e2) {
      return { parsed: null, error: 'parse-failed' }
    }
  }
}
