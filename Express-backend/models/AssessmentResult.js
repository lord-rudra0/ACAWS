import mongoose from 'mongoose'

const AssessmentResultSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule', required: true, index: true },
    answers: { type: mongoose.Schema.Types.Mixed, default: [] },
    score: { type: Number, required: true },
    time_taken: { type: Number, required: true }, // seconds or minutes depending on usage
    cognitive_state: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

AssessmentResultSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', AssessmentResultSchema)
