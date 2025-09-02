import mongoose from 'mongoose'

const QuizResultSchema = new mongoose.Schema({
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'TutorQuiz', required: true },
	module_id: { type: String },
	score: { type: Number, required: true },
	answers: { type: Object },
	time_taken: { type: Number },
	cognitive_state: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

QuizResultSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform(doc, ret) {
		ret.id = ret._id
		delete ret._id
	}
})

export default mongoose.models.QuizResult || mongoose.model('QuizResult', QuizResultSchema)
