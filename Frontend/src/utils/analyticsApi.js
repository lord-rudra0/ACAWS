import api from './api';

// Normalize possible Date objects into ISO strings for query params
const normalizeParams = (params = {}) => {
  const out = { ...params };
  if (out.startDate instanceof Date) out.startDate = out.startDate.toISOString();
  if (out.endDate instanceof Date) out.endDate = out.endDate.toISOString();
  return out;
};

/**
 * Fetches the user's learning analytics dashboard data
 * @returns {Promise<Object>} The analytics data
 */
export const fetchDashboardAnalytics = async (params = {}) => {
  try {
    const response = await api.get('/api/analytics/dashboard', { params: normalizeParams(params) });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    throw error;
  }
};

/**
 * Fetches analytics for a specific module
 * @param {string} moduleId - The ID of the module
 * @returns {Promise<Object>} The module analytics data
 */
export const fetchModuleAnalytics = async (moduleId, params = {}) => {
  try {
    const response = await api.get(`/api/analytics/module/${moduleId}`, { params: normalizeParams(params) });
    return response.data;
  } catch (error) {
    console.error(`Error fetching analytics for module ${moduleId}:`, error);
    throw error;
  }
};

/**
 * Fetches performance predictions for the user
 * @returns {Promise<Object>} The performance predictions
 */
export const fetchPerformancePredictions = async () => {
  try {
    const response = await api.get('/api/analytics/predictions');
    return response.data;
  } catch (error) {
    console.error('Error fetching performance predictions:', error);
    throw error;
  }
};

/**
 * Fetches the user's learning activity timeline
 * @param {Object} params - Query parameters (e.g., timeRange)
 * @returns {Promise<Array>} The activity timeline data
 */
export const fetchActivityTimeline = async (params = {}) => {
  try {
    const response = await api.get('/api/analytics/activity-timeline', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    throw error;
  }
};

/**
 * Fetches comparative analytics (how the user compares to peers)
 * @returns {Promise<Object>} Comparative analytics data
 */
export const fetchComparativeAnalytics = async () => {
  try {
    const response = await api.get('/api/analytics/comparative');
    return response.data;
  } catch (error) {
    console.error('Error fetching comparative analytics:', error);
    throw error;
  }
};

/**
 * Fetches detailed assessment analytics
 * @param {string} assessmentId - The ID of the assessment
 * @returns {Promise<Object>} Detailed assessment analytics
 */
export const fetchAssessmentAnalytics = async (assessmentId) => {
  try {
    const response = await api.get(`/api/analytics/assessments/${assessmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching analytics for assessment ${assessmentId}:`, error);
    throw error;
  }
};

export default {
  fetchDashboardAnalytics,
  fetchModuleAnalytics,
  fetchPerformancePredictions,
  fetchActivityTimeline,
  fetchComparativeAnalytics,
  fetchAssessmentAnalytics
};
