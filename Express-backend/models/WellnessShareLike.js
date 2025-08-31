import mongoose from 'mongoose'

const WellnessShareLikeSchema = new mongoose.Schema(
  {
    share_id: { type: mongoose.Schema.Types.ObjectId, ref: 'WellnessShare', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

WellnessShareLikeSchema.index({ share_id: 1, user_id: 1 }, { unique: true })

WellnessShareLikeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.WellnessShareLike || mongoose.model('WellnessShareLike', WellnessShareLikeSchema)
