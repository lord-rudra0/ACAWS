import os
import cv2
import csv
import argparse
from pathlib import Path

"""
Build a FER2013-style CSV from a labeled image folder tree.

Expected folder layout (class names as folder names):
  dataset_root/
    angry/
    disgust/
    fear/
    happy/
    neutral/
    sad/
    surprise/
Each subfolder contains image files (jpg/png/jpeg, etc.).

Output CSV columns: emotion,pixels,Usage
- emotion: FER2013 numeric id
  FER map:
    angry->0, disgust->1, fear->2, happy->3, sad->4, surprise->5, neutral->6
- pixels: space-separated 48x48 grayscale pixel values (0..255)
- Usage: one of {Training, PublicTest, PrivateTest}. We'll default to Training

This CSV is compatible with training/train_emotion_model.py.
"""

# FER2013 canonical ids
FER_ID_BY_NAME = {
    'angry': 0,
    'disgust': 1,
    'fear': 2,
    'happy': 3,
    'sad': 4,
    'surprise': 5,
    'neutral': 6,
}

IMG_EXTS = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.webp'}


def iter_images(root: Path):
    for cls_name in sorted(FER_ID_BY_NAME.keys()):
        cls_dir = root / cls_name
        if not cls_dir.is_dir():
            continue
        fer_id = FER_ID_BY_NAME[cls_name]
        for p in cls_dir.rglob('*'):
            if p.is_file() and p.suffix.lower() in IMG_EXTS:
                yield cls_name, fer_id, p


def image_to_pixels_str(path: Path) -> str:
    img = cv2.imread(str(path))
    if img is None:
        raise RuntimeError(f"Failed to read image: {path}")
    # Convert to grayscale 48x48 to match service preprocessing
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (48, 48), interpolation=cv2.INTER_AREA)
    # No normalization here; keep 0..255 integers for CSV
    flat = gray.flatten()
    return ' '.join(str(int(v)) for v in flat)


def build_csv(dataset_root: str, out_csv: str, usage: str = 'Training'):
    root = Path(dataset_root)
    if not root.exists():
        raise FileNotFoundError(f"Dataset root not found: {dataset_root}")

    os.makedirs(Path(out_csv).parent, exist_ok=True)

    count = 0
    with open(out_csv, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['emotion', 'pixels', 'Usage'])
        for cls_name, fer_id, img_path in iter_images(root):
            try:
                pixels = image_to_pixels_str(img_path)
            except Exception as e:
                # Skip unreadable images
                print(f"[WARN] Skipping {img_path}: {e}")
                continue
            writer.writerow([fer_id, pixels, usage])
            count += 1
            if count % 500 == 0:
                print(f"Wrote {count} rows...")
    print(f"Done. Wrote {count} rows to {out_csv}")


def main():
    ap = argparse.ArgumentParser(description='Create FER2013-style CSV from labeled image folders')
    ap.add_argument('--dataset', required=True, help='Path to dataset root folder with class subfolders')
    ap.add_argument('--out', required=True, help='Output CSV path')
    ap.add_argument('--usage', default='Training', choices=['Training', 'PublicTest', 'PrivateTest'])
    args = ap.parse_args()

    build_csv(args.dataset, args.out, args.usage)


if __name__ == '__main__':
    main()
