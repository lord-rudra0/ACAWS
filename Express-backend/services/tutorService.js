import TutorRoadmap from '../models/TutorRoadmap.js'
import TutorChapter from '../models/TutorChapter.js'
import TutorQuiz from '../models/TutorQuiz.js'
import QuizResult from '../models/QuizResult.js'
import QuestionAnalytics from '../models/QuestionAnalytics.js'

const tutorService = {
  async listRoadmaps(filter = {}) {
    return TutorRoadmap.find(filter).populate({ path: 'chapters', populate: { path: 'quizzes' } }).lean()
  },

  async getRoadmap(id) {
    return TutorRoadmap.findById(id).populate({ path: 'chapters', populate: { path: 'quizzes' } })
  },

  async createRoadmap(data) {
    const rd = await TutorRoadmap.create(data)
    return rd
  },

  async createChapter(data) {
    const ch = await TutorChapter.create(data)
    return ch
  },

  async createQuiz(data) {
    const q = await TutorQuiz.create(data)
    return q
  },

  async submitQuizResult(userId, payload) {
    const resultDoc = await QuizResult.create({ user_id: userId, ...payload })

    // If answers and quiz id are present, update per-question analytics
    try {
      const quizId = payload.quiz_id || payload.quizId || payload.quizIdString || payload.quiz_id
      const answers = payload.answers || {}
      const quiz = quizId ? await TutorQuiz.findById(quizId).lean() : null
      if (quiz && Array.isArray(quiz.questions)) {
        for (let qi = 0; qi < quiz.questions.length; qi++) {
          const q = quiz.questions[qi]
          const selected = answers[qi]
          const correct = (selected != null && selected === q.correctIndex)

          // Update or create analytics entry
          const existing = await QuestionAnalytics.findOne({ user_id: userId, quiz_id: quizId, question_index: qi })
          if (!existing) {
            // initial record
            const repetitions = correct ? 1 : 0
            const interval_days = correct ? 1 : 0
            const ef = 2.5
            const next_review = correct ? new Date(Date.now() + interval_days * 24 * 3600 * 1000) : new Date()
            await QuestionAnalytics.create({ user_id: userId, quiz_id: quizId, question_index: qi, question_text: q.question, correct, repetitions, interval_days, ef, next_review })
          } else {
            // apply simplified SM-2: adjust ef and interval
            let ef = existing.ef || 2.5
            const quality = correct ? 5 : 2 // scale: 5 correct, 2 incorrect
            ef = Math.max(1.3, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
            let repetitions = existing.repetitions || 0
            let interval_days = existing.interval_days || 0
            if (quality < 3) {
              repetitions = 0
              interval_days = 0
            } else {
              repetitions += 1
              if (repetitions === 1) interval_days = 1
              else if (repetitions === 2) interval_days = 6
              else interval_days = Math.round(interval_days * ef)
            }
            const next_review = new Date(Date.now() + interval_days * 24 * 3600 * 1000)
            existing.repetitions = repetitions
            existing.interval_days = interval_days
            existing.ef = ef
            existing.next_review = next_review
            existing.correct = correct
            await existing.save()
          }
        }
      }
    } catch (e) {
      console.warn('Failed to update question analytics', e)
    }

    return resultDoc
  },

  // fetch scheduled reviews for a user (questions due today)
  async getScheduledReviews(userId, dueBefore = null) {
    const q = { user_id: userId }
    if (dueBefore) q.next_review = { $lte: dueBefore }
    else q.next_review = { $lte: new Date() }
    return QuestionAnalytics.find(q).sort({ next_review: 1 }).lean()
  }

  ,

  async getUserQuizHistory(userId, quizId) {
    return QuizResult.find({ user_id: userId, quiz_id: quizId }).sort({ created_at: -1 }).lean()
  },

  // compute user progress for a roadmap: per-chapter completion and overall percent
  async getUserProgress(userId, roadmapId) {
    const roadmap = await TutorRoadmap.findById(roadmapId).populate({ path: 'chapters', populate: { path: 'quizzes' } }).lean()
    if (!roadmap) return null
    const chapters = roadmap.chapters || []
    const results = []
    let completed = 0
    for (const ch of chapters) {
      let chapterCompleted = false
      // check quizzes in chapter
      const quizIds = (ch.quizzes || []).map(q => q.toString())
      if (quizIds.length > 0) {
        const latest = await QuizResult.find({ user_id: userId, quiz_id: { $in: quizIds } }).sort({ created_at: -1 }).limit(1).lean()
        if (latest && latest.length > 0) {
          const score = latest[0].score || 0
          if (score >= 70) chapterCompleted = true
        }
      }
      if (chapterCompleted) completed += 1
      results.push({ chapter_id: ch._id, title: ch.title, completed: chapterCompleted })
    }
    const percent = chapters.length === 0 ? 0 : Math.round((completed / chapters.length) * 100)
    return { roadmap_id: roadmapId, total_chapters: chapters.length, completed_chapters: completed, percent, chapters: results }
  },

  // recommend the next chapter for a user in a roadmap
  async recommendNextChapter(userId, roadmapId) {
    const roadmap = await TutorRoadmap.findById(roadmapId).populate({ path: 'chapters', populate: { path: 'quizzes' } })
    if (!roadmap) return null
    const chapters = (roadmap.chapters || []).sort((a, b) => (a.position || 0) - (b.position || 0))
    for (const ch of chapters) {
      const quizIds = (ch.quizzes || []).map(q => q._id ? q._id.toString() : q.toString())
      if (quizIds.length === 0) return ch
      const latest = await QuizResult.find({ user_id: userId, quiz_id: { $in: quizIds } }).sort({ created_at: -1 }).limit(1).lean()
      const score = (latest && latest[0]) ? (latest[0].score || 0) : -1
      // if never attempted or failed, recommend this chapter
      if (score < 70) return ch
    }
    // all done
    return null
  },

  // Composite user state: roadmap, progress, recommended next chapter and next quiz
  async getUserState(userId, roadmapId = null) {
    // choose roadmap: by id or first active
    let roadmap
    if (roadmapId) {
      roadmap = await TutorRoadmap.findById(roadmapId).populate({ path: 'chapters', populate: { path: 'quizzes' } }).lean()
    } else {
      roadmap = await TutorRoadmap.findOne({ active: true }).populate({ path: 'chapters', populate: { path: 'quizzes' } }).lean()
    }
    if (!roadmap) return { roadmap: null }

    const progress = await this.getUserProgress(userId, roadmap._id || roadmap.id)
    const nextChapter = await this.recommendNextChapter(userId, roadmap._id || roadmap.id)
    let nextQuiz = null
    if (nextChapter && (nextChapter.quizzes || []).length > 0) {
      // take first quiz reference
      const qid = nextChapter.quizzes[0]
      nextQuiz = await TutorQuiz.findById(qid).lean()
    }

    return {
      roadmap,
      progress,
      nextChapter,
      nextQuiz
    }
  }
}

export default tutorService
