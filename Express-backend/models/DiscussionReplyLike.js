import mongoose from 'mongoose'

const DiscussionReplyLikeSchema = new mongoose.Schema(
  {
    reply_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionReply', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

DiscussionReplyLikeSchema.index({ reply_id: 1, user_id: 1 }, { unique: true })

DiscussionReplyLikeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.DiscussionReplyLike || mongoose.model('DiscussionReplyLike', DiscussionReplyLikeSchema)
