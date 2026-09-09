"""
Package View Classifier
Classifies packaging image faces (FRONT, BACK, SIDE_LEFT, SIDE_RIGHT, TOP, BOTTOM, UNKNOWN)
based on OCR text patterns, layout features, or explicit user metadata.
"""

from typing import Dict, Any, List
from .types import PackageViewType

def classify_package_view(ocr_text: str, region_boxes: List[Any] = None, user_hint: str = None) -> str:
    """Classify package face orientation heuristically."""
    if user_hint and user_hint.upper() in PackageViewType.__members__:
        return PackageViewType[user_hint.upper()].value

    text_upper = ocr_text.upper()
    
    # Check Top/Lid/Batch/Date stamp indicators
    top_keywords = ["PKD", "MFD", "BATCH", "LOT", "EXP", "USE BY", "BEST BEFORE", "USE-BY", "EXPIRY"]
    top_matches = sum(1 for kw in top_keywords if kw in text_upper)
    if len(text_upper.split()) <= 20 and top_matches >= 1:
        return PackageViewType.TOP.value

    # Check Back/Information panel indicators
    back_keywords = [
        "INGREDIENTS", "NUTRITIONAL", "NUTRITION", "MANUFACTURED", "MARKETED", 
        "CUSTOMER CARE", "FSSAI", "LIC.", "SERVING", "CALORIES", "PROTEIN", 
        "FAT", "CARBOHYDRATE", "SODIUM", "STORAGE", "REFRIGERATION", "ALLERGEN"
    ]
    back_matches = sum(1 for kw in back_keywords if kw in text_upper)
    if back_matches >= 2:
        return PackageViewType.BACK.value

    # Check Front panel indicators
    front_keywords = [
        "NET QUANTITY", "NET WT", "NET VOL", "ORIGINAL", "PREMIUM", "SUPER",
        "MILK", "HOMOGENISED", "TONED", "TAAZA", "AMUL", "PURE", "NATURAL",
        "FRESH", "BISCUITS", "COOKIES", "WHEAT", "ATTA", "OIL", "FLOUR"
    ]
    front_matches = sum(1 for kw in front_keywords if kw in text_upper)
    if front_matches >= 1 and back_matches == 0:
        return PackageViewType.FRONT.value

    if back_matches == 1:
        return PackageViewType.SIDE_LEFT.value

    return PackageViewType.FRONT.value if front_matches >= 1 else PackageViewType.UNKNOWN.value

