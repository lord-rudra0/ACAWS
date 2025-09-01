#!/usr/bin/env node

/**
 * Script to identify and clean up duplicate wellness code
 * Run with: node cleanup_duplicate_wellness.js
 */

const fs = require('fs');
const path = require('path');

// Directories to scan
const directories = [
  'src/components',
  'src/pages',
  'src/services',
  'src/utils'
];

// Wellness-related patterns to look for
const wellnessPatterns = [
  'wellness',
  'Wellness',
  'WELLNESS',
  'mood',
  'stress',
  'energy',
  'sleep',
  'activity',
  'nutrition',
  'hydration'
];

// Files that should be kept (main wellness files)
const keepFiles = [
  'src/pages/Wellness.jsx',
  'src/services/api.js' // Contains wellness API calls
];

// Files that might have duplicate wellness code
const potentialDuplicates = [
  'src/components/SmartRecommendationEngine.jsx',
  'src/components/AIAssistant.jsx',
  'src/components/AITutorEnhanced.jsx',
  'src/components/EnhancedCameraAnalysis.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Community.jsx',
  'src/pages/Home.jsx'
];

console.log('🔍 Scanning for duplicate wellness code...\n');

// Function to scan a file for wellness patterns
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const wellnessLines = [];
    
    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      if (wellnessPatterns.some(pattern => lineLower.includes(pattern.toLowerCase()))) {
        wellnessLines.push({
          lineNumber: index + 1,
          content: line.trim(),
          pattern: wellnessPatterns.find(p => lineLower.includes(p.toLowerCase()))
        });
      }
    });
    
    return wellnessLines;
  } catch (error) {
    return [];
  }
}

// Function to analyze wellness code distribution
function analyzeWellnessCode() {
  const analysis = {
    totalFiles: 0,
    wellnessFiles: 0,
    duplicatePatterns: [],
    recommendations: []
  };
  
  // Scan all potential duplicate files
  potentialDuplicates.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      analysis.totalFiles++;
      const wellnessLines = scanFile(filePath);
      
      if (wellnessLines.length > 0) {
        analysis.wellnessFiles++;
        analysis.duplicatePatterns.push({
          file: filePath,
          lines: wellnessLines,
          count: wellnessLines.length
        });
      }
    }
  });
  
  return analysis;
}

// Function to generate cleanup recommendations
function generateRecommendations(analysis) {
  const recommendations = [];
  
  if (analysis.duplicatePatterns.length > 0) {
    recommendations.push('🚨 DUPLICATE WELLNESS CODE FOUND:');
    
    analysis.duplicatePatterns.forEach(({ file, lines, count }) => {
      recommendations.push(`\n📁 ${file} (${count} wellness-related lines):`);
      
      lines.slice(0, 5).forEach(({ lineNumber, content, pattern }) => {
        recommendations.push(`   Line ${lineNumber}: ${content.substring(0, 80)}... (${pattern})`);
      });
      
      if (lines.length > 5) {
        recommendations.push(`   ... and ${lines.length - 5} more lines`);
      }
    });
    
    recommendations.push('\n💡 RECOMMENDATIONS:');
    recommendations.push('1. Consolidate wellness logic into Wellness.jsx');
    recommendations.push('2. Create shared wellness utilities in src/utils/wellness.js');
    recommendations.push('3. Remove duplicate wellness calculations from other components');
    recommendations.push('4. Use the centralized wellness API service');
  } else {
    recommendations.push('✅ No duplicate wellness code found!');
  }
  
  return recommendations;
}

// Function to create wellness utilities file
function createWellnessUtilities() {
  const utilitiesPath = 'src/utils/wellness.js';
  const utilitiesContent = `/**
 * Centralized wellness utilities
 * Consolidate all wellness-related calculations and helpers here
 */

// Wellness score calculation
export const calculateWellnessScore = (metrics) => {
  const { mood, stress, energy, sleep, activity, nutrition, hydration } = metrics;
  
  let score = 0;
  score += (mood / 10) * 25; // 25% weight
  score += ((10 - stress) / 10) * 25; // 25% weight (inverted)
  score += (energy / 10) * 20; // 20% weight
  score += (sleep / 10) * 15; // 15% weight
  score += (activity / 10) * 10; // 10% weight
  score += (nutrition / 10) * 3; // 3% weight
  score += (hydration / 10) * 2; // 2% weight
  
  return Math.round(score);
};

// Wellness category classification
export const getWellnessCategory = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
};

// Wellness recommendations
export const getWellnessRecommendations = (metrics) => {
  const recommendations = [];
  
  if (metrics.mood < 5) {
    recommendations.push('Consider mood-boosting activities like exercise or social interaction');
  }
  
  if (metrics.stress > 7) {
    recommendations.push('High stress detected. Try deep breathing or meditation');
  }
  
  if (metrics.energy < 5) {
    recommendations.push('Low energy. Consider better sleep or nutrition');
  }
  
  if (metrics.sleep < 6) {
    recommendations.push('Insufficient sleep. Aim for 7-9 hours per night');
  }
  
  if (metrics.activity < 30) {
    recommendations.push('Low activity. Try to get at least 30 minutes of exercise');
  }
  
  return recommendations;
};

// Wellness data validation
export const validateWellnessData = (data) => {
  const errors = [];
  
  if (!data.mood || data.mood < 1 || data.mood > 10) {
    errors.push('Mood score must be between 1-10');
  }
  
  if (!data.stress || data.stress < 1 || data.stress > 10) {
    errors.push('Stress level must be between 1-10');
  }
  
  if (!data.energy || data.energy < 1 || data.energy > 10) {
    errors.push('Energy level must be between 1-10');
  }
  
  return errors;
};

// Wellness trends analysis
export const analyzeWellnessTrends = (wellnessHistory) => {
  if (wellnessHistory.length < 2) {
    return { trend: 'insufficient_data', message: 'Need more data for trend analysis' };
  }
  
  const recent = wellnessHistory.slice(-7);
  const previous = wellnessHistory.slice(-14, -7);
  
  const recentAvg = recent.reduce((sum, entry) => sum + entry.score, 0) / recent.length;
  const previousAvg = previous.reduce((sum, entry) => sum + entry.score, 0) / previous.length;
  
  const change = recentAvg - previousAvg;
  
  if (change > 5) return { trend: 'improving', change: Math.round(change) };
  if (change < -5) return { trend: 'declining', change: Math.round(Math.abs(change)) };
  return { trend: 'stable', change: Math.round(Math.abs(change)) };
};
`;

  try {
    if (!fs.existsSync('src/utils')) {
      fs.mkdirSync('src/utils', { recursive: true });
    }
    
    fs.writeFileSync(utilitiesPath, utilitiesContent);
    console.log('✅ Created wellness utilities file: src/utils/wellness.js');
  } catch (error) {
    console.error('❌ Failed to create wellness utilities file:', error.message);
  }
}

// Main execution
function main() {
  console.log('🧹 WELLNESS CODE CLEANUP SCRIPT\n');
  
  // Analyze current state
  const analysis = analyzeWellnessCode();
  
  // Generate recommendations
  const recommendations = generateRecommendations(analysis);
  
  // Display results
  recommendations.forEach(rec => console.log(rec));
  
  // Create wellness utilities
  console.log('\n🔧 Creating wellness utilities...');
  createWellnessUtilities();
  
  console.log('\n📋 SUMMARY:');
  console.log(`- Total files scanned: ${analysis.totalFiles}`);
  console.log(`- Files with wellness code: ${analysis.wellnessFiles}`);
  console.log(`- Duplicate patterns found: ${analysis.duplicatePatterns.length}`);
  
  if (analysis.duplicatePatterns.length > 0) {
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Run: npm install (to remove heavy dependencies)');
    console.log('2. Review duplicate wellness code in the files above');
    console.log('3. Refactor components to use centralized wellness utilities');
    console.log('4. Test the application to ensure functionality is maintained');
  }
  
  console.log('\n✨ Cleanup script completed!');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeWellnessCode,
  generateRecommendations,
  createWellnessUtilities
};
