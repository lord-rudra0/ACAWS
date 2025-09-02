import mongoose from 'mongoose'

const LearningSessionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule', required: true, index: true },
    session_type: { type: String, enum: ['study', 'practice', 'assessment'], required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active', index: true },
    initial_cognitive_state: { type: mongoose.Schema.Types.Mixed, default: {} },
    current_cognitive_state: { type: mongoose.Schema.Types.Mixed, default: {} },
    content_progress: { type: Number, default: 0 },
    interactions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  prediction_history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    adaptations_applied: { type: mongoose.Schema.Types.Mixed, default: {} },
    attention_score: { type: Number },
    wellness_score: { type: Number },
    completion_percentage: { type: Number },
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date },
    last_updated: { type: Date }
  },
  { timestamps: false }
)

LearningSessionSchema.index({ user_id: 1, started_at: -1 })

LearningSessionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.LearningSession || mongoose.model('LearningSession', LearningSessionSchema)
