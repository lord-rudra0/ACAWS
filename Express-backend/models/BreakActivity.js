import mongoose from 'mongoose'

const BreakActivitySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activity_type: { type: String, required: true },
    duration: { type: Number, required: true },
    effectiveness_rating: { type: Number },
    notes: { type: String },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

BreakActivitySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.BreakActivity || mongoose.model('BreakActivity', BreakActivitySchema)
