describe('AI parsing helper', () => {
  test('parses valid roadmap JSON', async () => {
    const { parseRoadmapFromText } = await import('../utils/aiParsing.js')
    const txt = `{"title":"Test Roadmap","description":"desc","chapters":[{"title":"C1","content":"<p>c</p>","position":1,"quizzes":[{"title":"Q1","questions":[{"question":"q","choices":["a","b"],"correctIndex":0,"points":1}]}]}]}`
    const { parsed, error } = parseRoadmapFromText(txt)
    expect(error).toBeNull()
    expect(parsed).toBeTruthy()
    expect(parsed.title).toBe('Test Roadmap')
  })

  test('parses JSON with trailing commas', async () => {
    const { parseRoadmapFromText } = await import('../utils/aiParsing.js')
    const txt = `{
      "title": "Trailing",
      "description": "desc",
      "chapters": [
        {
          "title": "C1",
          "content": "<p>c</p>",
          "position": 1,
          "quizzes": [
            { "title": "Q1", "questions": [ { "question": "q", "choices": ["a","b"], "correctIndex": 0, "points": 1 } ], },
          ],
        },
      ],
    }`
    const { parsed, error } = parseRoadmapFromText(txt)
    expect(error).toBeNull()
    expect(parsed).toBeTruthy()
    expect(parsed.title).toBe('Trailing')
  })

  test('extracts JSON from surrounding prose', async () => {
    const { parseRoadmapFromText } = await import('../utils/aiParsing.js')
    const txt = `Here is a roadmap:\n\nSome intro text.\n{\n  "title": "Prose Roadmap",\n  "description": "desc",\n  "chapters": [ { "title": "C1", "content": "<p>x</p>", "position": 1, "quizzes": [ { "title": "Q", "questions": [ { "question": "q", "choices": ["a","b"], "correctIndex": 0, "points": 1 } ] } ] } ]\n}\nThanks.`
    const { parsed, error } = parseRoadmapFromText(txt)
    expect(error).toBeNull()
    expect(parsed).toBeTruthy()
    expect(parsed.title).toBe('Prose Roadmap')
  })
})
