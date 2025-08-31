import mongoose from 'mongoose'

const ChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    reward_points: { type: Number, default: 0 },
    challenge_type: { type: String, required: true },
    active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
  },
  { timestamps: false }
)

ChallengeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema)
