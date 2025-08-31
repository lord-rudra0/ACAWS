import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/auth.js';
import * as AnalyticsService from '../services/analyticsService.js';

const router = express.Router();

// Helper function to handle errors
const handleError = (res, error, context) => {
  console.error(`${context} error:`, error);
  res.status(500).json({
    success: false,
    message: `Failed to ${context}`,
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

/**
 * @route GET /api/analytics/dashboard
 * @desc Get comprehensive learning analytics for the authenticated user
 * @access Private
 */
router.get('/dashboard', requireRole(['student','educator','admin']), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const analytics = await AnalyticsService.getUserLearningAnalytics(userId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'fetch analytics');
  }
}));

/**
 * @route GET /api/analytics/predictions
 * @desc Get performance predictions and recommendations
 * @access Private
 */
router.get('/predictions', requireRole(['student','educator','admin']), asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const predictions = await AnalyticsService.getPerformancePredictions(userId);
    res.json({ success: true, data: predictions });
  } catch (error) {
    handleError(res, error, 'generate predictions');
  }
}));

/**
 * @route GET /api/analytics/module/:moduleId
 * @desc Get detailed analytics for a specific module
 * @access Private
 */
router.get('/module/:moduleId', requireRole(['student','educator','admin']), asyncHandler(async (req, res) => {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;
    const moduleProgress = await AnalyticsService.getModuleAnalytics(userId, moduleId);
    res.json({ success: true, data: moduleProgress });
  } catch (error) {
    handleError(res, error, 'fetch module analytics');
  }
}));

export default router;
