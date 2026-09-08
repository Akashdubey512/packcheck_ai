"""
Adaptive Preprocessing Pipeline Module
Orchestrates validation, quality assessment, orientation correction, adaptive contrast/sharpness enhancement,
and generates multiple OCR-ready image variants without modifying raw source inputs.
"""

import time
import yaml
import numpy as np
import cv2
from PIL import Image, ImageEnhance
from pathlib import Path
from typing import Dict, Any, List, Union, Tuple, Optional

from .image_validator import validate_image
from .quality import assess_image_quality
from .orientation import detect_and_correct_orientation
from .deskew import estimate_and_correct_deskew
from .perspective import analyze_and_correct_perspective

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BASE_DIR / "configs" / "preprocessing.yaml"

def load_preprocessing_config(config_path: Path = CONFIG_PATH) -> Dict[str, Any]:
    """Load configuration options from YAML or fall back to defaults."""
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception:
            pass
    return {
        "validation": {"min_width": 32, "min_height": 32, "max_width": 8000, "max_height": 8000},
        "quality_thresholds": {"blur_threshold": 100.0, "brightness_min": 40.0, "brightness_max": 220.0, "contrast_threshold": 25.0},
        "preprocessing": {"resize_max_dimension": 2048, "clahe_clip_limit": 2.0, "sharpen_kernel_strength": 0.5},
        "deskew": {"min_angle": 0.5, "max_angle": 15.0},
        "orientation": {"auto_rotate": True, "use_exif": True},
        "perspective": {"auto_correct": False}
    }

class PreprocessingPipeline:
    """Production-grade adaptive preprocessing pipeline for Legal Metrology OCR."""
    
    def __init__(self, config_path: Optional[Path] = None):
        if config_path is None:
            config_path = CONFIG_PATH
        self.config = load_preprocessing_config(config_path)
        
    def _resize_if_needed(self, img_np: np.ndarray, max_dim: int = 2048) -> Tuple[np.ndarray, bool]:
        h, w = img_np.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w, new_h = int(w * scale), int(h * scale)
            resized = cv2.resize(img_np, (new_w, new_h), interpolation=cv2.INTER_AREA)
            return resized, True
        return img_np, False

    def _apply_clahe(self, gray_img: np.ndarray, clip_limit: float = 2.0) -> np.ndarray:
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
        return clahe.apply(gray_img)

    def _apply_sharpening(self, gray_img: np.ndarray, strength: float = 0.5) -> np.ndarray:
        kernel = np.array([[0, -1, 0], [-1, 4 + strength, -1], [0, -1, 0]], dtype=np.float32)
        return cv2.filter2D(gray_img, -1, kernel)

    def process(self, image_input: Union[str, Path, Image.Image]) -> Dict[str, Any]:
        """
        Process a single image through adaptive preprocessing pipeline.
        
        Returns structured dictionary containing validation, quality metrics, applied operations,
        processing time, and multiple OCR-ready variants (original, ocr_primary, ocr_secondary).
        """
        start_time = time.perf_counter()
        
        # 1. Validation
        val_cfg = self.config.get("validation", {})
        val_res = validate_image(
            image_input,
            min_width=val_cfg.get("min_width", 32),
            min_height=val_cfg.get("min_height", 32),
            max_width=val_cfg.get("max_width", 8000),
            max_height=val_cfg.get("max_height", 8000)
        )
        
        if not val_res["valid"]:
            exec_time = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "image_id": Path(image_input).stem if isinstance(image_input, (str, Path)) else "PIL_INPUT",
                "validation": val_res,
                "quality": None,
                "orientation": None,
                "perspective": None,
                "variants": {},
                "execution_time_ms": exec_time,
                "error": "Validation failed"
            }

        # Load image object
        if isinstance(image_input, (str, Path)):
            image_path = Path(image_input)
            pil_orig = Image.open(image_path)
            image_id = image_path.stem
        else:
            pil_orig = image_input
            image_id = "PIL_INPUT"

        # Ensure RGB format for working copy
        if pil_orig.mode != "RGB":
            pil_work = pil_orig.convert("RGB")
        else:
            pil_work = pil_orig.copy()

        # 2. Quality Assessment
        q_cfg = self.config.get("quality_thresholds", {})
        quality_res = assess_image_quality(
            pil_work,
            blur_threshold=q_cfg.get("blur_threshold", 100.0),
            brightness_min=q_cfg.get("brightness_min", 40.0),
            brightness_max=q_cfg.get("brightness_max", 220.0),
            contrast_threshold=q_cfg.get("contrast_threshold", 25.0)
        )

        # 3. Orientation Check & Correction
        ori_cfg = self.config.get("orientation", {})
        ori_res = detect_and_correct_orientation(
            pil_work,
            auto_rotate=ori_cfg.get("auto_rotate", True),
            use_exif=ori_cfg.get("use_exif", True)
        )
        working_pil = ori_res["corrected_image"]
        img_np = cv2.cvtColor(np.array(working_pil), cv2.COLOR_RGB2BGR)

        # 4. Resize if necessary
        prep_cfg = self.config.get("preprocessing", {})
        max_dim = prep_cfg.get("resize_max_dimension", 2048)
        img_np, resized_applied = self._resize_if_needed(img_np, max_dim=max_dim)

        # 5. Deskew Check
        deskew_cfg = self.config.get("deskew", {})
        deskew_res = estimate_and_correct_deskew(
            img_np,
            min_angle=deskew_cfg.get("min_angle", 0.5),
            max_angle=deskew_cfg.get("max_angle", 15.0)
        )
        if deskew_res["applied"]:
            img_np = deskew_res["corrected_image"]

        # 6. Perspective Handling
        persp_res = analyze_and_correct_perspective(img_np, corners=None)

        # 7. Generate OCR Variants (Adaptive Processing)
        gray_base = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        primary_ops = ["rgb_to_gray", "resize"]
        secondary_ops = ["rgb_to_gray", "resize", "clahe", "sharpen"]

        # Primary OCR Variant: High-quality Grayscale with contrast normalization
        if quality_res["metrics"]["contrast"] < q_cfg.get("contrast_threshold", 25.0):
            gray_primary = self._apply_clahe(gray_base, clip_limit=2.0)
            primary_ops.append("clahe")
        else:
            gray_primary = gray_base.copy()

        if quality_res["metrics"]["blur_score_laplacian"] < q_cfg.get("blur_threshold", 100.0):
            gray_primary = self._apply_sharpening(gray_primary, strength=0.5)
            primary_ops.append("sharpening")

        # Secondary OCR Variant: Adaptive Binarization / Enhanced Contrast for noisy backgrounds
        gray_secondary = self._apply_clahe(gray_base, clip_limit=3.0)
        gray_secondary = self._apply_sharpening(gray_secondary, strength=0.8)

        # Convert variants to PIL Images
        ocr_primary_pil = Image.fromarray(gray_primary)
        ocr_secondary_pil = Image.fromarray(gray_secondary)

        exec_time = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "image_id": image_id,
            "validation": val_res,
            "quality": quality_res,
            "orientation": {
                "angle": ori_res["detected_angle"],
                "method": ori_res["method"],
                "confidence": ori_res["confidence"],
                "applied": ori_res["applied"]
            },
            "deskew": {
                "applied": deskew_res["applied"],
                "reason": deskew_res["reason"],
                "estimated_angle": deskew_res.get("estimated_angle")
            },
            "perspective": {
                "applied": persp_res["applied"],
                "reason": persp_res["reason"]
            },
            "variants": {
                "original": pil_orig,
                "ocr_primary": ocr_primary_pil,
                "ocr_secondary": ocr_secondary_pil
            },
            "variants_np": {
                "ocr_primary": gray_primary,
                "ocr_secondary": gray_secondary
            },
            "variant_metadata": [
                {"name": "ocr_primary", "operations": primary_ops},
                {"name": "ocr_secondary", "operations": secondary_ops}
            ],
            "execution_time_ms": exec_time
        }

    def process_batch(self, image_inputs: List[Union[str, Path, Image.Image]]) -> List[Dict[str, Any]]:
        """Process a list of images in batch mode."""
        results = []
        for img in image_inputs:
            results.append(self.process(img))
        return results
