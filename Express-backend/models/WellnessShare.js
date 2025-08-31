import mongoose from 'mongoose'

const WellnessShareSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood_category: { type: String, enum: ['happy', 'grateful', 'motivated', 'peaceful', 'excited', 'calm'], required: true },
    message: { type: String, required: true },
    active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

// Index for active recent posts
WellnessShareSchema.index({ active: 1, created_at: -1 })

WellnessShareSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.WellnessShare || mongoose.model('WellnessShare', WellnessShareSchema)
