import React from 'react'
import Roadmap from './Roadmap'

export default { title: 'Tutor/Roadmap', component: Roadmap }

const sample = {
  title: 'Sample Roadmap',
  description: 'Sample description',
  chapters: [
    { _id: '1', title: 'Ch 1', content: '<p>Intro</p>', position: 1 },
    { _id: '2', title: 'Ch 2', content: '<p>Next</p>', position: 2 }
  ]
}

export const Default = () => <div style={{ padding: 16 }}><Roadmap roadmap={sample} onSelectChapter={() => {}} /></div>
