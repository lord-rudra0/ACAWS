import mongoose from 'mongoose'

const ContentPushSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content_type: { type: String, required: true },
    content_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    message: { type: String },
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending', index: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

ContentPushSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.ContentPush || mongoose.model('ContentPush', ContentPushSchema)
