import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { tutorAPI } from '../../services/api'

const Quiz = ({ quiz, onSubmit }) => {
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  if (!quiz) return null

  const handleSelect = (qIdx, choiceIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: choiceIdx }))
  }

  const computeScore = () => {
    let score = 0
    quiz.questions.forEach((q, idx) => {
      const selected = answers[idx]
      if (selected != null && selected === q.correctIndex) score += (q.points || 1)
    })
    const total = quiz.questions.reduce((s, q) => s + (q.points || 1), 0)
    return total === 0 ? 0 : Math.round((score / total) * 100)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const score = computeScore()
    try {
      await tutorAPI.submitQuizResult(quiz._id || quiz.id, { answers, score })
      if (onSubmit) onSubmit({ score, answers })
    } catch (err) {
      console.error('Quiz submit failed', err)
      alert('Failed to submit quiz result')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{quiz.title}</h3>
      <div className="space-y-4">
        {quiz.questions.map((q, idx) => (
          <div key={idx} className="p-3 border rounded-lg">
            <div className="font-medium text-gray-900 dark:text-white">{q.question}</div>
            <div className="mt-2 space-y-2">
              {q.choices.map((c, i) => (
                <label key={i} className={`flex items-center space-x-3 cursor-pointer p-2 rounded ${answers[idx] === i ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                  <input type="radio" name={`q_${idx}`} checked={answers[idx] === i} onChange={() => handleSelect(idx, i)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{c}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
          Submit Quiz
        </button>
      </div>
    </motion.div>
  )
}

export default Quiz
