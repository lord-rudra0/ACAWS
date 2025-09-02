import React from 'react'
import Quiz from './Quiz'

export default { title: 'Tutor/Quiz', component: Quiz }

const sampleQuiz = {
  _id: 'q1',
  title: 'Sample Quiz',
  questions: [
    { question: '2+2?', choices: ['3','4','5'], correctIndex: 1, points: 1 },
    { question: 'Capital of FR?', choices: ['Paris','London'], correctIndex: 0, points: 1 }
  ]
}

export const Default = () => <div style={{ padding: 16 }}><Quiz quiz={sampleQuiz} onSubmit={() => {}} /></div>
