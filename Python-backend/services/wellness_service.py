import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np
import json
from services.wellness_ml_model import wellness_ml_model

logger = logging.getLogger(__name__)

class WellnessService:
    """Service for comprehensive wellness tracking and recommendations"""
    
    def __init__(self):
        self.wellness_profiles = {}
        self.mood_history = {}
        self.stress_patterns = {}
        self.break_recommendations = {}
        
        # Wellness thresholds
        self.stress_threshold = 7  # out of 10
        self.fatigue_threshold = 0.7
        self.mood_concern_threshold = 3  # out of 10
        
    async def track_wellness_metrics(self, user_id: str, metrics: Dict) -> Dict:
        """Track comprehensive wellness metrics, supporting dynamic fields"""
        try:
            current_time = datetime.now()
            
            # Initialize user wellness profile if not exists
            if user_id not in self.wellness_profiles:
                self.wellness_profiles[user_id] = self._create_wellness_profile(user_id)
            
            profile = self.wellness_profiles[user_id]
            
            # Add data to ML model for training and analysis
            wellness_ml_model.add_user_data(user_id, metrics, current_time)
            
            # Process different metric types
            processed_metrics = {
                "mood_score": self._process_mood_data(metrics.get("mood", {})),
                "stress_level": self._process_stress_data(metrics.get("stress", {})),
                "energy_level": self._process_energy_data(metrics.get("energy", {})),
                "sleep_quality": self._process_sleep_data(metrics.get("sleep", {})),
                "physical_activity": self._process_activity_data(metrics.get("activity", {})),
                # New dynamic fields
                "nutrition": metrics.get("nutrition", {}),
                "hydration": metrics.get("hydration", {}),
                "screen_time": metrics.get("screen_time", {}),
            }
            
            # Store any extra/unknown fields for future ML use
            extra_fields = {k: v for k, v in metrics.items() if k not in processed_metrics}
            
            # Use ML model for wellness score prediction
            ml_prediction = wellness_ml_model.predict_wellness(user_id, metrics)
            wellness_score = ml_prediction['wellness_score']
            
            # Update profile
            self._update_wellness_profile(profile, processed_metrics, wellness_score)
            
            # Generate recommendations
            recommendations = self._generate_wellness_recommendations(processed_metrics, profile)
            
            # Check for alerts
            alerts = self._check_wellness_alerts(processed_metrics, profile)
            
            return {
                "wellness_score": wellness_score,
                "metrics": processed_metrics,
                "extra_fields": extra_fields,
                "recommendations": recommendations,
                "alerts": alerts,
                "trends": self._analyze_wellness_trends(profile),
                "ml_prediction": ml_prediction,  # Include full ML prediction result
                "timestamp": current_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Wellness tracking failed: {e}")
            return {"error": str(e)}
    
    def _create_wellness_profile(self, user_id: str) -> Dict:
        """Create initial wellness profile for user"""
        return {
            "user_id": user_id,
            "wellness_history": [],
            "mood_patterns": [],
            "stress_triggers": [],
            "optimal_break_intervals": 25,  # minutes
            "preferred_wellness_activities": [],
            "baseline_metrics": {},
            "created_at": datetime.now(),
            "last_updated": datetime.now()
        }
    
    def _process_mood_data(self, mood_data: Dict) -> Dict:
        """Process mood-related data"""
        try:
            mood_score = mood_data.get("score", 5)  # 1-10 scale
            mood_tags = mood_data.get("tags", [])
            mood_note = mood_data.get("note", "")
            
            # Analyze mood context
            context_factors = self._analyze_mood_context(mood_tags, mood_note)
            
            return {
                "score": mood_score,
                "category": self._categorize_mood(mood_score),
                "tags": mood_tags,
                "note": mood_note,
                "context_factors": context_factors,
                "concern_level": "high" if mood_score <= self.mood_concern_threshold else "normal"
            }
            
        except Exception as e:
            logger.error(f"Mood data processing failed: {e}")
            return {"score": 5, "category": "neutral", "tags": [], "note": "", "concern_level": "normal"}
    
    def _process_stress_data(self, stress_data: Dict) -> Dict:
        """Process stress-related data"""
        try:
            stress_level = stress_data.get("level", 5)  # 1-10 scale
            stress_sources = stress_data.get("sources", [])
            
            return {
                "level": stress_level,
                "category": self._categorize_stress(stress_level),
                "sources": stress_sources,
                "intervention_needed": stress_level >= self.stress_threshold
            }
            
        except Exception as e:
            logger.error(f"Stress data processing failed: {e}")
            return {"level": 5, "category": "moderate", "sources": [], "intervention_needed": False}
    
    def _process_energy_data(self, energy_data: Dict) -> Dict:
        """Process energy level data"""
        try:
            energy_level = energy_data.get("level", 5)  # 1-10 scale
            
            return {
                "level": energy_level,
                "category": self._categorize_energy(energy_level),
                "optimal_for_learning": energy_level >= 6
            }
            
        except Exception as e:
            logger.error(f"Energy data processing failed: {e}")
            return {"level": 5, "category": "moderate", "optimal_for_learning": True}
    
    def _analyze_mood_context(self, tags: List[str], note: str) -> Dict:
        """Analyze mood context from tags and notes"""
        try:
            context = {
                "positive_factors": [],
                "negative_factors": [],
                "social_context": False,
                "work_context": False,
                "health_context": False
            }
            
            # Analyze tags
            positive_tags = ["happy", "excited", "motivated", "focused", "energetic", "calm", "relaxed"]
            negative_tags = ["sad", "angry", "frustrated", "tired", "stressed", "anxious", "depressed"]
            
            for tag in tags:
                if tag.lower() in positive_tags:
                    context["positive_factors"].append(tag)
                elif tag.lower() in negative_tags:
                    context["negative_factors"].append(tag)
            
            # Analyze note content
            note_lower = note.lower()
            if any(word in note_lower for word in ["friend", "family", "social", "party", "meeting"]):
                context["social_context"] = True
            if any(word in note_lower for word in ["work", "job", "project", "deadline", "meeting"]):
                context["work_context"] = True
            if any(word in note_lower for word in ["health", "exercise", "sleep", "diet", "meditation"]):
                context["health_context"] = True
            
            return context
            
        except Exception as e:
            logger.error(f"Mood context analysis failed: {e}")
            return {"positive_factors": [], "negative_factors": [], "social_context": False, "work_context": False, "health_context": False}

    def _process_sleep_data(self, sleep_data: Dict) -> Dict:
        """Process sleep quality data"""
        try:
            sleep_hours = sleep_data.get("hours", 7)
            sleep_quality = sleep_data.get("quality", "good")
            
            # Convert quality string to numeric if needed
            if isinstance(sleep_quality, str):
                quality_map = {"poor": 3, "fair": 5, "good": 7, "excellent": 9}
                sleep_quality = quality_map.get(sleep_quality.lower(), 7)
            
            return {
                "hours": sleep_hours,
                "quality": sleep_quality,
                "adequate": sleep_hours >= 7 and sleep_quality >= 6
            }
            
        except Exception as e:
            logger.error(f"Sleep data processing failed: {e}")
            return {"hours": 7, "quality": 7, "adequate": True}
    
    def _process_activity_data(self, activity_data: Dict) -> Dict:
        """Process physical activity data"""
        try:
            activity_minutes = activity_data.get("minutes", 30)
            activity_type = activity_data.get("type", "moderate")
            
            return {
                "minutes": activity_minutes,
                "type": activity_type,
                "sufficient": activity_minutes >= 30
            }
            
        except Exception as e:
            logger.error(f"Activity data processing failed: {e}")
            return {"minutes": 30, "type": "moderate", "sufficient": True}
    
    def _calculate_wellness_score(self, metrics: Dict) -> float:
        """Calculate overall wellness score from all metrics"""
        try:
            score = 0.0
            weights = {
                "mood_score": 0.25,
                "stress_level": 0.25,
                "energy_level": 0.20,
                "sleep_quality": 0.20,
                "physical_activity": 0.10
            }
            
            # Mood contribution (higher is better)
            mood_score = metrics["mood_score"]["score"]
            score += (mood_score / 10) * 100 * weights["mood_score"]
            
            # Stress contribution (lower is better)
            stress_level = metrics["stress_level"]["level"]
            score += ((10 - stress_level) / 10) * 100 * weights["stress_level"]
            
            # Energy contribution (higher is better)
            energy_level = metrics["energy_level"]["level"]
            score += (energy_level / 10) * 100 * weights["energy_level"]
            
            # Sleep contribution
            sleep_quality = metrics["sleep_quality"]["quality"]
            score += (sleep_quality / 10) * 100 * weights["sleep_quality"]
            
            # Activity contribution
            activity_sufficient = metrics["physical_activity"]["sufficient"]
            score += (100 if activity_sufficient else 50) * weights["physical_activity"]
            
            return min(100, max(0, score))
            
        except Exception as e:
            logger.error(f"Wellness score calculation failed: {e}")
            return 50.0
    
    def _categorize_mood(self, mood_score: float) -> str:
        """Categorize mood based on score"""
        if mood_score >= 8:
            return "excellent"
        elif mood_score >= 6:
            return "good"
        elif mood_score >= 4:
            return "fair"
        else:
            return "poor"
    
    def _categorize_stress(self, stress_level: float) -> str:
        """Categorize stress level"""
        if stress_level >= 8:
            return "high"
        elif stress_level >= 6:
            return "moderate"
        elif stress_level >= 4:
            return "low"
        else:
            return "minimal"
    
    def _categorize_energy(self, energy_level: float) -> str:
        """Categorize energy level"""
        if energy_level >= 8:
            return "high"
        elif energy_level >= 6:
            return "good"
        elif energy_level >= 4:
            return "moderate"
        else:
            return "low"
    
    def _update_wellness_profile(self, profile: Dict, metrics: Dict, wellness_score: float):
        """Update user wellness profile with new data"""
        try:
            current_time = datetime.now()
            
            # Add to wellness history
            profile["wellness_history"].append({
                "wellness_score": wellness_score,
                "metrics": metrics,
                "timestamp": current_time
            })
            
            # Keep only recent history (last 30 days)
            thirty_days_ago = current_time - timedelta(days=30)
            profile["wellness_history"] = [
                wh for wh in profile["wellness_history"] 
                if wh["timestamp"] > thirty_days_ago
            ]
            
            # Update mood patterns
            mood_score = metrics["mood_score"]["score"]
            profile["mood_patterns"].append({
                "score": mood_score,
                "timestamp": current_time
            })
            
            # Keep recent mood data
            profile["mood_patterns"] = profile["mood_patterns"][-100:]
            
            profile["last_updated"] = current_time
            
        except Exception as e:
            logger.error(f"Wellness profile update failed: {e}")
    
    def _generate_wellness_recommendations(self, metrics: Dict, profile: Dict) -> List[Dict]:
        """Generate personalized wellness recommendations"""
        recommendations = []
        
        try:
            # Mood-based recommendations
            mood_score = metrics["mood_score"]["score"]
            if mood_score <= 4:
                recommendations.append({
                    "type": "mood_improvement",
                    "title": "Mood Boost Activities",
                    "description": "Try a short walk, listen to uplifting music, or practice gratitude",
                    "priority": "high",
                    "estimated_time": "10-15 minutes"
                })
            
            # Stress-based recommendations
            stress_level = metrics["stress_level"]["level"]
            if stress_level >= 7:
                recommendations.append({
                    "type": "stress_reduction",
                    "title": "Stress Relief Techniques",
                    "description": "Practice deep breathing, progressive muscle relaxation, or meditation",
                    "priority": "high",
                    "estimated_time": "5-10 minutes"
                })
            
            # Energy-based recommendations
            energy_level = metrics["energy_level"]["level"]
            if energy_level <= 4:
                recommendations.append({
                    "type": "energy_boost",
                    "title": "Energy Enhancement",
                    "description": "Take a power nap, do light exercise, or have a healthy snack",
                    "priority": "medium",
                    "estimated_time": "15-20 minutes"
                })
            
            # Sleep-based recommendations
            if not metrics["sleep_quality"]["adequate"]:
                recommendations.append({
                    "type": "sleep_improvement",
                    "title": "Sleep Optimization",
                    "description": "Establish a bedtime routine and aim for 7-9 hours of sleep",
                    "priority": "medium",
                    "estimated_time": "ongoing"
                })
            
            # Activity-based recommendations
            if not metrics["physical_activity"]["sufficient"]:
                recommendations.append({
                    "type": "physical_activity",
                    "title": "Increase Physical Activity",
                    "description": "Add 30 minutes of moderate exercise to your daily routine",
                    "priority": "low",
                    "estimated_time": "30 minutes"
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Wellness recommendations generation failed: {e}")
            return []
    
    def _check_wellness_alerts(self, metrics: Dict, profile: Dict) -> List[Dict]:
        """Check for wellness alerts that need immediate attention"""
        alerts = []
        
        try:
            # High stress alert
            if metrics["stress_level"]["level"] >= 8:
                alerts.append({
                    "type": "high_stress",
                    "severity": "high",
                    "message": "High stress level detected. Consider taking a break.",
                    "action": "immediate_break"
                })
            
            # Low mood alert
            if metrics["mood_score"]["score"] <= 3:
                alerts.append({
                    "type": "low_mood",
                    "severity": "medium",
                    "message": "Low mood detected. Wellness support recommended.",
                    "action": "wellness_intervention"
                })
            
            # Fatigue alert
            if metrics.get("fatigue_score", 0) >= 70:
                alerts.append({
                    "type": "fatigue",
                    "severity": "high",
                    "message": "High fatigue detected. Rest is recommended.",
                    "action": "extended_break"
                })
            
            # Sleep deprivation alert
            if not metrics["sleep_quality"]["adequate"]:
                alerts.append({
                    "type": "sleep_deprivation",
                    "severity": "medium",
                    "message": "Inadequate sleep detected. Consider adjusting study intensity.",
                    "action": "reduce_intensity"
                })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Wellness alerts check failed: {e}")
            return []
    
    def _analyze_wellness_trends(self, profile: Dict) -> Dict:
        """Analyze wellness trends over time"""
        try:
            wellness_history = profile.get("wellness_history", [])
            
            if len(wellness_history) < 3:
                return {"error": "Insufficient data for trend analysis"}
            
            # Calculate trends
            recent_scores = [wh["wellness_score"] for wh in wellness_history[-7:]]  # Last 7 entries
            older_scores = [wh["wellness_score"] for wh in wellness_history[-14:-7]]  # Previous 7 entries
            
            if not older_scores:
                return {"trend": "insufficient_data"}
            
            recent_avg = np.mean(recent_scores)
            older_avg = np.mean(older_scores)
            
            trend_direction = "improving" if recent_avg > older_avg + 2 else \
                            "declining" if recent_avg < older_avg - 2 else "stable"
            
            return {
                "trend": trend_direction,
                "recent_average": round(recent_avg, 2),
                "change_percentage": round(((recent_avg - older_avg) / older_avg) * 100, 2) if older_avg > 0 else 0,
                "consistency": self._calculate_consistency(recent_scores)
            }
            
        except Exception as e:
            logger.error(f"Wellness trends analysis failed: {e}")
            return {"error": str(e)}
    
    def _calculate_consistency(self, scores: List[float]) -> str:
        """Calculate consistency of wellness scores"""
        if len(scores) < 3:
            return "unknown"
        
        std_dev = np.std(scores)
        mean_score = np.mean(scores)
        
        coefficient_of_variation = (std_dev / mean_score) * 100 if mean_score > 0 else 100
        
        if coefficient_of_variation < 10:
            return "very_consistent"
        elif coefficient_of_variation < 20:
            return "consistent"
        elif coefficient_of_variation < 30:
            return "somewhat_variable"
        else:
            return "highly_variable"
    
    async def suggest_break_activities(self, user_id: str, current_state: Dict) -> Dict:
        """Suggest personalized break activities based on current state"""
        try:
            if user_id not in self.wellness_profiles:
                self.wellness_profiles[user_id] = self._create_wellness_profile(user_id)
            
            profile = self.wellness_profiles[user_id]
            
            # Analyze current needs
            stress_level = current_state.get("stress", 5)
            energy_level = current_state.get("energy", 5)
            fatigue_level = current_state.get("fatigue", 30)
            
            # Generate activity suggestions
            activities = []
            
            if stress_level >= 7:
                activities.extend([
                    {
                        "type": "breathing_exercise",
                        "title": "Deep Breathing",
                        "description": "4-7-8 breathing technique for stress relief",
                        "duration": 5,
                        "effectiveness": "high"
                    },
                    {
                        "type": "meditation",
                        "title": "Quick Meditation",
                        "description": "5-minute mindfulness meditation",
                        "duration": 5,
                        "effectiveness": "high"
                    }
                ])
            
            if energy_level <= 4:
                activities.extend([
                    {
                        "type": "light_exercise",
                        "title": "Energizing Stretch",
                        "description": "Light stretching to boost energy",
                        "duration": 10,
                        "effectiveness": "medium"
                    },
                    {
                        "type": "hydration",
                        "title": "Hydration Break",
                        "description": "Drink water and have a healthy snack",
                        "duration": 5,
                        "effectiveness": "medium"
                    }
                ])
            
            if fatigue_level >= 70:
                activities.extend([
                    {
                        "type": "power_nap",
                        "title": "Power Nap",
                        "description": "10-20 minute rest to combat fatigue",
                        "duration": 15,
                        "effectiveness": "high"
                    },
                    {
                        "type": "eye_rest",
                        "title": "Eye Rest Exercise",
                        "description": "20-20-20 rule for eye strain relief",
                        "duration": 3,
                        "effectiveness": "medium"
                    }
                ])
            
            # Add general activities if no specific needs
            if not activities:
                activities = [
                    {
                        "type": "walk",
                        "title": "Short Walk",
                        "description": "5-minute walk to refresh your mind",
                        "duration": 5,
                        "effectiveness": "medium"
                    },
                    {
                        "type": "stretching",
                        "title": "Desk Stretches",
                        "description": "Simple stretches to relieve tension",
                        "duration": 3,
                        "effectiveness": "medium"
                    }
                ]
            
            return {
                "suggested_activities": activities,
                "break_duration_recommended": self._calculate_optimal_break_duration(current_state),
                "urgency": self._assess_break_urgency(current_state),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Break activity suggestion failed: {e}")
            return {"error": str(e)}
    
    def _calculate_optimal_break_duration(self, current_state: Dict) -> int:
        """Calculate optimal break duration based on current state"""
        base_duration = 5  # minutes
        
        stress_level = current_state.get("stress", 5)
        fatigue_level = current_state.get("fatigue", 30)
        
        # Increase duration for high stress or fatigue
        if stress_level >= 8 or fatigue_level >= 80:
            return 15
        elif stress_level >= 6 or fatigue_level >= 60:
            return 10
        else:
            return base_duration
    
    def _assess_break_urgency(self, current_state: Dict) -> str:
        """Assess urgency of taking a break"""
        stress_level = current_state.get("stress", 5)
        fatigue_level = current_state.get("fatigue", 30)
        attention_level = current_state.get("attention", 70)
        
        if stress_level >= 8 or fatigue_level >= 80 or attention_level <= 30:
            return "immediate"
        elif stress_level >= 6 or fatigue_level >= 60 or attention_level <= 50:
            return "soon"
        else:
            return "optional"
    
    async def generate_wellness_insights(self, user_id: str) -> Dict:
        """Generate comprehensive wellness insights for user"""
        try:
            if user_id not in self.wellness_profiles:
                return {"error": "User profile not found"}
            
            profile = self.wellness_profiles[user_id]
            
            # Analyze patterns
            mood_patterns = self._analyze_mood_patterns(profile)
            stress_patterns = self._analyze_stress_patterns(profile)
            optimal_times = self._find_optimal_study_times(profile)
            
            # Generate insights
            insights = []
            
            # Mood insights
            if mood_patterns.get("trend") == "declining":
                insights.append({
                    "type": "mood_concern",
                    "message": "Your mood has been declining recently. Consider wellness interventions.",
                    "priority": "high"
                })
            
            # Stress insights
            if stress_patterns.get("average_stress", 5) > 6:
                insights.append({
                    "type": "stress_management",
                    "message": "Your stress levels are consistently high. Regular breaks and relaxation techniques are recommended.",
                    "priority": "high"
                })
            
            # Optimal time insights
            if optimal_times.get("peak_wellness_time"):
                insights.append({
                    "type": "timing_optimization",
                    "message": f"Your wellness is typically best around {optimal_times['peak_wellness_time']}. Schedule important learning during this time.",
                    "priority": "medium"
                })
            
            return {
                "insights": insights,
                "mood_patterns": mood_patterns,
                "stress_patterns": stress_patterns,
                "optimal_times": optimal_times,
                "overall_wellness_trend": self._analyze_wellness_trends(profile),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Wellness insights generation failed: {e}")
            return {"error": str(e)}
    
    def _analyze_mood_patterns(self, profile: Dict) -> Dict:
        """Analyze mood patterns over time"""
        mood_data = profile.get("mood_patterns", [])
        
        if len(mood_data) < 5:
            return {"error": "Insufficient mood data"}
        
        scores = [md["score"] for md in mood_data]
        
        return {
            "average_mood": np.mean(scores),
            "mood_variance": np.var(scores),
            "trend": "improving" if scores[-3:] > scores[:3] else "stable",
            "lowest_period": self._find_lowest_mood_period(mood_data),
            "highest_period": self._find_highest_mood_period(mood_data)
        }
    
    def _analyze_stress_patterns(self, profile: Dict) -> Dict:
        """Analyze stress patterns from wellness history"""
        wellness_history = profile.get("wellness_history", [])
        
        if not wellness_history:
            return {"error": "No stress data available"}
        
        stress_levels = [wh["metrics"]["stress_level"]["level"] for wh in wellness_history]
        
        return {
            "average_stress": np.mean(stress_levels),
            "stress_variance": np.var(stress_levels),
            "high_stress_frequency": sum(1 for s in stress_levels if s >= 7) / len(stress_levels) * 100,
            "stress_trend": "increasing" if stress_levels[-3:] > stress_levels[:3] else "stable"
        }
    
    def _find_optimal_study_times(self, profile: Dict) -> Dict:
        """Find optimal study times based on wellness patterns"""
        wellness_history = profile.get("wellness_history", [])
        
        if not wellness_history:
            return {"error": "Insufficient data"}
        
        # Group by hour and calculate average wellness
        hourly_wellness = {}
        
        for entry in wellness_history:
            hour = entry["timestamp"].hour
            if hour not in hourly_wellness:
                hourly_wellness[hour] = []
            hourly_wellness[hour].append(entry["wellness_score"])
        
        # Find peak wellness time
        hourly_averages = {hour: np.mean(scores) for hour, scores in hourly_wellness.items()}
        
        if not hourly_averages:
            return {"error": "No time-based data"}
        
        peak_hour = max(hourly_averages, key=hourly_averages.get)
        
        return {
            "peak_wellness_time": f"{peak_hour:02d}:00",
            "hourly_averages": hourly_averages,
            "recommended_study_window": f"{peak_hour:02d}:00 - {(peak_hour + 2) % 24:02d}:00"
        }
    
    def _find_lowest_mood_period(self, mood_data: List[Dict]) -> str:
        """Find time period with lowest mood"""
        if not mood_data:
            return "unknown"
        
        min_mood = min(mood_data, key=lambda x: x["score"])
        return min_mood["timestamp"].strftime("%Y-%m-%d %H:%M")
    
    def _find_highest_mood_period(self, mood_data: List[Dict]) -> str:
        """Find time period with highest mood"""
        if not mood_data:
            return "unknown"
        
        max_mood = max(mood_data, key=lambda x: x["score"])
        return max_mood["timestamp"].strftime("%Y-%m-%d %H:%M")