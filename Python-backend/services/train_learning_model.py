"""Trainer for a simple learner-performance prediction model.

Downloads the UCI Student Performance dataset, trains a RandomForestRegressor
to predict final grade G3, and saves the model and feature metadata to
models/learning_model.pkl and models/feature_columns.json.

Run: . .venv/bin/activate && python services/train_learning_model.py
"""
import os
import json
import tempfile
import zipfile
import logging
from pathlib import Path

import requests
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib

logger = logging.getLogger("trainer")
logging.basicConfig(level=logging.INFO)


ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def download_and_extract_student_mat(dest_dir: Path) -> Path:
    """Download UCI student dataset zip and extract student-mat.csv.

    Returns path to extracted CSV.
    """
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00320/student.zip"
    logger.info("Downloading dataset from %s", url)
    r = requests.get(url, timeout=30)
    r.raise_for_status()

    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(r.content)
        tmpzip = tf.name

    with zipfile.ZipFile(tmpzip, "r") as z:
        # student-mat.csv uses semicolon separator
        names = [n for n in z.namelist() if n.endswith("student-mat.csv")]
        if not names:
            raise RuntimeError("student-mat.csv not found in zip")
        name = names[0]
        z.extract(name, path=dest_dir)
        extracted = dest_dir / name

    return extracted


def load_and_preprocess(csv_path: Path):
    logger.info("Loading CSV %s", csv_path)
    df = pd.read_csv(csv_path, sep=';')

    # target
    y = df['G3'].astype(float)

    # drop target and identifiers if any
    X = df.drop(columns=['G1', 'G2', 'G3'])

    # Basic one-hot for categoricals
    X = pd.get_dummies(X, drop_first=True)

    # Align types
    X = X.fillna(0)

    return X, y


def train_and_save_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    logger.info("Training model on %d samples x %d features", X_train.shape[0], X_train.shape[1])
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    logger.info("Evaluation: MSE=%.3f R2=%.3f", mse, r2)

    # Save model and feature columns
    model_path = MODELS_DIR / "learning_model.pkl"
    joblib.dump(model, model_path)
    cols_path = MODELS_DIR / "feature_columns.json"
    with open(cols_path, 'w') as f:
        json.dump(list(X.columns), f)

    logger.info("Saved model to %s and columns to %s", model_path, cols_path)
    return model_path, cols_path


def main():
    work = Path("./tmp_dataset")
    work.mkdir(exist_ok=True)
    csv = download_and_extract_student_mat(work)
    X, y = load_and_preprocess(csv)
    train_and_save_model(X, y)


if __name__ == '__main__':
    main()
