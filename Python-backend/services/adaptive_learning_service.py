import logging
from typing import Dict, List, Optional
from datetime import datetime
import statistics
from services.learning_model import get_model

logger = logging.getLogger(__name__)


class AdaptiveLearningService:
    """Clean, dependency-light adaptive learning service.

    In-memory, simple heuristics suitable for local dev and the
    `Enhanced Learning` frontend. No authentication or external
    dependencies are required.
    """

    def __init__(self) -> None:
        self.user_profiles: Dict[str, Dict] = {}
        self.learning_paths: Dict[str, Dict] = {}

    # Public API
    async def adapt_content(self, user_id: str, cognitive_state: Dict, current_content: Dict) -> Dict:
        """Return an adapted version of `current_content` and metadata.

        cognitive_state expects values in 0-100 for keys: attention, engagement,
        confusion, fatigue and optional learning_performance (0-100).
        """
        profile = self.user_profiles.setdefault(user_id, self._create_profile(user_id))

        # store recent metrics in profile
        self._push_metric(profile, "attention", cognitive_state.get("attention"))
        if "learning_performance" in cognitive_state:
            self._push_metric(profile, "performance", cognitive_state.get("learning_performance"))

        # compute simple indicators
        attention = self._recent_mean(profile, "attention", default=50)
        engagement = cognitive_state.get("engagement", attention)
        confusion = cognitive_state.get("confusion", 0)
        fatigue = cognitive_state.get("fatigue", 0)

        adaptations = {
            "difficulty_adjustment": None,  # increase|decrease|maintain
            "explanation_style": "concise",  # concise|detailed
            "interactivity_level": "medium",  # low|medium|high
            "break_suggestion": False,
            "pacing": "normal",
            "primary_format": current_content.get("primary_format", "text")
        }

        # Difficulty
        if confusion >= 60:
            adaptations["difficulty_adjustment"] = "decrease"
            adaptations["explanation_style"] = "detailed"
        elif engagement >= 75 and attention >= 70:
            adaptations["difficulty_adjustment"] = "increase"

        # Interactivity & pacing
        if attention < 40 or engagement < 40:
            adaptations["interactivity_level"] = "high"
        elif attention > 80 and engagement > 80:
            adaptations["interactivity_level"] = "low"

        if fatigue > 70:
            adaptations["break_suggestion"] = True
            adaptations["pacing"] = "slower"

        # Format preferences
        if confusion > 50:
            adaptations["primary_format"] = "visual"
        elif attention < 40:
            adaptations["primary_format"] = "interactive"

        adapted = self._apply_adaptations(current_content.copy(), adaptations)

        confidence = self._calc_confidence(profile, cognitive_state)

        # lightweight log
        logger.info(f"adapt_content user={user_id} adaptations={adaptations} confidence={confidence:.2f}")

        return {
            "success": True,
            "adapted_content": adapted,
            "adaptations": adaptations,
            "confidence": round(confidence, 2),
            "timestamp": datetime.now().isoformat()
        }

    async def generate_learning_path(self, user_id: str, subject: str, target_competency: str) -> Dict:
        """Create a simple, personalized learning path for the user.

        This function uses in-memory module templates. In production this
        would query a content DB.
        """
        profile = self.user_profiles.setdefault(user_id, self._create_profile(user_id))

        modules = self._subject_modules().get(subject, [])
        path = []
        for m in modules:
            mod = m.copy()
            # prefer shorter sessions if profile.optimal_session_length is small
            opt_len = profile.get("optimal_session_length", 45)
            if mod.get("duration", 0) > opt_len:
                mod["sessions"] = max(1, int((mod["duration"] + opt_len - 1) // opt_len))
                mod["session_duration"] = opt_len
            else:
                mod["sessions"] = 1
                mod["session_duration"] = mod.get("duration", opt_len)
            path.append(mod)

        path_id = f"{user_id}:{subject}:{int(datetime.now().timestamp())}"
        self.learning_paths[path_id] = {
            "user_id": user_id,
            "subject": subject,
            "target": target_competency,
            "modules": path,
            "created_at": datetime.now().isoformat(),
            "progress": 0
        }

        return {
            "success": True,
            "path_id": path_id,
            "learning_path": path,
            "estimated_duration": sum(m.get("duration", 0) for m in path),
        }

    async def recommend_next_content(self, user_id: str, performance: Dict) -> Dict:
        """Recommend next content based on a simple score and mistakes.

        performance expected keys: score (0-100), time_taken (seconds), mistakes (list).
        """
        score = performance.get("score", None)
        mistakes = performance.get("mistakes", [])

        # Try model-backed recommendation first
        try:
            model = get_model()
            info = model.info()
            if info.get("available"):
                # Build a feature dict and attempt to map it to the model's
                # expected raw columns. If overlap is insufficient we'll skip
                # model inference and fall back to heuristics.
                features = {
                    "score": float(performance.get("score", 0)),
                    "time_taken": float(performance.get("time_taken", 0)),
                    "mistake_count": float(len(mistakes))
                }

                # If the model exposes raw_columns we can try to provide
                # values for them. Otherwise we'll rely on whatever saved
                # columns the model reports.
                expected = getattr(model, "raw_columns", None)
                provided = set(features.keys())
                if not expected:
                    logger.info("Model available but no raw_columns metadata present; skipping model to avoid incompatible input shapes.")
                else:
                    overlap = sum(1 for c in expected if c in provided)
                    if overlap < max(1, len(expected) // 4):
                        logger.info("Model available but provided features don't match expected raw columns (overlap=%s). Skipping model.", overlap)
                    else:
                        pred = model.predict(features)
                        # Map numeric prediction to actions (0-100 -> categories)
                        if pred >= 85:
                            action = "advance"
                            content_type = "challenging_exercises"
                        elif pred >= 70:
                            action = "continue"
                            content_type = "practice_exercises"
                        elif pred >= 50:
                            action = "practice"
                            content_type = "worked_examples"
                        else:
                            action = "review"
                            content_type = "simplified_explanation"

                        recs = self._specific_recommendations(action, mistakes)

                        return {
                            "success": True,
                            "model_based": True,
                            "model_info": info,
                            "recommendation": {"action": action, "content_type": content_type, "specific": recs},
                            "confidence": round(min(1.0, 0.5 + abs(pred - 50) / 100), 2),
                        }
        except Exception:
            # Fall back to heuristics below
            logger.exception("Model-based recommendation failed, falling back to heuristics")

        # Heuristic fallback (existing logic)
        score = score if score is not None else performance.get("score", 0)
        if score >= 85:
            action = "advance"
            content_type = "challenging_exercises"
        elif score >= 70:
            action = "continue"
            content_type = "practice_exercises"
        elif score >= 50:
            action = "practice"
            content_type = "worked_examples"
        else:
            action = "review"
            content_type = "simplified_explanation"

        recs = self._specific_recommendations(action, mistakes)

        return {
            "success": True,
            "model_based": False,
            "recommendation": {"action": action, "content_type": content_type, "specific": recs},
            "confidence": round(min(1.0, 0.5 + abs(score - 50) / 100), 2),
        }

    async def analyze_learning_patterns(self, user_id: str) -> Dict:
        """Return simple analytics for the user's stored metrics."""
        profile = self.user_profiles.get(user_id)
        if not profile:
            return {"success": False, "error": "no profile"}

        attention = profile.get("metrics", {}).get("attention", [])
        perf = profile.get("metrics", {}).get("performance", [])

        return {
            "success": True,
            "attention": {
                "count": len(attention),
                "average": round(statistics.mean(attention), 2) if attention else None
            },
            "performance": {
                "count": len(perf),
                "average": round(statistics.mean(perf), 2) if perf else None
            }
        }

    # Helpers
    def _create_profile(self, user_id: str) -> Dict:
        return {
            "user_id": user_id,
            "learning_style": "visual",
            "preferred_difficulty": "intermediate",
            "optimal_session_length": 45,
            "metrics": {"attention": [], "performance": []},
            "created_at": datetime.now().isoformat(),
        }

    def _push_metric(self, profile: Dict, key: str, value: Optional[float]) -> None:
        try:
            if value is None:
                return
            if key == "attention":
                profile["metrics"]["attention"].append(float(value))
                # keep last 100
                profile["metrics"]["attention"] = profile["metrics"]["attention"][-100:]
            elif key == "performance":
                profile["metrics"]["performance"].append(float(value))
                profile["metrics"]["performance"] = profile["metrics"]["performance"][-100:]
        except Exception:
            logger.exception("_push_metric failed")

    def _recent_mean(self, profile: Dict, key: str, default: float = 50.0) -> float:
        vals = profile.get("metrics", {}).get(key, [])
        try:
            return statistics.mean(vals) if vals else float(default)
        except Exception:
            return float(default)

    def _apply_adaptations(self, content: Dict, adaptations: Dict) -> Dict:
        content.setdefault("difficulty_level", 2)
        if adaptations.get("difficulty_adjustment") == "decrease":
            content["difficulty_level"] = max(1, content["difficulty_level"] - 1)
        elif adaptations.get("difficulty_adjustment") == "increase":
            content["difficulty_level"] = min(4, content["difficulty_level"] + 1)

        content["explanation_mode"] = adaptations.get("explanation_style", "concise")
        content["interactivity_level"] = adaptations.get("interactivity_level", "medium")
        content["primary_format"] = adaptations.get("primary_format", content.get("primary_format", "text"))
        content["pacing"] = adaptations.get("pacing", "normal")
        content["break_suggestion"] = adaptations.get("break_suggestion", False)
        return content

    def _calc_confidence(self, profile: Dict, cognitive_state: Dict) -> float:
        # simple heuristic based on how many metrics we have and how extreme values are
        att = profile.get("metrics", {}).get("attention", [])
        perf = profile.get("metrics", {}).get("performance", [])
        base = 0.5
        if att:
            base += 0.2
        if perf:
            base += 0.2
        # reward consistency
        try:
            att_var = statistics.pstdev(att) if att else 50
            base += max(0, (50 - att_var) / 100)
        except Exception:
            pass
        return min(1.0, base)

    def _specific_recommendations(self, action: str, mistakes: List) -> List[Dict]:
        if action == "advance":
            return [{"type": "project", "title": "Capstone Project"}]
        if action == "practice":
            return [{"type": "practice_quiz", "title": "Extra Practice"}]
        if action == "review":
            return [{"type": "tutorial", "title": "Concept Review"}]
        return []

    def _subject_modules(self) -> Dict[str, List[Dict]]:
        return {
            "machine_learning": [
                {"id": "ml_intro", "title": "Intro to ML", "difficulty": "beginner", "duration": 45},
                {"id": "ml_algorithms", "title": "ML Algorithms", "difficulty": "intermediate", "duration": 60},
                {"id": "deep_learning", "title": "Deep Learning", "difficulty": "advanced", "duration": 90},
            ],
            "computer_vision": [
                {"id": "cv_basics", "title": "CV Basics", "difficulty": "beginner", "duration": 50},
                {"id": "cv_advanced", "title": "Advanced CV", "difficulty": "advanced", "duration": 75},
            ]
        }