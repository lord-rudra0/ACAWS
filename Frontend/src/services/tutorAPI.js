import { expressAPI } from './api'

export const tutorAPI = {
  getRoadmaps: async () => {
    const res = await expressAPI.get('/api/tutor/roadmaps')
    return res.data
  },

  getChapter: async (chapterId) => {
    const res = await expressAPI.get(`/api/tutor/chapters/${chapterId}`)
    return res.data
  },

  submitQuiz: async (quizId, payload) => {
    const res = await expressAPI.post(`/api/tutor/quizzes/${quizId}/submit`, payload)
    return res.data
  },

  getProgress: async () => {
    const res = await expressAPI.get('/api/tutor/progress')
    return res.data
  }
}

export default tutorAPI
