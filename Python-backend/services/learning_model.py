"""Wrapper to load the trained learning model and expose predict()"""
from pathlib import Path
import json
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
MODEL_PATH = MODELS_DIR / "learning_model.pkl"
COLS_PATH = MODELS_DIR / "feature_columns.json"


class LearningModel:
    def __init__(self):
        self.model = None
        self.columns: List[str] = []
        self._load()

    def _load(self):
        try:
            import joblib
            if MODEL_PATH.exists():
                self.model = joblib.load(MODEL_PATH)
            if COLS_PATH.exists():
                self.columns = json.loads(COLS_PATH.read_text())
            logger.info("LearningModel loaded: model=%s cols=%d", bool(self.model), len(self.columns))
        except Exception as e:
            logger.warning("LearningModel not available: %s", e)

    def predict(self, features: Dict) -> float:
        """Predict final score given a features dict (sparse)."""
        if not self.model or not self.columns:
            raise RuntimeError("Model not available")

        # build feature vector in column order
        import numpy as np
        x = [features.get(c, 0.0) for c in self.columns]
        return float(self.model.predict([x])[0])


_INSTANCE: LearningModel = None


def get_model() -> LearningModel:
    global _INSTANCE
    if _INSTANCE is None:
        _INSTANCE = LearningModel()
    return _INSTANCE
