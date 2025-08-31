import mongoose from 'mongoose'

const DiscussionLikeSchema = new mongoose.Schema(
  {
    discussion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

DiscussionLikeSchema.index({ discussion_id: 1, user_id: 1 }, { unique: true })

DiscussionLikeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.DiscussionLike || mongoose.model('DiscussionLike', DiscussionLikeSchema)
