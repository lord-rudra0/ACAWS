import mongoose from 'mongoose'

const LearningModuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    duration: { type: Number, default: 0 }, // minutes
    topics: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
  ai_meta: { type: Object, default: {} },
    active: { type: Boolean, default: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

LearningModuleSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.LearningModule || mongoose.model('LearningModule', LearningModuleSchema)
