import mongoose from 'mongoose'

const RoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  language: { type: String, default: 'en' },
  chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TutorChapter' }],
  created_at: { type: Date, default: Date.now }
})

export default mongoose.model('TutorRoadmap', RoadmapSchema)
