import mongoose from 'mongoose'

const WellnessEntrySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mood_score: { type: Number, min: 1, max: 10, required: true },
    stress_level: { type: Number, min: 1, max: 10, required: true },
    energy_level: { type: Number, min: 1, max: 10, required: true },
    sleep_hours: { type: Number },
    sleep_quality: { type: String },
    notes: { type: String },
    mood_tags: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

WellnessEntrySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.WellnessEntry || mongoose.model('WellnessEntry', WellnessEntrySchema)
