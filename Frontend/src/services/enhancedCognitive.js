import { pythonAPI } from './api'

const enhancedCognitiveAPI = {
  analyze: async (frameData) => {
    console.log("📸 [Frontend] Enhanced cognitive analyze called!")
    console.log("📸 [Frontend] Frame data type:", typeof frameData)
    console.log("📸 [Frontend] Frame data keys:", Object.keys(frameData || {}))
    console.log("📸 [Frontend] Frame data has 'frame' key:", frameData && 'frame' in frameData)
    console.log("📸 [Frontend] Frame data length:", frameData?.frame?.length || 'N/A')

    try {
      console.log("🚀 [Frontend] Sending frame data to backend...")
      const response = await pythonAPI.post('/api/analytics/enhanced/analyze', frameData)

      console.log("✅ [Frontend] Backend response received!")
      console.log("📊 [Frontend] Response status:", response.status)
      console.log("📊 [Frontend] Response data keys:", Object.keys(response.data || {}))
      console.log("📊 [Frontend] Response success:", response.data?.success)
      console.log("📊 [Frontend] Response summary keys:", Object.keys(response.data?.summary || {}))
      console.log("📊 [Frontend] Response summary:", response.data?.summary)

      return response.data
    } catch (err) {
      console.error("❌ [Frontend] Enhanced cognitive analyze failed!")
      console.error("❌ [Frontend] Error message:", err.message)
      console.error("❌ [Frontend] Error response:", err.response?.data)
      console.error("❌ [Frontend] Error status:", err.response?.status)
      throw new Error(err.message || 'Enhanced cognitive analyze failed')
    }
  }
}

export default enhancedCognitiveAPI
