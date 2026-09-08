"""
Preprocessing Variant Evaluation Framework
Evaluates and compares visual & metric quality across different preprocessing pipeline configurations (A through H).
Note: Final OCR accuracy evaluation will plug into this framework in Phase 3.
"""

import sys
import json
import time
import cv2
import numpy as np
from pathlib import Path
from PIL import Image

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ml.preprocessing import assess_image_quality, validate_image

PROCESSED_DIR = BASE_DIR / "processed_data"

def evaluate_pipeline_variants_on_samples(num_samples: int = 10):
    print("==================================================", flush=True)
    print("Phase 2: Preprocessing Variant Evaluation Framework", flush=True)
    print("==================================================", flush=True)

    train_img_dir = PROCESSED_DIR / "train" / "images"
    if not train_img_dir.exists():
        print(f"Error: Processed train image directory not found: {train_img_dir}", flush=True)
        return

    sample_images = list(train_img_dir.glob("*.jpg"))[:num_samples] + list(train_img_dir.glob("*.png"))[:num_samples]
    sample_images = sample_images[:num_samples]
    
    print(f"Evaluating {len(sample_images)} real dataset samples across 8 preprocessing variants (A-H):\n", flush=True)

    variant_results = {
        "A_Original": [],
        "B_Resize": [],
        "C_Contrast_Linear": [],
        "D_CLAHE": [],
        "E_Sharpening": [],
        "F_Denoising": [],
        "G_Adaptive_Threshold": [],
        "H_Combined_Adaptive": []
    }

    for img_path in sample_images:
        val_res = validate_image(img_path)
        if not val_res["valid"]:
            continue

        pil_img = Image.open(img_path).convert("RGB")
        img_np = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)

        # Variant A: Original Grayscale
        q_A = assess_image_quality(gray)
        variant_results["A_Original"].append(q_A["metrics"])

        # Variant B: Resize
        h, w = gray.shape
        resized = cv2.resize(gray, (w // 2, h // 2), interpolation=cv2.INTER_AREA) if max(h, w) > 1000 else gray.copy()
        q_B = assess_image_quality(resized)
        variant_results["B_Resize"].append(q_B["metrics"])

        # Variant C: Linear Contrast Enhancement
        contrast_linear = cv2.convertScaleAbs(gray, alpha=1.3, beta=10)
        q_C = assess_image_quality(contrast_linear)
        variant_results["C_Contrast_Linear"].append(q_C["metrics"])

        # Variant D: CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        clahe_img = clahe.apply(gray)
        q_D = assess_image_quality(clahe_img)
        variant_results["D_CLAHE"].append(q_D["metrics"])

        # Variant E: Sharpening
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
        sharpened = cv2.filter2D(gray, -1, kernel)
        q_E = assess_image_quality(sharpened)
        variant_results["E_Sharpening"].append(q_E["metrics"])

        # Variant F: Denoising
        denoised = cv2.fastNlMeansDenoising(gray, h=7)
        q_F = assess_image_quality(denoised)
        variant_results["F_Denoising"].append(q_F["metrics"])

        # Variant G: Adaptive Thresholding
        adaptive_thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        q_G = assess_image_quality(adaptive_thresh)
        variant_results["G_Adaptive_Threshold"].append(q_G["metrics"])

        # Variant H: Combined Adaptive (CLAHE + Sharpen)
        combined = cv2.filter2D(clahe_img, -1, kernel)
        q_H = assess_image_quality(combined)
        variant_results["H_Combined_Adaptive"].append(q_H["metrics"])

    # Compute Averages across variants
    print(f"{'Variant':<25} | {'Mean Blur (Laplacian)':<22} | {'Mean Contrast':<15} | {'Mean Brightness':<15}", flush=True)
    print("-" * 82, flush=True)

    summary_results = {}
    for var_name, metrics_list in variant_results.items():
        if metrics_list:
            avg_blur = round(float(np.mean([m["blur_score_laplacian"] for m in metrics_list])), 2)
            avg_contrast = round(float(np.mean([m["contrast"] for m in metrics_list])), 2)
            avg_brightness = round(float(np.mean([m["brightness"] for m in metrics_list])), 2)
            
            summary_results[var_name] = {
                "mean_blur_laplacian": avg_blur,
                "mean_contrast": avg_contrast,
                "mean_brightness": avg_brightness
            }
            print(f"{var_name:<25} | {avg_blur:<22} | {avg_contrast:<15} | {avg_brightness:<15}", flush=True)

    print("\n[OK] Preprocessing evaluation completed successfully.", flush=True)
    return summary_results

if __name__ == "__main__":
    evaluate_pipeline_variants_on_samples()
