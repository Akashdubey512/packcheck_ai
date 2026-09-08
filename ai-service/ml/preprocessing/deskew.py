"""
Conservative Image Deskewing Module
Estimates text line skew angle using Hough line transform and applies rotation only when reliable skew is detected.
"""

import math
import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Union

def estimate_skew_angle_hough(gray_img: np.ndarray) -> Union[float, None]:
    """
    Estimate dominant text line skew angle using Canny edges and Hough Transform.
    Returns angle in degrees (-45° to +45°) or None if unmeasurable.
    """
    edges = cv2.Canny(gray_img, 50, 200, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=50, maxLineGap=10)
    
    if lines is None or len(lines) < 5:
        return None

    angles = []
    for line in lines:
        pts = line.ravel()
        if len(pts) >= 4:
            x1, y1, x2, y2 = int(pts[0]), int(pts[1]), int(pts[2]), int(pts[3])
            dx = x2 - x1
            dy = y2 - y1
            if abs(dx) > 1e-3:
                angle_rad = math.atan2(dy, dx)
                angle_deg = math.degrees(angle_rad)
                if -30.0 <= angle_deg <= 30.0:
                    angles.append(angle_deg)

    if not angles:
        return None

    median_angle = float(np.median(angles))
    return median_angle

def estimate_and_correct_deskew(
    image: Union[np.ndarray, Image.Image],
    min_angle: float = 0.5,
    max_angle: float = 15.0
) -> Dict[str, Any]:
    """
    Estimate text line skew angle and conservatively correct it.
    
    Returns applied=False with SKEW_NOT_RELIABLY_DETECTED if skew evidence is absent.
    """
    if isinstance(image, Image.Image):
        gray_img = np.array(image.convert("L"))
        img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    elif isinstance(image, np.ndarray):
        img_np = image.copy()
        if len(image.shape) == 3:
            gray_img = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray_img = image.copy()
    else:
        raise ValueError("Input must be PIL Image or numpy ndarray")

    estimated_angle = estimate_skew_angle_hough(gray_img)

    if estimated_angle is None or abs(estimated_angle) < min_angle or abs(estimated_angle) > max_angle:
        reason = "SKEW_NOT_RELIABLY_DETECTED" if estimated_angle is None else (
            "SKEW_BELOW_THRESHOLD" if abs(estimated_angle) < min_angle else "SKEW_EXCEEDS_MAX_THRESHOLD"
        )
        return {
            "applied": False,
            "reason": reason,
            "estimated_angle": round(estimated_angle, 2) if estimated_angle is not None else None,
            "corrected_image": image
        }

    # Rotate image by estimated angle to deskew
    h, w = img_np.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, estimated_angle, 1.0)
    corrected_np = cv2.warpAffine(img_np, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    if isinstance(image, Image.Image):
        corrected_output = Image.fromarray(cv2.cvtColor(corrected_np, cv2.COLOR_BGR2RGB))
    else:
        corrected_output = corrected_np

    return {
        "applied": True,
        "reason": "SKEW_CORRECTED",
        "estimated_angle": round(estimated_angle, 2),
        "corrected_image": corrected_output
    }
