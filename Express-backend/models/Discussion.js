import mongoose from 'mongoose'

const DiscussionSchema = new mongoose.Schema(
  {
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ['general', 'study_tips', 'wellness', 'technical', 'feedback'], required: true },
    tags: { type: [String], default: [] },
    active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

// Indexes for common queries
DiscussionSchema.index({ active: 1, category: 1, created_at: -1 })
DiscussionSchema.index({ active: 1, created_at: -1 })

DiscussionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.Discussion || mongoose.model('Discussion', DiscussionSchema)
