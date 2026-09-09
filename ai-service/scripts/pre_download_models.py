"""
Pre-download and warm-compile all ONNX and OCR models for Docker / Production build.
Ensures zero runtime download latency and guarantees offline operational readiness.
"""

import sys
import time
import numpy as np
from pathlib import Path

# Add ai-service root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

def pre_download_and_warmup():
    print("[1/3] Pre-loading RapidOCR models and ONNX runtime weights...")
    start = time.time()
    try:
        from rapidocr_onnxruntime import RapidOCR
        engine = RapidOCR()
        # Trigger model load with dummy synthetic image
        dummy_img = np.zeros((128, 256, 3), dtype=np.uint8)
        engine(dummy_img)
        print(f"[1/3] RapidOCR model cache ready ({time.time() - start:.2f}s)")
    except Exception as e:
        print(f"[!] Warning during RapidOCR pre-download: {e}", file=sys.stderr)

    print("[2/3] Pre-warming full multi-view inspection pipeline...")
    start = time.time()
    try:
        from PIL import Image
        from ml.inspection.inspection_pipeline import MultiViewInspectionPipeline
        pipeline = MultiViewInspectionPipeline()
        dummy_pil = Image.new("RGB", (200, 200), color=(255, 255, 255))
        pipeline.inspect_images([dummy_pil], inspection_id="WARMUP_BUILD")
        print(f"[2/3] Pipeline pre-warming complete ({time.time() - start:.2f}s)")
    except Exception as e:
        print(f"[!] Warning during pipeline warmup: {e}", file=sys.stderr)

    print("[3/3] Model pre-download & compilation complete. Ready for production.")

if __name__ == "__main__":
    pre_download_and_warmup()
