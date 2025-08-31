import LearningModule from '../models/LearningModule.js';
import UserModuleProgress from '../models/UserModuleProgress.js';
import AssessmentResult from '../models/AssessmentResult.js';
import { Types } from 'mongoose';

export const getUserLearningAnalytics = async (userId) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid user ID');
  }

  // Get module completion stats
  const moduleStats = await UserModuleProgress.aggregate([
    { $match: { user_id: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$module_id',
        completed: { $sum: { $cond: [{ $gte: ['$completion_percentage', 100] }, 1, 0] } },
        totalTimeSpent: { $sum: '$time_spent' },
        lastAccessed: { $max: '$last_accessed' },
        score: { $avg: { $ifNull: ['$quiz_scores.overall', 0] } },
        avgCompletion: { $avg: { $ifNull: ['$completion_percentage', 0] } }
      }
    },
    {
      $lookup: {
        from: 'learningmodules',
        localField: '_id',
        foreignField: '_id',
        as: 'module'
      }
    },
    { $unwind: '$module' },
    {
      $project: {
        moduleName: '$module.title',
        completed: 1,
        totalTimeSpent: 1,
        lastAccessed: 1,
        score: { $ifNull: ['$score', 0] },
        completionPercentage: { $ifNull: ['$avgCompletion', 0] }
      }
    }
  ]);

  // Calculate overall progress using UserModuleProgress
  const overallProgress = await UserModuleProgress.aggregate([
    { $match: { user_id: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalModulesSet: { $addToSet: '$module_id' },
        completedModules: {
          $sum: { $cond: [{ $gte: ['$completion_percentage', 100] }, 1, 0] }
        },
        totalTimeSpent: { $sum: '$time_spent' },
        averageScore: { $avg: { $ifNull: ['$quiz_scores.overall', 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalModules: { $size: '$totalModulesSet' },
        completedModules: 1,
        completionPercentage: {
          $cond: [
            { $gt: [{ $size: '$totalModulesSet' }, 0] },
            {
              $multiply: [
                { $divide: ['$completedModules', { $size: '$totalModulesSet' }] },
                100
              ]
            },
            0
          ]
        },
        totalTimeSpent: 1,
        averageScore: { $ifNull: ['$averageScore', 0] }
      }
    }
  ]);

  // Get learning activity timeline using last_accessed from UserModuleProgress
  const activityTimeline = await UserModuleProgress.aggregate([
    { $match: { user_id: new Types.ObjectId(userId), last_accessed: { $ne: null } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$last_accessed' } },
        activities: { $sum: 1 },
        timeSpent: { $sum: '$time_spent' },
        modulesAccessed: { $addToSet: '$module_id' }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: '$_id',
        _id: 0,
        activities: 1,
        timeSpent: 1,
        modulesAccessed: { $size: '$modulesAccessed' }
      }
    }
  ]);

  return {
    moduleStats,
    overallProgress: overallProgress[0] || {
      totalModules: 0,
      completedModules: 0,
      completionPercentage: 0,
      totalTimeSpent: 0,
      averageScore: 0
    },
    activityTimeline
  };
};

export const getPerformancePredictions = async (userId) => {
  // This would integrate with ML model in production
  // For now, we'll return some basic predictions based on current progress
  const progress = await UserModuleProgress.aggregate([
    { $match: { user_id: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: { $ifNull: ['$quiz_scores.overall', 0] } },
        completionRate: { $avg: { $divide: [{ $ifNull: ['$completion_percentage', 0] }, 100] } },
        timePerModule: { $avg: '$time_spent' }
      }
    }
  ]);

  const stats = progress[0] || {
    avgScore: 0,
    completionRate: 0,
    timePerModule: 0
  };

  // Simple prediction algorithm (would be replaced with ML model)
  const predictionScore = Math.min(
    100,
    Math.round(
      (stats.avgScore * 0.6 +
        stats.completionRate * 100 * 0.3 +
        (1 - Math.min(1, stats.timePerModule / 3600)) * 0.1) *
        10
    ) / 10
  );

  return {
    predictedPerformance: predictionScore,
    confidence: Math.min(90, Math.max(60, Math.round(predictionScore * 0.9))),
    improvementAreas: getImprovementAreas(stats),
    nextSteps: getRecommendedNextSteps(stats)
  };
};

function getImprovementAreas(stats) {
  const areas = [];
  if (stats.avgScore < 70) areas.push('concept mastery');
  if (stats.completionRate < 0.7) areas.push('module completion');
  if (stats.timePerModule < 600) areas.push('time spent learning');
  return areas.length > 0 ? areas : ['No critical areas identified'];
}

function getRecommendedNextSteps(stats) {
  const steps = [
    'Review previous modules with scores below 80%',
    'Complete all pending lessons',
    'Take practice quizzes to reinforce learning'
  ];
  
  if (stats.avgScore < 70) {
    steps.unshift('Focus on understanding core concepts before moving forward');
  }
  
  return steps;
}

/**
 * Get detailed analytics for a specific module
 * @param {string} userId - The ID of the user
 * @param {string} moduleId - The ID of the module
 * @returns {Promise<Object>} Module analytics data
 */
export const getModuleAnalytics = async (userId, moduleId) => {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(moduleId)) {
    throw new Error('Invalid user ID or module ID');
  }

  // Get module details with user progress
  const moduleData = await LearningModule.aggregate([
    { $match: { _id: new Types.ObjectId(moduleId) } },
    {
      $lookup: {
        from: 'usermoduleprogresses',
        let: { moduleId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$module_id', '$$moduleId'] },
                  { $eq: ['$user_id', new Types.ObjectId(userId)] }
                ]
              }
            }
          },
          {
            $project: {
              _id: 1,
              completion_percentage: 1,
              time_spent: 1,
              quiz_scores: 1,
              last_accessed: 1
            }
          }
        ],
        as: 'userProgress'
      }
    },
    { $unwind: { path: '$userProgress', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        category: 1,
        difficulty: 1,
        // LearningModule schema has no lessons array; set totals later
        userProgress: {
          $ifNull: [
            '$userProgress',
            {
              completion_percentage: 0,
              time_spent: 0,
              quiz_scores: { overall: 0 },
              last_accessed: null
            }
          ]
        },
        averageScore: 1,
        completionRate: 1
      }
    }
  ]);

  if (!moduleData || moduleData.length === 0) {
    throw new Error('Module not found');
  }

  const module = moduleData[0];
  
  // No per-lesson structure available in schema
  const lessonStats = [];

  // Get assessment results
  const assessmentResults = await AssessmentResult.aggregate([
    {
      $match: {
        user_id: new Types.ObjectId(userId),
        module_id: new Types.ObjectId(moduleId)
      }
    },
    {
      $project: {
        _id: 1,
        score: 1,
        timeSpent: '$time_taken',
        completedAt: '$created_at'
      }
    },
    { $sort: { completedAt: -1 } }
  ]);

  // Calculate module statistics
  const totalLessons = 0;
  const completedLessons = 0;
  const totalTimeSpent = module.userProgress.time_spent || 0;
  const averageScore = assessmentResults.length > 0
    ? assessmentResults.reduce((sum, result) => sum + result.score, 0) / assessmentResults.length
    : 0;

  return {
    module: {
      _id: module._id,
      title: module.title,
      description: module.description,
      category: module.category,
      difficulty: module.difficulty,
      totalLessons,
      totalAssessments: assessmentResults.length
    },
    progress: {
      completed: (module.userProgress.completion_percentage || 0) >= 100,
      completionPercentage: module.userProgress.completion_percentage || 0,
      timeSpent: module.userProgress.time_spent || 0,
      lastAccessed: module.userProgress.last_accessed,
      completedLessons,
      totalLessons,
      averageScore: Math.round(averageScore * 10) / 10
    },
    lessons: lessonStats,
    assessments: assessmentResults,
    metrics: await calculateLearningMetrics(userId, moduleId, {
      lessonStats,
      assessmentResults,
      totalTimeSpent
    })
  };
};

/**
 * Calculate advanced learning metrics
 */
async function calculateLearningMetrics(userId, moduleId, { lessonStats, assessmentResults, totalTimeSpent }) {
  // Calculate engagement score (0-100)
  const engagementScore = calculateEngagementScore(lessonStats, assessmentResults);
  
  // Calculate knowledge retention
  const retentionRate = calculateRetentionRate(assessmentResults);
  
  // Calculate learning velocity
  const velocity = calculateLearningVelocity(lessonStats);
  
  // Calculate time efficiency
  const efficiency = calculateTimeEfficiency(lessonStats, assessmentResults, totalTimeSpent);
  
  // Generate insights
  const insights = generateInsights({
    engagementScore,
    retentionRate,
    velocity,
    efficiency,
    assessmentResults,
    lessonStats
  });
  
  return {
    engagementScore,
    retentionRate,
    learningVelocity: velocity,
    timeEfficiency: efficiency,
    insights,
    strengths: identifyStrengths(assessmentResults),
    areasForImprovement: identifyImprovementAreas(assessmentResults, lessonStats)
  };
}

function calculateEngagementScore(lessonStats, assessmentResults) {
  // Calculate based on lesson completion, time spent, and assessment attempts
  const completionRate = lessonStats.length > 0 
    ? (lessonStats.filter(l => l.completed).length / lessonStats.length) * 100 
    : 0;
    
  const avgTimeSpent = lessonStats.length > 0
    ? lessonStats.reduce((sum, l) => sum + (l.timeSpent || 0), 0) / lessonStats.length
    : 0;
    
  const assessmentAttempts = assessmentResults.length;
  
  // Weighted score (adjust weights as needed)
  return Math.min(100, Math.round(
    (completionRate * 0.5) + 
    (Math.min(avgTimeSpent / 60, 60) * 0.3) + // Cap at 60 minutes per lesson
    (Math.min(assessmentAttempts * 10, 20)) // Cap at 2 attempts
  ));
}

function calculateRetentionRate(assessmentResults) {
  if (assessmentResults.length < 2) return 0;
  
  // Sort by date
  const sorted = [...assessmentResults].sort((a, b) => 
    new Date(a.completedAt) - new Date(b.completedAt)
  );
  
  const firstScore = sorted[0].score;
  const lastScore = sorted[sorted.length - 1].score;
  
  // Calculate improvement or decline
  return Math.round(((lastScore - firstScore) / (100 - firstScore)) * 100) || 0;
}

function calculateLearningVelocity(lessonStats) {
  if (lessonStats.length < 2) return 0;
  
  // Sort by last accessed date
  const sorted = [...lessonStats]
    .filter(l => l.lastAccessed)
    .sort((a, b) => new Date(a.lastAccessed) - new Date(b.lastAccessed));
    
  if (sorted.length < 2) return 0;
  
  const firstDate = new Date(sorted[0].lastAccessed);
  const lastDate = new Date(sorted[sorted.length - 1].lastAccessed);
  const days = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
  
  if (days <= 0) return 0;
  
  // Lessons per day
  return Math.round((sorted.length / days) * 10) / 10;
}

function calculateTimeEfficiency(lessonStats, assessmentResults, totalTimeSpent) {
  if (assessmentResults.length === 0) return 0;
  
  const totalScore = assessmentResults.reduce((sum, a) => sum + a.score, 0);
  const avgScore = totalScore / assessmentResults.length;
  
  // Convert minutes to hours for better scaling
  const hoursSpent = totalTimeSpent / 60;
  
  if (hoursSpent === 0) return 0;
  
  // Score points per hour
  return Math.round((avgScore / hoursSpent) * 10) / 10;
}

function generateInsights(metrics) {
  const insights = [];
  
  // Engagement insights
  if (metrics.engagementScore < 40) {
    insights.push('Your engagement is below average. Try setting aside dedicated time for learning.');
  } else if (metrics.engagementScore > 75) {
    insights.push('Great job staying engaged with the material!');
  }
  
  // Retention insights
  if (metrics.retentionRate > 20) {
    insights.push(`Your knowledge retention has improved by ${metrics.retentionRate}%. Keep it up!`);
  } else if (metrics.retentionRate < -10) {
    insights.push('Consider reviewing previous material to improve retention.');
  }
  
  // Velocity insights
  if (metrics.velocity > 2) {
    insights.push('You\'re moving through the material quickly. Make sure to review key concepts.');
  } else if (metrics.velocity < 0.5) {
    insights.push('You might want to increase your learning pace to stay on track.');
  }
  
  // Efficiency insights
  if (metrics.timeEfficiency > 10) {
    insights.push('You\'re learning efficiently - great use of your study time!');
  } else if (metrics.timeEfficiency < 5) {
    insights.push('Try focusing on active learning techniques to improve your study efficiency.');
  }
  
  return insights.length > 0 ? insights : [
    'Keep up the good work! Your learning metrics are looking solid.'
  ];
}

function identifyStrengths(assessmentResults) {
  if (assessmentResults.length === 0) return [];
  
  // Group by question type/category and calculate average scores
  const strengths = [];
  const categoryScores = {};
  
  assessmentResults.forEach(assessment => {
    (assessment.questions || []).forEach(q => {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { total: 0, count: 0 };
      }
      categoryScores[q.category].total += q.correct ? 1 : 0;
      categoryScores[q.category].count++;
    });
  });
  
  // Find categories with >80% accuracy
  Object.entries(categoryScores).forEach(([category, { total, count }]) => {
    const accuracy = (total / count) * 100;
    if (accuracy >= 80) {
      strengths.push({
        category,
        accuracy: Math.round(accuracy)
      });
    }
  });
  
  return strengths;
}

function identifyImprovementAreas(assessmentResults, lessonStats) {
  if (assessmentResults.length === 0) return [];
  
  const areas = [];
  const categoryScores = {};
  
  // Analyze assessment results
  assessmentResults.forEach(assessment => {
    (assessment.questions || []).forEach(q => {
      if (!categoryScores[q.category]) {
        categoryScores[q.category] = { correct: 0, total: 0 };
      }
      categoryScores[q.category].correct += q.correct ? 1 : 0;
      categoryScores[q.category].total++;
    });
  });
  
  // Find categories with <60% accuracy
  Object.entries(categoryScores).forEach(([category, { correct, total }]) => {
    const accuracy = (correct / total) * 100;
    if (accuracy < 60) {
      areas.push({
        category,
        accuracy: Math.round(accuracy),
        suggestions: getImprovementSuggestions(category)
      });
    }
  });
  
  // Check for incomplete lessons
  const incompleteLessons = lessonStats.filter(l => !l.completed);
  if (incompleteLessons.length > 0) {
    areas.push({
      category: 'Incomplete Lessons',
      count: incompleteLessons.length,
      suggestions: [
        'Complete pending lessons to improve overall understanding',
        'Review lesson materials before assessments'
      ]
    });
  }
  
  return areas;
}

function getImprovementSuggestions(category) {
  const suggestions = {
    'Problem Solving': [
      'Practice more exercises from this category',
      'Review solution approaches for similar problems',
      'Break down complex problems into smaller steps'
    ],
    'Theory': [
      'Review key concepts and definitions',
      'Create summary notes for quick reference',
      'Try explaining concepts to someone else'
    ],
    'Coding': [
      'Write more code examples',
      'Practice debugging techniques',
      'Review coding best practices'
    ],
    'Application': [
      'Work on real-world projects',
      'Connect concepts to practical examples',
      'Try teaching the material to reinforce understanding'
    ]
  };
  
  return suggestions[category] || [
    'Review related learning materials',
    'Practice more exercises',
    'Ask for help or clarification'
  ];
}
