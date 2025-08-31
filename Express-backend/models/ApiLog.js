import mongoose from 'mongoose'

const ApiLogSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    route: { type: String },
    method: { type: String },
    status_code: { type: Number },
    started_at: { type: Date },
    ended_at: { type: Date },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

ApiLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.ApiLog || mongoose.model('ApiLog', ApiLogSchema)
