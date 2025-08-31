import mongoose from 'mongoose'

const SystemSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: { createdAt: false, updatedAt: 'updated_at' } }
)

SystemSettingsSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
  }
})

export default mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema)
