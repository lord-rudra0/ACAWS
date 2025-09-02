import React, { useEffect, useState } from 'react'
import tutorAPI from '../services/tutorAPI'

export default function Learning() {
  const [roadmaps, setRoadmaps] = useState([])
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [chapterContent, setChapterContent] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [lastResult, setLastResult] = useState(null)

  useEffect(() => {
    tutorAPI.getRoadmaps().then(setRoadmaps).catch(err => console.error('roadmaps', err))
  }, [])

  const openChapter = async (chapterId) => {
    try {
      const data = await tutorAPI.getChapter(chapterId)
      setSelectedChapter(chapterId)
      setChapterContent(data)
      // initialize answers
      const initial = {}
      (data.quizzes || []).forEach(q => { initial[q._id || q.id] = null })
      setQuizAnswers(initial)
    } catch (e) {
      console.error('chapter', e)
    }
  }

  const handleAnswer = (questionId, value) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const submitQuiz = async () => {
    if (!chapterContent || !chapterContent.quizzes || chapterContent.quizzes.length === 0) return
    const quiz = chapterContent.quizzes[0]
    const answersArray = (quiz.questions || []).map(q => ({ questionId: q.id || q._id, answer: quizAnswers[q.id || q._id] }))
    try {
      const res = await tutorAPI.submitQuiz(quiz._id || quiz.id, { answers: answersArray, timeTaken: 30 })
      setLastResult(res)
    } catch (e) {
      console.error('submit', e)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Learning (Minimal)</h2>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ width: 300 }}>
          <h3>Roadmaps</h3>
          {roadmaps.length === 0 && <div>No roadmaps found</div>}
          <ul>
            {roadmaps.map(r => (
              <li key={r._id || r.id}>
                <strong>{r.title}</strong>
                <div><button onClick={() => openChapter(r.startingChapter || (r.chapters && r.chapters[0]) )}>Open start</button></div>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Chapter</h3>
          {!chapterContent && <div>Select a roadmap to open its starting chapter.</div>}
          {chapterContent && (
            <div>
              <h4>{chapterContent.title}</h4>
              <div dangerouslySetInnerHTML={{ __html: chapterContent.content || chapterContent.body || '' }} />

              <h4>Quiz</h4>
              {chapterContent.quizzes && chapterContent.quizzes.length > 0 ? (
                chapterContent.quizzes.map(quiz => (
                  <div key={quiz._id || quiz.id} style={{ marginBottom: 12 }}>
                    <div><strong>{quiz.title}</strong></div>
                    {quiz.questions.map(q => (
                      <div key={q.id || q._id} style={{ marginTop: 8 }}>
                        <div>{q.text}</div>
                        {q.options && q.options.map(opt => (
                          <label key={opt} style={{ display: 'block' }}>
                            <input
                              type="radio"
                              name={q.id || q._id}
                              checked={quizAnswers[q.id || q._id] === opt}
                              onChange={() => handleAnswer(q.id || q._id, opt)}
                            />
                            {' '}{opt}
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                ))
              ) : <div>No quizzes for this chapter.</div>}

              <div style={{ marginTop: 12 }}>
                <button onClick={submitQuiz}>Submit Quiz</button>
              </div>

              {lastResult && (
                <div style={{ marginTop: 12 }}>
                  <h4>Result</h4>
                  <pre>{JSON.stringify(lastResult, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
