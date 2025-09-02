import mongoose from 'mongoose'

const TutorQuizSchema = new mongoose.Schema({
	title: { type: String, required: true },
	questions: [{
		question: { type: String, required: true },
		choices: [{ type: String }],
		correctIndex: { type: Number, default: -1 },
		points: { type: Number, default: 1 }
	}],
	meta: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

TutorQuizSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform(doc, ret) {
		ret.id = ret._id
		delete ret._id
	}
})

export default mongoose.models.TutorQuiz || mongoose.model('TutorQuiz', TutorQuizSchema)
