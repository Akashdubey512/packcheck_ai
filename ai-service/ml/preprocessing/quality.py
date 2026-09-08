"""
Image Quality Assessment Module
Computes objective, measurable quality indicators (blur, brightness, contrast, noise, sharpness, entropy)
and evaluates quality status (GOOD, ACCEPTABLE, POOR, UNREADABLE).
"""

import math
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Union, Tuple, List

def compute_blur_laplacian(gray_img: np.ndarray) -> float:
    """Compute blur using variance of Laplacian (defensible, standard metric)."""
    return float(cv2.Laplacian(gray_img, cv2.CV_64F).var())

def compute_brightness(gray_img: np.ndarray) -> float:
    """Compute mean brightness (luminance 0-255)."""
    return float(np.mean(gray_img))

def compute_contrast(gray_img: np.ndarray) -> float:
    """Compute RMS contrast (standard deviation of intensity 0-255)."""
    return float(np.std(gray_img))

def compute_sharpness(gray_img: np.ndarray) -> float:
    """Compute mean gradient magnitude using Sobel filters."""
    sobelx = cv2.Sobel(gray_img, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray_img, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(sobelx**2 + sobely**2)
    return float(np.mean(magnitude))

def compute_noise_estimate(gray_img: np.ndarray) -> float:
    """Estimate noise level using median filter residual standard deviation."""
    blurred = cv2.medianBlur(gray_img, 3)
    noise_diff = gray_img.astype(np.float64) - blurred.astype(np.float64)
    return float(np.std(noise_diff))

def compute_exposure(gray_img: np.ndarray) -> Dict[str, float]:
    """Compute dark and highlight clipping ratios (under/over-exposure)."""
    total_pixels = gray_img.size
    underexposed_ratio = float(np.sum(gray_img < 5) / float(total_pixels))
    overexposed_ratio = float(np.sum(gray_img > 250) / float(total_pixels))
    return {
        "underexposed_ratio": round(underexposed_ratio, 4),
        "overexposed_ratio": round(overexposed_ratio, 4)
    }

def compute_entropy(gray_img: np.ndarray) -> float:
    """Compute Shannon entropy of grayscale histogram."""
    hist, _ = np.histogram(gray_img.ravel(), bins=256, range=(0, 256))
    hist = hist / float(hist.sum())
    hist = hist[hist > 0]
    return float(-np.sum(hist * np.log2(hist)))

def assess_image_quality(
    image: Union[np.ndarray, Image.Image],
    blur_threshold: float = 100.0,
    brightness_min: float = 40.0,
    brightness_max: float = 220.0,
    contrast_threshold: float = 25.0,
    noise_threshold: float = 15.0,
    sharpness_threshold: float = 10.0
) -> Dict[str, Any]:
    """
    Assess quality parameters of an image for packaging OCR readability.
    
    Categorizes status into GOOD, ACCEPTABLE, POOR, or UNREADABLE.
    Note: Threshold values are documented heuristic baselines for packaging OCR.
    """
    # Convert PIL Image to OpenCV Grayscale array
    if isinstance(image, Image.Image):
        gray_img = np.array(image.convert("L"))
    elif isinstance(image, np.ndarray):
        if len(image.shape) == 3 and image.shape[2] == 3:
            gray_img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        elif len(image.shape) == 3 and image.shape[2] == 4:
            gray_img = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
        else:
            gray_img = image.copy()
    else:
        raise ValueError("Image must be PIL Image or numpy ndarray")

    # Compute metrics
    blur_score = compute_blur_laplacian(gray_img)
    brightness = compute_brightness(gray_img)
    contrast = compute_contrast(gray_img)
    sharpness = compute_sharpness(gray_img)
    noise_score = compute_noise_estimate(gray_img)
    exposure = compute_exposure(gray_img)
    entropy_score = compute_entropy(gray_img)

    warnings: List[str] = []
    
    # Evaluate warnings based on thresholds
    if blur_score < blur_threshold:
        warnings.append(f"[Heuristic] Image appears blurry (Laplacian var {round(blur_score, 1)} < {blur_threshold})")

    if brightness < brightness_min:
        warnings.append(f"[Heuristic] Image is too dark (brightness {round(brightness, 1)} < {brightness_min})")
    elif brightness > brightness_max:
        warnings.append(f"[Heuristic] Image is overexposed (brightness {round(brightness, 1)} > {brightness_max})")

    if contrast < contrast_threshold:
        warnings.append(f"[Heuristic] Low contrast detected (RMS contrast {round(contrast, 1)} < {contrast_threshold})")

    if noise_score > noise_threshold:
        warnings.append(f"[Heuristic] High noise estimated (noise std {round(noise_score, 1)} > {noise_threshold})")

    # Determine status rating & numeric quality score (0.0 to 1.0)
    warning_count = len(warnings)
    if warning_count == 0 and blur_score > blur_threshold * 1.5:
        status = "GOOD"
        quality_score = min(1.0, 0.8 + 0.2 * (blur_score / (blur_threshold * 3.0)))
        recommended_action = "PROCEED_STANDARD_OCR"
    elif warning_count <= 1 and blur_score > (blur_threshold * 0.5):
        status = "ACCEPTABLE"
        quality_score = 0.65
        recommended_action = "PROCEED_WITH_ADAPTIVE_ENHANCEMENT"
    elif warning_count <= 3 and blur_score > (blur_threshold * 0.2):
        status = "POOR"
        quality_score = 0.40
        recommended_action = "PROCEED_WITH_HIGH_CONTRAST_FALLBACK_OCR"
    else:
        status = "UNUSABLE"
        quality_score = 0.15
        recommended_action = "FLAG_HUMAN_REVIEW_UNREADABLE"

    return {
        "status": status,
        "quality_score": round(quality_score, 3),
        "quality_reasons": warnings if warnings else ["Image meets all visual quality baselines"],
        "recommended_action": recommended_action,
        "metrics": {
            "blur_score_laplacian": round(blur_score, 2),
            "brightness": round(brightness, 2),
            "contrast": round(contrast, 2),
            "sharpness": round(sharpness, 2),
            "noise_estimate": round(noise_score, 2),
            "entropy": round(entropy_score, 2),
            "underexposed_ratio": exposure["underexposed_ratio"],
            "overexposed_ratio": exposure["overexposed_ratio"]
        },
        "thresholds": {
            "blur_threshold": blur_threshold,
            "brightness_min": brightness_min,
            "brightness_max": brightness_max,
            "contrast_threshold": contrast_threshold,
            "threshold_type": "Heuristic OCR baseline thresholds"
        },
        "warnings": warnings
    }

