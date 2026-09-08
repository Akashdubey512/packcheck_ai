"""
Full End-to-End OCR Subsystem Pipeline
Integrates Phase 2 preprocessing, OCR detection/recognition, spatial line merging, reading order, and normalization.
"""

import time
import yaml
from pathlib import Path
from typing import Union, Dict, Any, List, Optional
from PIL import Image

from ml.preprocessing import PreprocessingPipeline
from .engine import get_ocr_engine
from .types import OCRResult, TextRegion
from .normalizer import normalize_ocr_text
from .reading_order import sort_reading_order
from .region_merger import merge_nearby_regions
from .exceptions import OCRError

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BASE_DIR / "configs" / "ocr.yaml"

def load_ocr_config(config_path: Path = CONFIG_PATH) -> Dict[str, Any]:
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        except Exception:
            pass
    return {
        "ocr": {"default_backend": "rapidocr", "fallback_backends": ["easyocr", "pytesseract"], "languages": ["en", "hi"]},
        "merging": {"enable_region_merging": True, "horizontal_max_gap_px": 20, "vertical_overlap_ratio": 0.5}
    }

class FullOCRPipeline:
    """Production End-to-End OCR Pipeline integrating Preprocessing, OCR, Merging, and Reading Order."""
    
    def __init__(self, backend_name: Optional[str] = None, config_path: Optional[Path] = None):
        self.config = load_ocr_config(config_path or CONFIG_PATH)
        ocr_cfg = self.config.get("ocr", {})
        
        target_backend = backend_name or ocr_cfg.get("default_backend", "rapidocr")
        languages = ocr_cfg.get("languages", ["en", "hi"])
        fallbacks = ocr_cfg.get("fallback_backends", ["easyocr", "pytesseract"])
        
        # Initialize Phase 2 Preprocessing Pipeline
        self.prep_pipeline = PreprocessingPipeline()
        
        # Initialize OCR Engine Backend
        self.ocr_engine = get_ocr_engine(
            backend_name=target_backend,
            languages=languages,
            fallback_backends=fallbacks
        )

    def process(
        self,
        image_input: Union[str, Path, Image.Image],
        image_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run complete end-to-end OCR processing on an input image.
        
        Returns unified dictionary payload strictly conforming to ML_CONTRACT.md schema.
        """
        start_time = time.perf_counter()
        
        # Determine image_id
        if image_id is None:
            if isinstance(image_input, (str, Path)):
                image_id = Path(image_input).stem
            else:
                image_id = "SAMPLE"

        # 1. Phase 2 Preprocessing
        prep_result = self.prep_pipeline.process(image_input)
        
        if not prep_result["validation"]["valid"]:
            exec_time = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "image_id": image_id,
                "ocr_version": "1.0.0",
                "engine": self.ocr_engine.name,
                "engine_version": self.ocr_engine.version,
                "preprocessing_version": "1.0.0",
                "dataset_version": "1.0.0",
                "image": {
                    "width": prep_result["validation"].get("width", 0) or 0,
                    "height": prep_result["validation"].get("height", 0) or 0
                },
                "status": "FAILED",
                "regions": [],
                "full_raw_text": "",
                "full_normalized_text": "",
                "errors": prep_result["validation"]["errors"],
                "execution_time_ms": exec_time
            }

        # Select primary preprocessed variant for OCR engine
        ocr_variant = prep_result.get("variants_np", {}).get("ocr_primary")
        if ocr_variant is None:
            ocr_variant = prep_result["variants"].get("ocr_primary", prep_result["variants"].get("original"))

        # 2. OCR Text Detection & Recognition
        ocr_res = self.ocr_engine.detect_and_recognize(ocr_variant, image_id=image_id)

        # 3. Reading Order Reconstruction
        ordered_regions = sort_reading_order(ocr_res.regions)

        # 4. Optional Region Merging
        merge_cfg = self.config.get("merging", {})
        if merge_cfg.get("enable_region_merging", True) and ordered_regions:
            ordered_regions = merge_nearby_regions(
                ordered_regions,
                max_horizontal_gap_px=merge_cfg.get("horizontal_max_gap_px", 20),
                vertical_threshold_ratio=merge_cfg.get("vertical_overlap_ratio", 0.5)
            )

        # 5. Text Normalization & Full Text Reconstruction
        raw_lines = []
        norm_lines = []
        for reg in ordered_regions:
            reg.normalized_text = normalize_ocr_text(reg.text)
            raw_lines.append(reg.text)
            norm_lines.append(reg.normalized_text)

        full_raw = "\n".join(raw_lines)
        full_norm = "\n".join(norm_lines)

        exec_time = round((time.perf_counter() - start_time) * 1000, 2)

        final_result = OCRResult(
            image_id=image_id,
            engine=self.ocr_engine.name,
            engine_version=self.ocr_engine.version,
            preprocessing_version="1.0.0",
            dataset_version="1.0.0",
            ocr_version="1.0.0",
            image_width=prep_result["validation"]["width"],
            image_height=prep_result["validation"]["height"],
            status=ocr_res.status,
            regions=ordered_regions,
            full_raw_text=full_raw,
            full_normalized_text=full_norm,
            errors=ocr_res.errors,
            execution_time_ms=exec_time
        )

        return final_result.to_dict()

    def process_batch(self, image_inputs: List[Union[str, Path, Image.Image]]) -> List[Dict[str, Any]]:
        """Process a list of images through full OCR pipeline."""
        results = []
        for img in image_inputs:
            results.append(self.process(img))
        return results

# Alias for API consistency across pipeline modules
OCRPipeline = FullOCRPipeline
