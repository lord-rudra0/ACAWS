import TutorRoadmap from '../models/TutorRoadmap.js'
import TutorChapter from '../models/TutorChapter.js'
import TutorQuiz from '../models/TutorQuiz.js'
import QuizResult from '../models/QuizResult.js'

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
    return resultDoc
  },

  async getUserQuizHistory(userId, quizId) {
    return QuizResult.find({ user_id: userId, quiz_id: quizId }).sort({ created_at: -1 }).lean()
  }
,

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
  }
}

export default tutorService
