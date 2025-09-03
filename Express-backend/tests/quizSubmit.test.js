import { jest } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import bodyParser from 'body-parser'

// ESM-friendly mock: use unstable_mockModule then import modules
await jest.unstable_mockModule('../services/tutorService.js', () => ({
  default: {
    submitQuizResult: jest.fn()
  }
}))

const tutorService = (await import('../services/tutorService.js')).default
const tutorRoutes = (await import('../routes/tutor.js')).default

describe('POST /api/tutor/quizzes/:quizId/submit', () => {
  let app

  beforeAll(() => {
    app = express()
    app.use(bodyParser.json())
    // mount the router at /api/tutor
    app.use('/api/tutor', tutorRoutes)
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls tutorService.submitQuizResult and returns 201 with data', async () => {
    // arrange: mock implementation
    const fakeSaved = { id: 'saved123', quiz_id: 'q1', user_id: 'u1', score: 2 }
    tutorService.submitQuizResult.mockResolvedValueOnce(fakeSaved)

    const payload = { user_id: 'u1', answers: { 0: 1 }, score: 2 }
    const res = await request(app)
      .post('/api/tutor/quizzes/q1/submit')
      .send(payload)

    expect(res.status).toBe(201)
    expect(res.body).toBeDefined()
    expect(res.body.ok).toBe(true)
    expect(res.body.data).toEqual(fakeSaved)

    // service called with expected args
    expect(tutorService.submitQuizResult).toHaveBeenCalledTimes(1)
    const calledArgs = tutorService.submitQuizResult.mock.calls[0]
    // first arg: userId (from payload)
    expect(calledArgs[0]).toBe('u1')
    // second arg: payload shape includes quiz_id and answers and score
    expect(calledArgs[1]).toMatchObject({ quiz_id: 'q1', answers: payload.answers, score: payload.score })
  })
})
