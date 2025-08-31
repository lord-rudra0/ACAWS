import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireRole } from '../middleware/auth.js';
import * as AnalyticsService from '../services/analyticsService.js';
import mongoose from 'mongoose';
import LearningSession from '../models/LearningSession.js';
import UserModuleProgress from '../models/UserModuleProgress.js';
import WellnessEntry from '../models/WellnessEntry.js';
import LearningModule from '../models/LearningModule.js';

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

// New: Achievements derived from real data (no hardcode)
router.get('/achievements', requireRole(['student','educator','admin']), asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const daysToCheck = 60;
  const since = new Date(Date.now() - daysToCheck * 24 * 60 * 60 * 1000);

  // Streak calculation (sessions + wellness entries)
  const sessionDays = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: since } } },
    { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$started_at' } } } },
    { $group: { _id: '$date' } }
  ]);
  const wellnessDays = await WellnessEntry.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since } } },
    { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } } } },
    { $group: { _id: '$date' } }
  ]);
  const activeSet = new Set([ ...sessionDays.map(d => d._id), ...wellnessDays.map(d => d._id) ]);
  let currentStreak = 0; let bestStreak = 0; let day = new Date();
  for (let i = 0; i < daysToCheck; i++) {
    const key = day.toISOString().slice(0,10);
    if (activeSet.has(key)) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); } else { if (i === 0) currentStreak = 0; currentStreak = 0; }
    day.setDate(day.getDate() - 1);
  }

  // Averages last 7 days
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const attAgg = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: since7 } } },
    { $group: { _id: null, avg_attention: { $avg: '$attention_score' } } }
  ]);

  // Wellness score average from wellness entries using same formula as wellness route
  const wellnessDocs = await WellnessEntry.find({ user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since7 } }).select('mood_score stress_level energy_level');
  const wellnessScores = wellnessDocs.map(e => (e.mood_score * 0.3 + (11 - e.stress_level) * 0.3 + e.energy_level * 0.4) * 10);
  const avgWellness = wellnessScores.length ? wellnessScores.reduce((a,b)=>a+b,0) / wellnessScores.length : 0;

  // Modules completed
  const completedModules = await UserModuleProgress.countDocuments({ user_id: new mongoose.Types.ObjectId(userId), completion_percentage: 100 });

  const achievements = [
    { name: '7-Day Streak', earned: bestStreak >= 7, icon: '🔥' },
    { name: 'Focus Master', earned: (attAgg[0]?.avg_attention || 0) >= 80, icon: '🎯' },
    { name: 'Wellness Warrior', earned: avgWellness >= 80, icon: '💪' },
    { name: 'Learning Legend', earned: completedModules >= 5, icon: '🏆' }
  ];

  res.json({ success: true, achievements, streak: { current: currentStreak, best: bestStreak } });
}));

// New: Consolidated dashboard summary with real data
router.get('/dashboard-summary', requireRole(['student','educator','admin']), asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().slice(0,10);

  // Today attention average from sessions
  const todayAtt = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: new Date(`${todayStr}T00:00:00.000Z`) } } },
    { $group: { _id: null, avg_attention: { $avg: '$attention_score' } } }
  ]);
  const attentionToday = Math.round(todayAtt[0]?.avg_attention || 0);

  // Today wellness average from wellness entries (derived score)
  const wellnessTodayDocs = await WellnessEntry.find({ user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: new Date(`${todayStr}T00:00:00.000Z`) } })
    .select('mood_score stress_level energy_level');
  const wellnessTodayScores = wellnessTodayDocs.map(e => (e.mood_score * 0.3 + (11 - e.stress_level) * 0.3 + e.energy_level * 0.4) * 10);
  const wellnessScoreToday = Math.round(wellnessTodayScores.length ? (wellnessTodayScores.reduce((a,b)=>a+b,0) / wellnessTodayScores.length) : 0);

  // Learning distribution from module progress vs total active modules
  const [totalModules, progressDocs] = await Promise.all([
    LearningModule.countDocuments({ active: true }),
    UserModuleProgress.find({ user_id: new mongoose.Types.ObjectId(userId) }).select('completion_percentage')
  ]);
  const completed = progressDocs.filter(p => (p.completion_percentage || 0) >= 100).length;
  const inProgress = progressDocs.filter(p => (p.completion_percentage || 0) > 0 && (p.completion_percentage || 0) < 100).length;
  const started = completed + inProgress;
  const notStarted = Math.max(0, totalModules - started);
  const learningDistribution = {
    completed,
    in_progress: inProgress,
    not_started: notStarted,
    total_modules: totalModules
  };

  // Weekly performance last 7 days
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyAgg = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: since7 } } },
    { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$started_at' } }, attention_score: 1, focus_level: 1 } },
    { $group: { _id: '$date', attention: { $avg: '$attention_score' }, focus: { $avg: { $ifNull: ['$focus_level', '$attention_score'] } } } },
    { $project: { _id: 0, day: '$_id', attention: 1, focus: 1 } },
    { $sort: { day: 1 } }
  ]);

  // Streak and achievements
  // Reuse achievements endpoint computations (inline to avoid http call)
  const sessionDays = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } } },
    { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$started_at' } } } },
    { $group: { _id: '$date' } }
  ]);
  const wellnessDays = await WellnessEntry.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } } },
    { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } } } },
    { $group: { _id: '$date' } }
  ]);
  const activeSet = new Set([ ...sessionDays.map(d => d._id), ...wellnessDays.map(d => d._id) ]);
  let currentStreak = 0; let bestStreak = 0; let day = new Date();
  for (let i = 0; i < 60; i++) { const key = day.toISOString().slice(0,10); if (activeSet.has(key)) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak); } else { if (i === 0) currentStreak = 0; currentStreak = 0; } day.setDate(day.getDate() - 1); }

  const attAgg = await LearningSession.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId), started_at: { $gte: since7 } } },
    { $group: { _id: null, avg_attention: { $avg: '$attention_score' } } }
  ]);
  const wellnessDocs = await WellnessEntry.find({ user_id: new mongoose.Types.ObjectId(userId), created_at: { $gte: since7 } }).select('mood_score stress_level energy_level');
  const wellnessScores = wellnessDocs.map(e => (e.mood_score * 0.3 + (11 - e.stress_level) * 0.3 + e.energy_level * 0.4) * 10);
  const avgWellness7 = wellnessScores.length ? wellnessScores.reduce((a,b)=>a+b,0) / wellnessScores.length : 0;
  const achievements = [
    { name: '7-Day Streak', earned: bestStreak >= 7, icon: '🔥' },
    { name: 'Focus Master', earned: (attAgg[0]?.avg_attention || 0) >= 80, icon: '🎯' },
    { name: 'Wellness Warrior', earned: avgWellness7 >= 80, icon: '💪' },
    { name: 'Learning Legend', earned: completed >= 5, icon: '🏆' }
  ];

  res.json({
    success: true,
    summary: {
      wellnessScoreToday,
      attentionToday,
      learningDistribution,
      streak: { current: currentStreak, best: bestStreak },
      achievements,
      weeklyPerformance: weeklyAgg
    }
  });
}));
