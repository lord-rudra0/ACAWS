import os
import argparse
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split

# This script trains a 48x48 grayscale emotion classifier compatible with
# EmotionAnalysisService._preprocess_face() and saves an .h5 model.
#
# Supported dataset format (FER2013 CSV-style):
#   - CSV with columns: [emotion, pixels, Usage]
#   - pixels: space-separated 48*48=2304 grayscale values (0..255)
#   - emotion: integer label in range 0..6 mapped to the following order
#       ['angry','disgust','fear','happy','neutral','sad','surprise']
#
# Usage example:
#   python3 training/train_emotion_model.py \
#     --csv /path/to/fer2013.csv \
#     --epochs 20 --batch-size 128 \
#     --out Python-backend/models/emotion_detection_model.h5

LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise']
NUM_CLASSES = len(LABELS)
INPUT_SHAPE = (48, 48, 1)


def build_model():
    model = models.Sequential([
        layers.Input(shape=INPUT_SHAPE),
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),

        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),

        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(2, 2),

        layers.Conv2D(256, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling2D(),

        layers.Dropout(0.4),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(NUM_CLASSES, activation='softmax')
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model


def csv_to_arrays(csv_path: str):
    df = pd.read_csv(csv_path)
    if not {'emotion', 'pixels'}.issubset(df.columns):
        raise ValueError("CSV must contain 'emotion' and 'pixels' columns")

    # parse pixel strings
    pixels = df['pixels'].str.split().apply(lambda p: np.array(p, dtype=np.uint8))
    X = np.stack(pixels.to_numpy()).reshape((-1, 48, 48, 1)).astype('float32') / 255.0
    y_raw = df['emotion'].astype('int64').to_numpy()

    # Remap FER2013 default ids (0:angry,1:disgust,2:fear,3:happy,4:sad,5:surprise,6:neutral)
    # to our LABELS order: ['angry','disgust','fear','happy','neutral','sad','surprise']
    fer_to_model = {0:0, 1:1, 2:2, 3:3, 4:5, 5:6, 6:4}
    y = np.vectorize(lambda k: fer_to_model.get(int(k), -1))(y_raw)

    # Basic sanity filter
    mask = (y >= 0) & (y < NUM_CLASSES)
    X = X[mask]
    y = y[mask]

    return X, y


def get_augmenter():
    return tf.keras.Sequential([
        layers.RandomFlip('horizontal'),
        layers.RandomRotation(0.05),
        layers.RandomZoom(0.05),
        layers.RandomTranslation(0.05, 0.05)
    ], name='augmenter')


def main():
    parser = argparse.ArgumentParser(description='Train emotion model (48x48 grayscale).')
    parser.add_argument('--csv', type=str, required=True, help='Path to FER2013-style CSV file')
    parser.add_argument('--epochs', type=int, default=20)
    parser.add_argument('--batch-size', type=int, default=128)
    parser.add_argument('--val-split', type=float, default=0.1)
    parser.add_argument('--out', type=str, default='Python-backend/models/emotion_detection_model.h5')
    args = parser.parse_args()

    os.makedirs(os.path.dirname(args.out), exist_ok=True)

    print(f"Loading dataset from {args.csv} ...")
    X, y = csv_to_arrays(args.csv)
    print(f"Loaded {len(X)} samples")

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=args.val_split, random_state=42, stratify=y
    )

    model = build_model()

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=3e-5)
    ]

    augmenter = get_augmenter()

    def gen(ds_x, ds_y, batch_size):
        ds = tf.data.Dataset.from_tensor_slices((ds_x, ds_y))
        ds = ds.shuffle(len(ds_x)).batch(batch_size).prefetch(tf.data.AUTOTUNE)
        return ds

    train_ds = gen(X_train, y_train, args.batch_size).map(lambda x, y: (augmenter(x, training=True), y))
    val_ds = gen(X_val, y_val, args.batch_size)

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        verbose=1
    )

    model.save(args.out)
    print(f"Saved trained model to {args.out}")


if __name__ == '__main__':
    main()
