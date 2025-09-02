import mongoose from 'mongoose'

const QuestionAnalyticsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorQuiz', required: true },
  question_index: { type: Number, required: true },
  question_text: { type: String },
  correct: { type: Boolean, required: true },
  repetitions: { type: Number, default: 0 },
  interval_days: { type: Number, default: 0 },
  ef: { type: Number, default: 2.5 }, // ease factor for SM-2 algorithm
  next_review: { type: Date },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

QuestionAnalyticsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.QuestionAnalytics || mongoose.model('QuestionAnalytics', QuestionAnalyticsSchema)
