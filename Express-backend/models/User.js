import mongoose from 'mongoose'

const PreferencesSchema = new mongoose.Schema({}, { strict: false, _id: false })

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'educator', 'admin'], default: 'student', index: true },
    institution: { type: String, default: '' },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' },
    preferences: { type: PreferencesSchema, default: {} },
    last_login: { type: Date }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

// Ensure virtual id field is serialized
UserSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.password
  }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
