import mongoose from 'mongoose'

const QuizResultSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorQuiz', required: true },
  module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule' },
  answers: { type: Array, default: [] },
  score: { type: Number, default: 0 },
  max_score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  time_taken_seconds: { type: Number, default: 0 },
  metadata: { type: Object, default: {} },
  created_at: { type: Date, default: Date.now }
})

export default mongoose.model('QuizResult', QuizResultSchema)
