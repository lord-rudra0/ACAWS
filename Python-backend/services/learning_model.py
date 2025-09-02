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
        self.raw_columns: List[str] = []  # original raw input column names expected by preprocessor
        self.model_name: str = "none"
        self._load()

    def _load(self):
        try:
            import joblib
            import numpy as np
            from sklearn.compose import ColumnTransformer
            from sklearn.pipeline import Pipeline

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

            # If model is a sklearn Pipeline with a ColumnTransformer we can try
            # to infer the original raw input column names (before encoding)
            # so we can pass a DataFrame with the expected columns to the
            # pipeline during prediction.
            try:
                inferred_raw = []
                if isinstance(self.model, Pipeline):
                    # prefer a step named 'preprocessor' if present
                    pre = self.model.named_steps.get('preprocessor') or next((s for s in self.model.named_steps.values() if isinstance(s, ColumnTransformer)), None)
                    if pre and isinstance(pre, ColumnTransformer):
                        for _name, _tr, cols in getattr(pre, "transformers_", []):
                            if isinstance(cols, (list, tuple, np.ndarray)):
                                inferred_raw.extend(list(cols))
                elif isinstance(self.model, ColumnTransformer):
                    for _name, _tr, cols in getattr(self.model, "transformers_", []):
                        if isinstance(cols, (list, tuple, np.ndarray)):
                            inferred_raw.extend(list(cols))

                # Deduplicate while preserving order
                if inferred_raw:
                    seen = set()
                    ordered = []
                    for c in inferred_raw:
                        if c not in seen:
                            seen.add(c)
                            ordered.append(c)
                    self.raw_columns = ordered
            except Exception:
                logger.exception("Failed to infer pipeline raw input columns")

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

        # Determine expected input columns: prefer raw (preprocessor) columns
        expected = self.raw_columns if getattr(self, "raw_columns", None) else self.columns
        if not expected:
            raise RuntimeError("Model prediction failed: no expected input columns available")

        # Check overlap between provided features and expected columns. If the
        # overlap is small, it's very likely the provided feature dict is for a
        # different model (e.g., we sent performance->score whereas pipeline
        # expects student attributes). In that case fail fast so callers can
        # fallback to heuristics.
        provided_keys = set(features.keys())
        overlap = sum(1 for c in expected if c in provided_keys)
        # require at least 25% of expected columns to be present, or at least 1
        min_required = max(1, len(expected) // 4)
        if overlap < min_required:
            raise RuntimeError(f"Input features incompatible with model: expected {len(expected)} columns, got {len(provided_keys)} keys, overlap={overlap}")

        try:
            # Build input row using expected column order
            row = [features.get(c, 0.0) for c in expected]
            X_in = [row]

            # Try predict directly; if it fails try DataFrame with named columns
            try:
                pred = self.model.predict(X_in)
            except Exception:
                try:
                    import pandas as pd

                    df = pd.DataFrame(X_in, columns=expected)
                    pred = self.model.predict(df)
                except Exception as e2:
                    raise RuntimeError(e2)

            return float(pred[0])
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
