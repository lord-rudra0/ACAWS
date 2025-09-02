"""Advanced trainer: cross-validation and hyperparameter search.

Creates a sklearn Pipeline (preprocessor + RandomForestRegressor), uses
RandomizedSearchCV to tune hyperparameters, and saves the best pipeline to
models/learning_model_advanced.pkl.

Run: . .venv/bin/activate && python services/train_learning_model_advanced.py
"""
import logging
from pathlib import Path
import tempfile
import zipfile
import requests
import pandas as pd
import numpy as np
import joblib
import json

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split, RandomizedSearchCV
from sklearn.metrics import mean_squared_error, r2_score

logger = logging.getLogger("trainer.advanced")
logging.basicConfig(level=logging.INFO)

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)


def download_and_extract(dest: Path) -> list[Path]:
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00320/student.zip"
    logger.info("Downloading dataset from %s", url)
    r = requests.get(url, timeout=30)
    r.raise_for_status()

    with tempfile.NamedTemporaryFile(delete=False) as tf:
        tf.write(r.content)
        tmpzip = tf.name

    extracted = []
    with zipfile.ZipFile(tmpzip, 'r') as z:
        for name in z.namelist():
            if name.endswith('.csv') and name.startswith('student'):
                z.extract(name, path=dest)
                extracted.append(dest / name)
    return extracted


def load_and_prepare(paths: list[Path]):
    dfs = []
    for p in paths:
        logger.info('Loading %s', p)
        df = pd.read_csv(p, sep=';')
        dfs.append(df)
    df = pd.concat(dfs, ignore_index=True)

    # target
    y = df['G3'].astype(float)
    X = df.drop(columns=['G1', 'G2', 'G3'])

    # identify numeric vs categorical
    numeric_cols = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
    categorical_cols = [c for c in X.columns if c not in numeric_cols]

    return X, y, numeric_cols, categorical_cols


def build_pipeline(numeric_cols, categorical_cols):
    numeric_transformer = Pipeline(steps=[('scaler', StandardScaler())])
    categorical_transformer = Pipeline(steps=[('onehot', OneHotEncoder(handle_unknown='ignore'))])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_cols),
            ('cat', categorical_transformer, categorical_cols)
        ], remainder='drop')

    pipeline = Pipeline(steps=[('preprocessor', preprocessor), ('model', RandomForestRegressor(random_state=42))])
    return pipeline


def hyperparameter_search(pipeline, X_train, y_train):
    param_distributions = {
        'model__n_estimators': [50, 100, 200],
        'model__max_depth': [None, 10, 20, 30],
        'model__min_samples_split': [2, 5, 10],
        'model__max_features': ['sqrt', 'log2', 0.5]
    }

    rnd = RandomizedSearchCV(
        pipeline,
        param_distributions=param_distributions,
        n_iter=20,
        cv=5,
        scoring='r2',
        random_state=42,
        n_jobs=-1,
        verbose=2
    )

    logger.info('Starting RandomizedSearchCV')
    rnd.fit(X_train, y_train)
    logger.info('Best params: %s', rnd.best_params_)
    return rnd.best_estimator_, rnd


def save_pipeline(pipeline, model_path: Path):
    joblib.dump(pipeline, model_path)
    logger.info('Saved tuned pipeline to %s', model_path)


def main():
    work = Path('./tmp_dataset_adv')
    work.mkdir(exist_ok=True)
    csvs = download_and_extract(work)
    X, y, numeric_cols, categorical_cols = load_and_prepare(csvs)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    pipeline = build_pipeline(numeric_cols, categorical_cols)

    best_pipeline, rnd = hyperparameter_search(pipeline, X_train, y_train)

    preds = best_pipeline.predict(X_test)
    mse = mean_squared_error(y_test, preds)
    r2 = r2_score(y_test, preds)
    logger.info('Tuned model eval: MSE=%.3f R2=%.3f', mse, r2)

    model_path = MODELS_DIR / 'learning_model_advanced.pkl'
    save_pipeline(best_pipeline, model_path)

    # try to save feature names from preprocessor
    try:
        feat_names = best_pipeline.named_steps['preprocessor'].get_feature_names_out()
        with open(MODELS_DIR / 'feature_columns_advanced.json', 'w') as f:
            json.dump(list(feat_names), f)
        logger.info('Saved advanced feature columns count=%d', len(feat_names))
    except Exception as e:
        logger.warning('Could not extract feature names: %s', e)


if __name__ == '__main__':
    main()
