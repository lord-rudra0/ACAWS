import mongoose from 'mongoose'

const GoalSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    current: { type: Number, required: true },
    target: { type: Number, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: false }
)

const DailyWellnessSummarySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    wellness_score: { type: Number },
    sessions: { type: Number },
    goals: { type: [GoalSchema], default: [] },
    goals_achieved: { type: Number },
    goals_total: { type: Number },
    avg_focus: { type: Number },
    tips_sample: { type: [String], default: [] },
  last_seven_scores: { type: [Number], default: [] },
    meta: { type: Object },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

DailyWellnessSummarySchema.index({ user_id: 1, date: 1 }, { unique: true })

DailyWellnessSummarySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.DailyWellnessSummary || mongoose.model('DailyWellnessSummary', DailyWellnessSummarySchema)
