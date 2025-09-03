import mongoose from 'mongoose'

const LearningDebugLogSchema = new mongoose.Schema({
  user_id: { type: String, default: null },
  ip: { type: String, default: '' },
  path: { type: String, default: '' },
  params: { type: Object, default: {} },
  user_agent: { type: String, default: '' },
  notes: { type: String, default: '' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

LearningDebugLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.LearningDebugLog || mongoose.model('LearningDebugLog', LearningDebugLogSchema)
