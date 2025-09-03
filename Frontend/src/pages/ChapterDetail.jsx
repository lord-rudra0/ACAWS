import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tutorAPI, learningAPI } from '../services/api'

const ChapterDetail = () => {
  const { roadmapId, chapterId } = useParams()
  const navigate = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await tutorAPI.getRoadmap(roadmapId)
        const rd = res && res.data ? res.data : null
        setRoadmap(rd)
        if (rd && Array.isArray(rd.chapters)) {
          const ch = rd.chapters.find(c => (c._id || c.id || c).toString() === chapterId.toString())
          setChapter(ch || null)
        }
      } catch (e) {
        console.error('Failed to load chapter detail', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [roadmapId, chapterId])

  if (loading) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">Loading...</div>
  if (!roadmap) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">Roadmap not found</div>
  if (!chapter) return <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">Chapter not found</div>

  const idx = (roadmap.chapters || []).findIndex(c => (c._id || c.id || c).toString() === chapterId.toString())
  const prev = idx > 0 ? roadmap.chapters[idx - 1] : null
  const next = idx < (roadmap.chapters || []).length - 1 ? roadmap.chapters[idx + 1] : null

  // Word count (strip HTML tags)
  const textOnly = chapter.content ? chapter.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : ''
  const words = textOnly ? textOnly.split(' ').length : 0

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{chapter.title}</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">{roadmap.title} — Chapter {chapter.position || idx + 1}</div>
        </div>
        <div className="text-sm text-gray-500">Words: {words}</div>
      </div>

      <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 mb-6">
        <div dangerouslySetInnerHTML={{ __html: chapter.content || '<p>No content</p>' }} />
      </div>

      {words < 1000 && (
        <div className="mb-4 text-sm text-yellow-700">Note: Chapter content is shorter than the recommended 1000 words.</div>
      )}

      {/* Quiz display - simple inline */}
      {Array.isArray(chapter.quizzes) && chapter.quizzes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quiz</h2>
          <form onSubmit={async (e) => {
            e.preventDefault()
            // compute score
            const quiz = chapter.quizzes[0]
            if (!quiz) return
            const userAnswers = answers[quiz._id || quiz.id || '0'] || {}
            let score = 0
            for (let i = 0; i < (quiz.questions || []).length; i++) {
              const q = quiz.questions[i]
              const selected = userAnswers[i]
              if (typeof selected !== 'undefined' && Number(selected) === Number(q.correctIndex)) {
                score += (q.points || 1)
              }
            }

            const payload = {
              user_id: localStorage.getItem('user_id') || undefined,
              answers: userAnswers,
              score
            }

            setSubmitting(true)
            setSubmitResult(null)
            try {
              const qid = quiz._id || quiz.id
              const resp = await tutorAPI.submitQuizResult(qid, payload)
              setSubmitResult({ ok: true, data: resp })

              // compute per-question feedback locally
              const perQ = (quiz.questions || []).map((q, idx) => {
                const selected = (userAnswers || {})[idx]
                return {
                  question: q.question,
                  selected: typeof selected !== 'undefined' ? Number(selected) : null,
                  correctIndex: typeof q.correctIndex !== 'undefined' ? Number(q.correctIndex) : null,
                  correct: typeof selected !== 'undefined' ? Number(selected) === Number(q.correctIndex) : false,
                  points: q.points || 1
                }
              })
              setFeedback({ quizId: qid, perQuestion: perQ, score })

              // Refresh user state and learning stats so dashboard updates
              try {
                const uid = localStorage.getItem('user_id') || null
                if (uid) {
                  await tutorAPI.getUserState(uid, roadmapId)
                }
                await learningAPI.getStats()
              } catch (e) {
                // ignore refresh errors; UI will update on next poll
              }

            } catch (err) {
              setSubmitResult({ ok: false, error: err.message || err })
            } finally {
              setSubmitting(false)
            }
          }}>
            {chapter.quizzes.map((quiz, qi) => (
              <div key={qi} className="mb-3 p-3 border rounded">
                <div className="font-medium mb-2">{quiz.title || `Quiz ${qi + 1}`}</div>
                {(quiz.questions || []).map((q, qi2) => (
                  <div key={qi2} className="mb-3">
                    <div className="mb-1">{q.question}</div>
                    <div className="space-y-1">
                      {(q.choices || []).map((choice, ci) => {
                        const name = `${quiz._id || quiz.id}_q${qi2}`
                        const selected = (answers[quiz._id || quiz.id] || {})[qi2]
                        return (
                          <label key={ci} className="flex items-center space-x-2 text-sm">
                            <input
                              type="radio"
                              name={name}
                              value={ci}
                              checked={String(selected) === String(ci)}
                              onChange={() => {
                                setAnswers(prev => ({
                                  ...prev,
                                  [quiz._id || quiz.id || '0']: { ...(prev[quiz._id || quiz.id] || {}), [qi2]: ci }
                                }))
                              }}
                            />
                            <span>{choice}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="mt-2">
                  <button className="btn-primary mr-2" type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Quiz'}</button>
                  <button type="button" className="btn-secondary" onClick={() => { setAnswers({}); setSubmitResult(null) }}>Reset</button>
                </div>
              </div>
            ))}

            {submitResult && (
              <div className={`mt-3 p-2 rounded text-sm ${submitResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {submitResult.ok ? 'Quiz submitted. Score recorded.' : `Submission failed: ${submitResult.error}`}
              </div>
            )}
          </form>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <button className="btn-secondary mr-2" onClick={() => navigate(-1)}>Back</button>
          {prev && <button className="btn-primary mr-2" onClick={() => navigate(`/learning/roadmap/${roadmapId}/chapter/${prev._id || prev.id}`)}>Previous</button>}
          {next && <button className="btn-primary" onClick={() => navigate(`/learning/roadmap/${roadmapId}/chapter/${next._id || next.id}`)}>Next</button>}
        </div>
        <div>
          <button className="btn-secondary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Top</button>
        </div>
      </div>
    </div>
  )
}

export default ChapterDetail
