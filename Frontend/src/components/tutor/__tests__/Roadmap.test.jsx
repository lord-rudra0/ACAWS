import React from 'react'
import { render, screen } from '@testing-library/react'
import Roadmap from '../Roadmap'

const sample = {
  title: 'Sample Roadmap',
  description: 'desc',
  chapters: [{ _id: '1', title: 'Ch 1', content: '<p>hi</p>' }]
}

test('renders roadmap with chapters', () => {
  render(<Roadmap roadmap={sample} onSelectChapter={() => {}} />)
  expect(screen.getByText('Sample Roadmap')).toBeInTheDocument()
  expect(screen.getByText('Ch 1')).toBeInTheDocument()
})
