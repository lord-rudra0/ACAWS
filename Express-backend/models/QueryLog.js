import mongoose from 'mongoose'

const QueryLogSchema = new mongoose.Schema(
  {
    duration_ms: { type: Number },
    context: { type: String },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

QueryLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.QueryLog || mongoose.model('QueryLog', QueryLogSchema)
