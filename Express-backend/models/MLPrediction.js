import mongoose from 'mongoose'

const MLPredictionSchema = new mongoose.Schema(
  {
    model_type: { type: String, required: true },
    confidence_score: { type: Number },
    processing_time_ms: { type: Number },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

MLPredictionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.MLPrediction || mongoose.model('MLPrediction', MLPredictionSchema)
