import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Quiz from '../Quiz'

const sampleQuiz = {
  _id: 'q1',
  title: 'Sample Quiz',
  questions: [
    { question: '2+2?', choices: ['3','4','5'], correctIndex: 1, points: 1 }
  ]
}

test('renders quiz and allows selection and submit', async () => {
  const onSubmit = jest.fn()
  render(<Quiz quiz={sampleQuiz} onSubmit={onSubmit} />)

  expect(screen.getByText('Sample Quiz')).toBeInTheDocument()
  const option = screen.getByText('4')
  fireEvent.click(option)
  const submit = screen.getByText(/submit quiz/i)
  fireEvent.click(submit)
  // onSubmit should be called after submit (async)
  await new Promise(r => setTimeout(r, 200))
  expect(onSubmit).toHaveBeenCalled()
})
