import mongoose from 'mongoose'

const ChapterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String },
  content: { type: String }, // Markdown/HTML content
  order: { type: Number, default: 0 },
  quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TutorQuiz' }],
  created_at: { type: Date, default: Date.now }
})

export default mongoose.model('TutorChapter', ChapterSchema)
