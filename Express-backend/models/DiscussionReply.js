import mongoose from 'mongoose'

const DiscussionReplySchema = new mongoose.Schema(
  {
    discussion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    parent_reply_id: { type: mongoose.Schema.Types.ObjectId, ref: 'DiscussionReply', default: null },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

// Index for replies listing per discussion
DiscussionReplySchema.index({ discussion_id: 1, created_at: 1 })

DiscussionReplySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.DiscussionReply || mongoose.model('DiscussionReply', DiscussionReplySchema)
