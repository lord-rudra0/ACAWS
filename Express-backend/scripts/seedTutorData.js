#!/usr/bin/env node
/* Seed tutor roadmaps, chapters and quizzes for local testing */
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: new URL('../.env', import.meta.url).pathname })

import TutorRoadmap from '../models/TutorRoadmap.js'
import TutorChapter from '../models/TutorChapter.js'
import TutorQuiz from '../models/TutorQuiz.js'

const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/acaws'

async function run() {
  await mongoose.connect(MONGO, { autoIndex: true })
  console.log('Connected to mongo for seeding')

  // Clean previous test data (only for dev)
  await TutorRoadmap.deleteMany({ title: /Sample Tutor Roadmap/ })
  await TutorChapter.deleteMany({ title: /Sample Chapter/ })
  await TutorQuiz.deleteMany({ title: /Sample Quiz/ })

  const chapter1 = await TutorChapter.create({ title: 'Sample Chapter 1: Introduction', summary: 'Basics of the topic', content: '<p>Intro content</p>', order: 1 })
  const quiz1 = await TutorQuiz.create({ title: 'Sample Quiz 1', instructions: 'Pick the correct answer', chapter: chapter1._id, questions: [ { prompt: 'What is 2+2?', options: [ { text: '3', correct: false }, { text: '4', correct: true } ], type: 'single' } ] })
  chapter1.quizzes.push(quiz1._id)
  await chapter1.save()

  const chapter2 = await TutorChapter.create({ title: 'Sample Chapter 2: Practice', summary: 'Practice problems', content: '<p>Practice content</p>', order: 2 })
  const quiz2 = await TutorQuiz.create({ title: 'Sample Quiz 2', instructions: 'Select all that apply', chapter: chapter2._id, questions: [ { prompt: 'Select primes', options: [ { text: '2', correct: true }, { text: '4', correct: false }, { text: '3', correct: true } ], type: 'multiple' } ] })
  chapter2.quizzes.push(quiz2._id)
  await chapter2.save()

  const roadmap = await TutorRoadmap.create({ title: 'Sample Tutor Roadmap', description: 'A seeded roadmap for local testing', chapters: [chapter1._id, chapter2._id] })

  console.log('Seeded roadmap:', roadmap._id.toString())
  await mongoose.disconnect()
  console.log('Done')
}

run().catch(e => { console.error(e); process.exit(1) })
