"""Wrapper to load the trained learning model(s) and expose predict().

Prefers `learning_model_advanced.pkl` when present, otherwise falls back to
`learning_model.pkl`. Exposes a small info() helper.
"""
from pathlib import Path
import json
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
BASE_MODEL_PATH = MODELS_DIR / "learning_model.pkl"
BASE_COLS_PATH = MODELS_DIR / "feature_columns.json"
ADV_MODEL_PATH = MODELS_DIR / "learning_model_advanced.pkl"
ADV_COLS_PATH = MODELS_DIR / "feature_columns_advanced.json"


class LearningModel:
    def __init__(self):
        self.model = None
        self.columns: List[str] = []
        self.model_name: str = "none"
        self._load()

    def _load(self):
        try:
            import joblib

            # Try advanced first
            if ADV_MODEL_PATH.exists():
                try:
                    self.model = joblib.load(ADV_MODEL_PATH)
                    if ADV_COLS_PATH.exists():
                        self.columns = json.loads(ADV_COLS_PATH.read_text())
                    self.model_name = "advanced"
                except Exception as e:
                    logger.warning("Failed to load advanced model: %s", e)

            # Fallback to baseline
            if not self.model and BASE_MODEL_PATH.exists():
                try:
                    self.model = joblib.load(BASE_MODEL_PATH)
                    if BASE_COLS_PATH.exists():
                        self.columns = json.loads(BASE_COLS_PATH.read_text())
                    self.model_name = "baseline"
                except Exception as e:
                    logger.warning("Failed to load baseline model: %s", e)

            logger.info("LearningModel loaded: available=%s name=%s features=%d", bool(self.model), self.model_name, len(self.columns))
        except Exception as e:
            logger.warning("LearningModel not available: %s", e)

    def predict(self, features: Dict) -> float:
        """Predict a numeric score using the loaded model.

        features: sparse mapping of feature-name -> value
        returns: float prediction
        """
        if not self.model or not self.columns:
            raise RuntimeError("Model not available")

        x = [features.get(c, 0.0) for c in self.columns]
        try:
            return float(self.model.predict([x])[0])
        except Exception as e:
            raise RuntimeError(f"Model prediction failed: {e}")

    def info(self) -> Dict:
        return {"available": bool(self.model), "model_name": self.model_name, "n_features": len(self.columns)}


_INSTANCE: LearningModel = None


def get_model() -> LearningModel:
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = LearningModel()
    return _INSTANCE
