import mongoose from 'mongoose'

const TutorChapterSchema = new mongoose.Schema({
	title: { type: String, required: true },
	content: { type: String, default: '' },
	position: { type: Number, default: 0 },
	quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TutorQuiz' }],
	resources: [{ type: String }],
	meta: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

TutorChapterSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform(doc, ret) {
		ret.id = ret._id
		delete ret._id
	}
})

export default mongoose.models.TutorChapter || mongoose.model('TutorChapter', TutorChapterSchema)
