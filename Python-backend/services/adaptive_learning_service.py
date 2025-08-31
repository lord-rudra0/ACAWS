import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import numpy as np
import json
import os

logger = logging.getLogger(__name__)

class AdaptiveLearningService:
    """Service for adaptive learning algorithms and content personalization"""
    
    def __init__(self):
        self.user_profiles = {}
        self.learning_paths = {}
        self.content_difficulty_levels = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3,
            'expert': 4
        }
        
        # Learning parameters
        self.adaptation_sensitivity = 0.7
        self.performance_window = 10  # Number of recent interactions to consider
        self.confusion_threshold = 0.6
        self.boredom_threshold = 0.4
        
    async def adapt_content(self, user_id: str, cognitive_state: Dict, 
                          current_content: Dict) -> Dict:
        """Adapt learning content based on cognitive state"""
        try:
            # Get or create user profile
            if user_id not in self.user_profiles:
                self.user_profiles[user_id] = self._create_user_profile(user_id)
            
            user_profile = self.user_profiles[user_id]
            
            # Update user profile with current state
            self._update_user_profile(user_profile, cognitive_state)
            
            # Determine adaptations needed
            adaptations = self._determine_adaptations(cognitive_state, user_profile)
            
            # Apply adaptations to content
            adapted_content = self._apply_adaptations(current_content, adaptations)
            
            # Log adaptation decision
            self._log_adaptation(user_id, cognitive_state, adaptations)
            
            return {
                "adapted_content": adapted_content,
                "adaptations_applied": adaptations,
                "user_profile_updated": True,
                "confidence": self._calculate_adaptation_confidence(cognitive_state),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Content adaptation failed: {e}")
            return {"error": str(e)}
    
    def _create_user_profile(self, user_id: str) -> Dict:
        """Create initial user learning profile"""
        return {
            "user_id": user_id,
            "learning_style": "visual",  # visual, auditory, kinesthetic
            "preferred_difficulty": "intermediate",
            "attention_patterns": [],
            "performance_history": [],
            "confusion_triggers": [],
            "optimal_session_length": 45,  # minutes
            "break_frequency": 25,  # minutes
            "created_at": datetime.now(),
            "last_updated": datetime.now()
        }
    
    def _update_user_profile(self, user_profile: Dict, cognitive_state: Dict):
        """Update user profile with new cognitive state data"""
        try:
            current_time = datetime.now()
            
            # Add attention data
            user_profile["attention_patterns"].append({
                "attention_score": cognitive_state.get("attention", 0),
                "timestamp": current_time
            })
            
            # Keep only recent attention data
            one_hour_ago = current_time - timedelta(hours=1)
            user_profile["attention_patterns"] = [
                ap for ap in user_profile["attention_patterns"] 
                if ap["timestamp"] > one_hour_ago
            ]
            
            # Update performance metrics
            if "learning_performance" in cognitive_state:
                user_profile["performance_history"].append({
                    "score": cognitive_state["learning_performance"],
                    "timestamp": current_time
                })
                
                # Keep only recent performance data
                user_profile["performance_history"] = user_profile["performance_history"][-20:]
            
            user_profile["last_updated"] = current_time
            
        except Exception as e:
            logger.error(f"User profile update failed: {e}")
    
    def _determine_adaptations(self, cognitive_state: Dict, user_profile: Dict) -> Dict:
        """Determine what adaptations are needed based on cognitive state"""
        adaptations = {
            "difficulty_adjustment": None,
            "explanation_style": None,
            "interactivity_level": None,
            "break_suggestion": False,
            "content_format": None,
            "pacing_adjustment": None
        }
        
        try:
            attention = cognitive_state.get("attention", 50) / 100
            confusion = cognitive_state.get("confusion", 0) / 100
            engagement = cognitive_state.get("engagement", 50) / 100
            fatigue = cognitive_state.get("fatigue", 0) / 100
            
            # Difficulty adjustment
            if confusion > self.confusion_threshold:
                adaptations["difficulty_adjustment"] = "decrease"
                adaptations["explanation_style"] = "detailed"
            elif engagement < self.boredom_threshold and confusion < 0.3:
                adaptations["difficulty_adjustment"] = "increase"
                adaptations["explanation_style"] = "concise"
            
            # Interactivity adjustment
            if attention < 0.5 or engagement < 0.5:
                adaptations["interactivity_level"] = "high"
            elif attention > 0.8 and engagement > 0.8:
                adaptations["interactivity_level"] = "low"
            else:
                adaptations["interactivity_level"] = "medium"
            
            # Break suggestion
            if fatigue > 0.7 or attention < 0.3:
                adaptations["break_suggestion"] = True
            
            # Content format adaptation
            if confusion > 0.5:
                adaptations["content_format"] = "visual"
            elif attention < 0.4:
                adaptations["content_format"] = "interactive"
            
            # Pacing adjustment
            if confusion > 0.6:
                adaptations["pacing_adjustment"] = "slower"
            elif engagement < 0.4 and confusion < 0.3:
                adaptations["pacing_adjustment"] = "faster"
            
            return adaptations
            
        except Exception as e:
            logger.error(f"Adaptation determination failed: {e}")
            return adaptations
    
    def _apply_adaptations(self, content: Dict, adaptations: Dict) -> Dict:
        """Apply determined adaptations to content"""
        try:
            adapted_content = content.copy()
            
            # Apply difficulty adjustment
            if adaptations["difficulty_adjustment"] == "decrease":
                adapted_content["difficulty_level"] = max(1, adapted_content.get("difficulty_level", 2) - 1)
                adapted_content["complexity_reduced"] = True
            elif adaptations["difficulty_adjustment"] == "increase":
                adapted_content["difficulty_level"] = min(4, adapted_content.get("difficulty_level", 2) + 1)
                adapted_content["complexity_increased"] = True
            
            # Apply explanation style
            if adaptations["explanation_style"] == "detailed":
                adapted_content["explanation_mode"] = "detailed"
                adapted_content["examples_included"] = True
            elif adaptations["explanation_style"] == "concise":
                adapted_content["explanation_mode"] = "concise"
                adapted_content["examples_included"] = False
            
            # Apply interactivity level
            adapted_content["interactivity_level"] = adaptations["interactivity_level"]
            
            if adaptations["interactivity_level"] == "high":
                adapted_content["interactive_elements"] = [
                    "quiz_questions",
                    "drag_drop_exercises",
                    "simulation_tools"
                ]
            elif adaptations["interactivity_level"] == "low":
                adapted_content["interactive_elements"] = ["basic_quiz"]
            
            # Apply content format
            if adaptations["content_format"]:
                adapted_content["primary_format"] = adaptations["content_format"]
            
            # Apply pacing
            if adaptations["pacing_adjustment"]:
                adapted_content["pacing"] = adaptations["pacing_adjustment"]
            
            return adapted_content
            
        except Exception as e:
            logger.error(f"Content adaptation failed: {e}")
            return content
    
    def _calculate_adaptation_confidence(self, cognitive_state: Dict) -> float:
        """Calculate confidence in adaptation decisions"""
        try:
            # Base confidence on data quality and consistency
            base_confidence = 0.7
            
            # Increase confidence if multiple indicators align
            indicators = [
                cognitive_state.get("attention", 50),
                cognitive_state.get("engagement", 50),
                100 - cognitive_state.get("confusion", 50),
                100 - cognitive_state.get("fatigue", 50)
            ]
            
            # Calculate variance - lower variance means more consistent data
            variance = np.var(indicators)
            confidence_boost = max(0, (100 - variance) / 100 * 0.3)
            
            return min(1.0, base_confidence + confidence_boost)
            
        except Exception as e:
            logger.error(f"Confidence calculation failed: {e}")
            return 0.5
    
    def _log_adaptation(self, user_id: str, cognitive_state: Dict, adaptations: Dict):
        """Log adaptation decisions for analysis"""
        try:
            log_entry = {
                "user_id": user_id,
                "cognitive_state": cognitive_state,
                "adaptations": adaptations,
                "timestamp": datetime.now().isoformat()
            }
            
            # In production, this would be saved to database
            logger.info(f"Adaptation logged for user {user_id}: {adaptations}")
            
        except Exception as e:
            logger.error(f"Adaptation logging failed: {e}")
    
    async def generate_learning_path(self, user_id: str, subject: str, 
                                   target_competency: str) -> Dict:
        """Generate personalized learning path"""
        try:
            if user_id not in self.user_profiles:
                self.user_profiles[user_id] = self._create_user_profile(user_id)
            
            user_profile = self.user_profiles[user_id]
            
            # Define learning modules for the subject
            modules = self._get_subject_modules(subject)
            
            # Personalize based on user profile
            personalized_path = self._personalize_learning_path(modules, user_profile, target_competency)
            
            # Store learning path
            path_id = f"{user_id}_{subject}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            self.learning_paths[path_id] = {
                "user_id": user_id,
                "subject": subject,
                "target_competency": target_competency,
                "modules": personalized_path,
                "created_at": datetime.now(),
                "progress": 0
            }
            
            return {
                "path_id": path_id,
                "learning_path": personalized_path,
                "estimated_duration": self._calculate_path_duration(personalized_path),
                "difficulty_progression": self._analyze_difficulty_progression(personalized_path),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Learning path generation failed: {e}")
            return {"error": str(e)}
    
    def _get_subject_modules(self, subject: str) -> List[Dict]:
        """Get available modules for a subject"""
        # Mock module data - in production, this would come from database
        modules_db = {
            "machine_learning": [
                {
                    "id": "ml_intro",
                    "title": "Introduction to Machine Learning",
                    "difficulty": "beginner",
                    "duration": 45,
                    "prerequisites": [],
                    "topics": ["Supervised Learning", "Unsupervised Learning", "Model Evaluation"]
                },
                {
                    "id": "ml_algorithms",
                    "title": "ML Algorithms Deep Dive",
                    "difficulty": "intermediate",
                    "duration": 60,
                    "prerequisites": ["ml_intro"],
                    "topics": ["Linear Regression", "Decision Trees", "SVM", "Neural Networks"]
                },
                {
                    "id": "deep_learning",
                    "title": "Deep Learning Fundamentals",
                    "difficulty": "advanced",
                    "duration": 90,
                    "prerequisites": ["ml_algorithms"],
                    "topics": ["CNNs", "RNNs", "Transformers", "GANs"]
                }
            ],
            "computer_vision": [
                {
                    "id": "cv_basics",
                    "title": "Computer Vision Basics",
                    "difficulty": "beginner",
                    "duration": 50,
                    "prerequisites": [],
                    "topics": ["Image Processing", "Feature Detection", "Object Recognition"]
                },
                {
                    "id": "cv_advanced",
                    "title": "Advanced Computer Vision",
                    "difficulty": "advanced",
                    "duration": 75,
                    "prerequisites": ["cv_basics"],
                    "topics": ["Deep Learning for CV", "Object Detection", "Semantic Segmentation"]
                }
            ]
        }
        
        return modules_db.get(subject, [])
    
    def _personalize_learning_path(self, modules: List[Dict], user_profile: Dict, 
                                 target_competency: str) -> List[Dict]:
        """Personalize learning path based on user profile"""
        try:
            personalized_modules = []
            
            for module in modules:
                personalized_module = module.copy()
                
                # Adjust based on user's preferred difficulty
                user_difficulty = user_profile.get("preferred_difficulty", "intermediate")
                
                # Adjust duration based on user's optimal session length
                optimal_length = user_profile.get("optimal_session_length", 45)
                if module["duration"] > optimal_length:
                    # Split into smaller sessions
                    sessions_needed = np.ceil(module["duration"] / optimal_length)
                    personalized_module["sessions"] = int(sessions_needed)
                    personalized_module["session_duration"] = optimal_length
                else:
                    personalized_module["sessions"] = 1
                    personalized_module["session_duration"] = module["duration"]
                
                # Add learning style adaptations
                learning_style = user_profile.get("learning_style", "visual")
                personalized_module["content_format"] = self._adapt_content_format(learning_style)
                
                # Add break recommendations
                personalized_module["break_intervals"] = user_profile.get("break_frequency", 25)
                
                personalized_modules.append(personalized_module)
            
            return personalized_modules
            
        except Exception as e:
            logger.error(f"Learning path personalization failed: {e}")
            return modules
    
    def _adapt_content_format(self, learning_style: str) -> Dict:
        """Adapt content format based on learning style"""
        formats = {
            "visual": {
                "primary": "diagrams_and_charts",
                "secondary": "infographics",
                "interactive": "visual_simulations"
            },
            "auditory": {
                "primary": "audio_explanations",
                "secondary": "podcasts",
                "interactive": "voice_interactions"
            },
            "kinesthetic": {
                "primary": "hands_on_exercises",
                "secondary": "interactive_demos",
                "interactive": "coding_challenges"
            }
        }
        
        return formats.get(learning_style, formats["visual"])
    
    def _calculate_path_duration(self, modules: List[Dict]) -> int:
        """Calculate total estimated duration for learning path"""
        total_duration = 0
        for module in modules:
            total_duration += module.get("duration", 0)
        return total_duration
    
    def _analyze_difficulty_progression(self, modules: List[Dict]) -> Dict:
        """Analyze difficulty progression in learning path"""
        difficulties = [self.content_difficulty_levels.get(m.get("difficulty", "intermediate"), 2) 
                      for m in modules]
        
        return {
            "start_difficulty": difficulties[0] if difficulties else 2,
            "end_difficulty": difficulties[-1] if difficulties else 2,
            "progression_type": "gradual" if len(set(difficulties)) > 1 else "consistent",
            "difficulty_jumps": len([i for i in range(1, len(difficulties)) 
                                   if difficulties[i] - difficulties[i-1] > 1])
        }
    
    async def recommend_next_content(self, user_id: str, current_performance: Dict) -> Dict:
        """Recommend next content based on current performance"""
        try:
            if user_id not in self.user_profiles:
                return {"error": "User profile not found"}
            
            user_profile = self.user_profiles[user_id]
            
            # Analyze current performance
            performance_score = current_performance.get("score", 0)
            time_taken = current_performance.get("time_taken", 0)
            mistakes = current_performance.get("mistakes", [])
            
            # Determine recommendation strategy
            if performance_score >= 85:
                # High performance - suggest advancement
                recommendation = {
                    "action": "advance",
                    "difficulty_change": "increase",
                    "content_type": "challenging_exercises",
                    "reasoning": "Excellent performance indicates readiness for more challenging content"
                }
            elif performance_score >= 70:
                # Good performance - continue current level
                recommendation = {
                    "action": "continue",
                    "difficulty_change": "maintain",
                    "content_type": "practice_exercises",
                    "reasoning": "Good progress, continue with similar difficulty level"
                }
            elif performance_score >= 50:
                # Moderate performance - provide additional practice
                recommendation = {
                    "action": "practice",
                    "difficulty_change": "maintain",
                    "content_type": "additional_examples",
                    "reasoning": "Additional practice needed to solidify understanding"
                }
            else:
                # Low performance - simplify and review
                recommendation = {
                    "action": "review",
                    "difficulty_change": "decrease",
                    "content_type": "simplified_explanation",
                    "reasoning": "Concepts need reinforcement with simpler explanations"
                }
            
            # Add specific content recommendations
            recommendation["specific_content"] = self._generate_specific_recommendations(
                recommendation["action"], mistakes, user_profile
            )
            
            return {
                "recommendation": recommendation,
                "confidence": self._calculate_recommendation_confidence(current_performance),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Content recommendation failed: {e}")
            return {"error": str(e)}
    
    def _generate_specific_recommendations(self, action: str, mistakes: List, 
                                        user_profile: Dict) -> List[Dict]:
        """Generate specific content recommendations"""
        recommendations = []
        
        try:
            if action == "advance":
                recommendations = [
                    {"type": "advanced_tutorial", "title": "Advanced Concepts", "priority": "high"},
                    {"type": "project_challenge", "title": "Capstone Project", "priority": "medium"},
                    {"type": "peer_collaboration", "title": "Group Challenge", "priority": "low"}
                ]
            elif action == "practice":
                recommendations = [
                    {"type": "practice_quiz", "title": "Concept Reinforcement", "priority": "high"},
                    {"type": "worked_examples", "title": "Step-by-step Examples", "priority": "medium"},
                    {"type": "flashcards", "title": "Key Terms Review", "priority": "low"}
                ]
            elif action == "review":
                recommendations = [
                    {"type": "basic_tutorial", "title": "Concept Review", "priority": "high"},
                    {"type": "visual_explanation", "title": "Visual Learning Aid", "priority": "high"},
                    {"type": "simple_quiz", "title": "Basic Understanding Check", "priority": "medium"}
                ]
            
            # Customize based on learning style
            learning_style = user_profile.get("learning_style", "visual")
            if learning_style == "visual":
                recommendations.append({
                    "type": "infographic", 
                    "title": "Visual Summary", 
                    "priority": "medium"
                })
            elif learning_style == "auditory":
                recommendations.append({
                    "type": "audio_explanation", 
                    "title": "Audio Learning", 
                    "priority": "medium"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Specific recommendations generation failed: {e}")
            return []
    
    def _calculate_recommendation_confidence(self, performance_data: Dict) -> float:
        """Calculate confidence in recommendation"""
        try:
            # Base confidence on data completeness and consistency
            base_confidence = 0.6
            
            # Increase confidence if we have complete performance data
            if all(key in performance_data for key in ["score", "time_taken", "mistakes"]):
                base_confidence += 0.2
            
            # Increase confidence for extreme scores (very high or very low)
            score = performance_data.get("score", 50)
            if score >= 90 or score <= 30:
                base_confidence += 0.2
            
            return min(1.0, base_confidence)
            
        except Exception as e:
            logger.error(f"Recommendation confidence calculation failed: {e}")
            return 0.5
    
    async def analyze_learning_patterns(self, user_id: str) -> Dict:
        """Analyze user's learning patterns and provide insights"""
        try:
            if user_id not in self.user_profiles:
                return {"error": "User profile not found"}
            
            user_profile = self.user_profiles[user_id]
            
            # Analyze attention patterns
            attention_analysis = self._analyze_attention_patterns(user_profile["attention_patterns"])
            
            # Analyze performance trends
            performance_analysis = self._analyze_performance_trends(user_profile["performance_history"])
            
            # Generate insights
            insights = self._generate_learning_insights(attention_analysis, performance_analysis)
            
            return {
                "attention_analysis": attention_analysis,
                "performance_analysis": performance_analysis,
                "insights": insights,
                "recommendations": self._generate_learning_recommendations(insights),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Learning pattern analysis failed: {e}")
            return {"error": str(e)}
    
    def _analyze_attention_patterns(self, attention_data: List[Dict]) -> Dict:
        """Analyze attention patterns over time"""
        if not attention_data:
            return {"error": "No attention data available"}
        
        scores = [ap["attention_score"] for ap in attention_data]
        
        return {
            "average_attention": np.mean(scores),
            "attention_variance": np.var(scores),
            "peak_attention_time": self._find_peak_attention_time(attention_data),
            "attention_trend": "improving" if len(scores) > 5 and scores[-3:] > scores[:3] else "stable"
        }
    
    def _analyze_performance_trends(self, performance_data: List[Dict]) -> Dict:
        """Analyze performance trends over time"""
        if not performance_data:
            return {"error": "No performance data available"}
        
        scores = [ph["score"] for ph in performance_data]
        
        return {
            "average_performance": np.mean(scores),
            "performance_variance": np.var(scores),
            "improvement_rate": self._calculate_improvement_rate(scores),
            "consistency_score": 100 - (np.std(scores) / np.mean(scores) * 100) if np.mean(scores) > 0 else 0
        }
    
    def _find_peak_attention_time(self, attention_data: List[Dict]) -> str:
        """Find the time of day when attention is typically highest"""
        # Group by hour and find average attention
        hourly_attention = {}
        
        for data in attention_data:
            hour = data["timestamp"].hour
            if hour not in hourly_attention:
                hourly_attention[hour] = []
            hourly_attention[hour].append(data["attention_score"])
        
        # Calculate average for each hour
        hourly_averages = {hour: np.mean(scores) for hour, scores in hourly_attention.items()}
        
        if not hourly_averages:
            return "unknown"
        
        peak_hour = max(hourly_averages, key=hourly_averages.get)
        return f"{peak_hour:02d}:00"
    
    def _calculate_improvement_rate(self, scores: List[float]) -> float:
        """Calculate rate of improvement in performance"""
        if len(scores) < 3:
            return 0
        
        # Simple linear regression to find trend
        x = np.arange(len(scores))
        y = np.array(scores)
        
        # Calculate slope
        slope = np.polyfit(x, y, 1)[0]
        
        return slope
    
    def _generate_learning_insights(self, attention_analysis: Dict, 
                                  performance_analysis: Dict) -> List[str]:
        """Generate actionable learning insights"""
        insights = []
        
        try:
            # Attention insights
            avg_attention = attention_analysis.get("average_attention", 0)
            if avg_attention > 80:
                insights.append("Your attention levels are excellent! You're in an optimal learning state.")
            elif avg_attention > 60:
                insights.append("Good attention levels. Consider optimizing your study environment.")
            else:
                insights.append("Attention could be improved. Try shorter study sessions with more breaks.")
            
            # Performance insights
            avg_performance = performance_analysis.get("average_performance", 0)
            improvement_rate = performance_analysis.get("improvement_rate", 0)
            
            if improvement_rate > 2:
                insights.append("You're showing excellent improvement! Keep up the current study approach.")
            elif improvement_rate > 0:
                insights.append("Steady progress detected. Consider increasing challenge level gradually.")
            else:
                insights.append("Performance has plateaued. Try different learning strategies or take a break.")
            
            # Peak time insight
            peak_time = attention_analysis.get("peak_attention_time")
            if peak_time and peak_time != "unknown":
                insights.append(f"Your attention peaks around {peak_time}. Schedule challenging topics during this time.")
            
            return insights
            
        except Exception as e:
            logger.error(f"Insight generation failed: {e}")
            return ["Unable to generate insights at this time."]
    
    def _generate_learning_recommendations(self, insights: List[str]) -> List[Dict]:
        """Generate actionable recommendations based on insights"""
        recommendations = [
            {
                "type": "study_schedule",
                "title": "Optimize Study Schedule",
                "description": "Align challenging topics with your peak attention times",
                "priority": "high"
            },
            {
                "type": "break_strategy",
                "title": "Implement Smart Breaks",
                "description": "Use attention data to time your breaks optimally",
                "priority": "medium"
            },
            {
                "type": "content_adaptation",
                "title": "Enable Full Adaptation",
                "description": "Let ACAWS automatically adjust content difficulty",
                "priority": "medium"
            }
        ]
        
        return recommendations