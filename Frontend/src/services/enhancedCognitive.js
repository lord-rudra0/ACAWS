import { pythonAPI } from './api'

const enhancedCognitiveAPI = {
  analyze: async (frameData) => {
    try {
      const response = await pythonAPI.post('/api/analytics/enhanced/analyze', frameData)
      return response.data
    } catch (err) {
      throw new Error(err.message || 'Enhanced cognitive analyze failed')
    }
  }
}

export default enhancedCognitiveAPI
