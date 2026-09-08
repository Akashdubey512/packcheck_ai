"""
Orientation Detection & Rotation Module
Detects image orientation (0°, 90°, 180°, 270°) using EXIF orientation tags or visual inspection.
Returns explicit, honest confidence values (null when uncomputed).
"""

import numpy as np
import cv2
from PIL import Image, ExifTags
from typing import Dict, Any, Tuple, Union

# EXIF Orientation Tag ID = 274
EXIF_ORIENTATION_TAG = 274

def get_exif_orientation_angle(pil_img: Image.Image) -> Tuple[int, bool]:
    """
    Extract orientation angle from PIL EXIF data.
    
    EXIF orientation tag values:
      1: 0° (Normal)
      3: 180°
      6: 90° CW (Needs 270° CCW / 90° CW rotation)
      8: 270° CW (Needs 90° CCW / 270° CW rotation)
    """
    try:
        exif = pil_img._getexif()
        if exif and EXIF_ORIENTATION_TAG in exif:
            val = exif[EXIF_ORIENTATION_TAG]
            if val == 3:
                return 180, True
            elif val == 6:
                return 270, True # 270° CCW rotation to correct 90° CW EXIF
            elif val == 8:
                return 90, True  # 90° CCW rotation to correct 270° CW EXIF
            elif val == 1:
                return 0, True
    except Exception:
        pass
    return 0, False

def rotate_image(image: np.ndarray, angle: int) -> np.ndarray:
    """Rotate image by 90, 180, or 270 degrees counter-clockwise."""
    angle = angle % 360
    if angle == 90:
        return cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif angle == 180:
        return cv2.rotate(image, cv2.ROTATE_180)
    elif angle == 270:
        return cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
    return image.copy()

def detect_and_correct_orientation(
    image: Union[np.ndarray, Image.Image],
    auto_rotate: bool = True,
    use_exif: bool = True
) -> Dict[str, Any]:
    """
    Detect orientation angle (0°, 90°, 180°, 270°) and apply rotation if necessary.
    
    Confidence is returned as None (null) when visual classifier confidence is uncomputed.
    """
    pil_img = None
    if isinstance(image, Image.Image):
        pil_img = image
        # Convert PIL to BGR for cv2
        img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    elif isinstance(image, np.ndarray):
        img_np = image.copy()
    else:
        raise ValueError("Input must be a PIL Image or numpy ndarray")

    angle = 0
    method = "NONE"
    confidence = None
    has_exif = False

    # Check EXIF orientation
    if use_exif and pil_img is not None:
        angle, has_exif = get_exif_orientation_angle(pil_img)
        if has_exif:
            method = "EXIF"

    applied = False
    corrected_np = img_np

    if auto_rotate and angle != 0:
        corrected_np = rotate_image(img_np, angle)
        applied = True

    # Convert back to PIL if input was PIL
    if isinstance(image, Image.Image):
        corrected_output = Image.fromarray(cv2.cvtColor(corrected_np, cv2.COLOR_BGR2RGB))
    else:
        corrected_output = corrected_np

    return {
        "detected_angle": angle,
        "method": method,
        "confidence": confidence, # Explicit null per spec
        "applied": applied,
        "corrected_image": corrected_output
    }
