"""
EasyOCR Engine Backend Wrapper
Wraps PyTorch-backed EasyOCR (CRAFT detector + ResNet recognizer).
"""

import time
import numpy as np
from pathlib import Path
from typing import Union, Dict, Any, List
from PIL import Image

from ..base import BaseOCREngine
from ..types import OCRResult, TextRegion, BoundingBox
from ..exceptions import OCREngineError
from ..normalizer import normalize_ocr_text

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

class EasyOCRBackend(BaseOCREngine):
    """EasyOCR PyTorch Engine Backend."""
    
    def __init__(self, languages: List[str] = None):
        super().__init__(name="easyocr", version="1.7.2", languages=languages)
        if not EASYOCR_AVAILABLE:
            raise OCREngineError("ENGINE_INIT_FAILED", "easyocr is not installed.")
        try:
            # Map languages: ['en', 'hi']
            self.reader = easyocr.Reader(self.languages, gpu=False)
        except Exception as e:
            raise OCREngineError("ENGINE_INIT_FAILED", f"Failed to initialize EasyOCR: {str(e)}")

    def detect_and_recognize(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        image_id: str = "SAMPLE"
    ) -> OCRResult:
        start_time = time.perf_counter()

        if isinstance(image_input, (str, Path)):
            img_path = str(image_input)
            img_pil = Image.open(img_path)
            w, h = img_pil.size
            img_np = np.array(img_pil)
        elif isinstance(image_input, Image.Image):
            w, h = image_input.size
            img_np = np.array(image_input)
        elif isinstance(image_input, np.ndarray):
            h, w = image_input.shape[:2]
            img_np = image_input
        else:
            raise OCREngineError("INVALID_INPUT", "Unsupported image input type.")

        try:
            results = self.reader.readtext(img_np)
        except Exception as e:
            return OCRResult(
                image_id=image_id,
                engine=self.name,
                engine_version=self.version,
                image_width=w,
                image_height=h,
                status="FAILED",
                errors=[{"code": "RECOGNITION_FAILED", "message": str(e)}],
                execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        regions: List[TextRegion] = []
        raw_text_list: List[str] = []
        norm_text_list: List[str] = []

        if results:
            for idx, item in enumerate(results):
                poly, text, score = item[0], item[1], item[2]
                pts = np.array(poly, dtype=int)
                x1 = int(max(0, np.min(pts[:, 0])))
                y1 = int(max(0, np.min(pts[:, 1])))
                x2 = int(min(w, np.max(pts[:, 0])))
                y2 = int(min(h, np.max(pts[:, 1])))

                bbox = BoundingBox(x1=x1, y1=y1, x2=x2, y2=y2)
                poly_list = [(int(p[0]), int(p[1])) for p in pts]
                conf = round(float(score), 4) if score is not None else None
                norm_t = normalize_ocr_text(text)

                text_reg = TextRegion(
                    region_id=idx,
                    bbox=bbox,
                    polygon=poly_list,
                    text=text,
                    normalized_text=norm_t,
                    confidence=conf,
                    language=None,
                    detector_confidence=conf,
                    recognizer_confidence=conf
                )
                regions.append(text_reg)
                raw_text_list.append(text)
                norm_text_list.append(norm_t)

        status = "SUCCESS" if regions else "NO_TEXT"
        exec_time = round((time.perf_counter() - start_time) * 1000, 2)

        return OCRResult(
            image_id=image_id,
            engine=self.name,
            engine_version=self.version,
            image_width=w,
            image_height=h,
            status=status,
            regions=regions,
            full_raw_text="\n".join(raw_text_list),
            full_normalized_text="\n".join(norm_text_list),
            execution_time_ms=exec_time
        )
