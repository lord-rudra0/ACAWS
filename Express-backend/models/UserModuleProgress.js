import mongoose from 'mongoose'

const UserModuleProgressSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule', required: true, index: true },
    completion_percentage: { type: Number, default: 0 },
    last_accessed: { type: Date },
    time_spent: { type: Number, default: 0 }, // minutes
    current_section: { type: String },
    quiz_scores: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: false }
)

UserModuleProgressSchema.index({ user_id: 1, module_id: 1 }, { unique: true })

UserModuleProgressSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.UserModuleProgress || mongoose.model('UserModuleProgress', UserModuleProgressSchema)
