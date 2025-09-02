import TutorRoadmap from '../models/TutorRoadmap.js'
import TutorChapter from '../models/TutorChapter.js'
import TutorQuiz from '../models/TutorQuiz.js'
import QuizResult from '../models/QuizResult.js'

const tutorService = {
  async getRoadmaps() {
    return TutorRoadmap.find({}).populate({ path: 'chapters', options: { sort: { order: 1 } } }).lean()
  },

  async getChapter(chapterId) {
    return TutorChapter.findById(chapterId).populate('quizzes').lean()
  },

  async submitQuiz(userId, quizId, answers = [], timeTaken = 0, moduleId = null) {
    const quiz = await TutorQuiz.findById(quizId).lean()
    if (!quiz) throw new Error('Quiz not found')

    // Simple scoring: match option.correct flags for single-choice
    let score = 0
    let max = 0
    for (let i = 0; i < (quiz.questions || []).length; i++) {
      const q = quiz.questions[i]
      max += 1
      const ans = answers[i]
      if (!ans) continue
      if (q.type === 'single') {
        const selected = q.options[ans]
        if (selected && selected.correct) score += 1
      } else if (q.type === 'multiple') {
        // assume ans is array of indices
        const correctSet = new Set(q.options.map((o, idx) => o.correct ? idx : -1).filter(i => i >= 0))
        const selectedSet = new Set(Array.isArray(ans) ? ans : [])
        const common = [...correctSet].filter(x => selectedSet.has(x)).length
        score += common / Math.max(1, correctSet.size)
      }
    }

    const percent = Math.round((score / Math.max(1, max)) * 100)
    const passed = percent >= 70

    const result = await QuizResult.create({ user_id: userId, quiz_id: quizId, answers, score: percent, max_score: 100, passed, time_taken_seconds: timeTaken, module_id: moduleId })

    // Very small adaptive suggestion: if failed, recommend previous chapter or remediation; if passed, recommend next chapter
    let suggestion = null
    if (!passed) {
      suggestion = { type: 'remediation', message: 'Review previous section and try the short practice tasks.' }
    } else {
      suggestion = { type: 'advance', message: 'Great job — proceed to the next chapter.' }
    }

    return { result, suggestion }
  },

  async getUserProgress(userId) {
    const totalTaken = await QuizResult.countDocuments({ user_id: userId })
    const passedCount = await QuizResult.countDocuments({ user_id: userId, passed: true })
    const avgScoreAgg = await QuizResult.aggregate([
      { $match: { user_id: userId } },
      { $group: { _id: null, avg: { $avg: '$score' } } }
    ])
    const avg = (avgScoreAgg[0] && avgScoreAgg[0].avg) || 0
    return { totalTaken, passedCount, avgScore: Math.round(avg) }
  }
}

export default tutorService
