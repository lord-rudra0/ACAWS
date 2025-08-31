import mongoose from 'mongoose'

const ChallengeParticipantSchema = new mongoose.Schema(
  {
    challenge_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joined_at: { type: Date, default: Date.now },
    progress: { type: Number, default: 0 }
  },
  { timestamps: false }
)

ChallengeParticipantSchema.index({ challenge_id: 1, user_id: 1 }, { unique: true })

ChallengeParticipantSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.ChallengeParticipant || mongoose.model('ChallengeParticipant', ChallengeParticipantSchema)
