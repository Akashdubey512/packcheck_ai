"""
Modular Perspective Handling Module
Provides interface for packaging perspective correction & planar rectifying.
Enforces strict rule: Never invent bounding boxes or force correction without reliable boundary coordinates.
"""

import numpy as np
import cv2
from PIL import Image
from typing import Dict, Any, Union, Optional, List, Tuple

def warp_perspective_four_point(
    image: np.ndarray,
    pts: np.ndarray
) -> np.ndarray:
    """
    Rectify perspective distortion given 4 corner points [top-left, top-right, bottom-right, bottom-left].
    """
    (tl, tr, br, bl) = pts
    widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
    widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
    maxWidth = max(int(widthA), int(widthB))

    heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
    heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
    maxHeight = max(int(heightA), int(heightB))

    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(pts.astype("float32"), dst)
    warped = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warped

def analyze_and_correct_perspective(
    image: Union[np.ndarray, Image.Image],
    corners: Optional[List[Tuple[float, float]]] = None
) -> Dict[str, Any]:
    """
    Analyze perspective distortion and apply four-point homography transform if corners are provided.
    
    If no reliable boundary/corners are detected/provided, returns applied=False with reason NO_RELIABLE_BOUNDARY.
    """
    if corners is None or len(corners) != 4:
        return {
            "applied": False,
            "reason": "NO_RELIABLE_BOUNDARY",
            "corners_provided": False,
            "corrected_image": image
        }

    pts = np.array(corners, dtype="float32")

    if isinstance(image, Image.Image):
        img_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    elif isinstance(image, np.ndarray):
        img_np = image.copy()
    else:
        raise ValueError("Input must be PIL Image or numpy ndarray")

    try:
        warped_np = warp_perspective_four_point(img_np, pts)
        if isinstance(image, Image.Image):
            corrected_output = Image.fromarray(cv2.cvtColor(warped_np, cv2.COLOR_BGR2RGB))
        else:
            corrected_output = warped_np

        return {
            "applied": True,
            "reason": "PERSPECTIVE_RECTIFIED",
            "corners_provided": True,
            "corrected_image": corrected_output
        }
    except Exception as e:
        return {
            "applied": False,
            "reason": f"RECTIFICATION_FAILED: {str(e)}",
            "corners_provided": True,
            "corrected_image": image
        }
