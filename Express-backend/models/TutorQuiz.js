import mongoose from 'mongoose'

const OptionSchema = new mongoose.Schema({
  text: String,
  correct: { type: Boolean, default: false }
})

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructions: { type: String },
  questions: [{
    prompt: String,
    options: [OptionSchema],
    type: { type: String, default: 'single' } // single|multiple|short
  }],
  chapter: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorChapter' },
  created_at: { type: Date, default: Date.now }
})

export default mongoose.model('TutorQuiz', QuizSchema)
