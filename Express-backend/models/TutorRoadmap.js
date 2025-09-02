import mongoose from 'mongoose'

const TutorRoadmapSchema = new mongoose.Schema({
	title: { type: String, required: true, trim: true },
	description: { type: String, default: '' },
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
	chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TutorChapter' }],
	active: { type: Boolean, default: true },
	meta: { type: Object, default: {} }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

TutorRoadmapSchema.set('toJSON', {
	virtuals: true,
	versionKey: false,
	transform(doc, ret) {
		ret.id = ret._id
		delete ret._id
	}
})

export default mongoose.models.TutorRoadmap || mongoose.model('TutorRoadmap', TutorRoadmapSchema)
