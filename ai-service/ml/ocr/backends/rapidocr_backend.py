"""
RapidOCR Engine Backend
Wraps ONNXRuntime-backed RapidOCR (DBNet text detector + CRNN/SVTR text recognizer).
"""

import cv2
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
    from rapidocr_onnxruntime import RapidOCR
    RAPIDOCR_AVAILABLE = True
except ImportError:
    RAPIDOCR_AVAILABLE = False

class RapidOCRBackend(BaseOCREngine):
    """RapidOCR ONNX Engine Backend with Adaptive Resolution Scaling & Warmup."""
    
    def __init__(self, languages: List[str] = None, max_side_len: int = 1536):
        super().__init__(name="rapidocr", version="1.2.3", languages=languages)
        if not RAPIDOCR_AVAILABLE:
            raise OCREngineError("ENGINE_INIT_FAILED", "rapidocr_onnxruntime is not installed.")
        self.max_side_len = max_side_len
        try:
            self.engine = RapidOCR()
            # Warm up ONNX Runtime sessions to trigger graph compilation & tensor loading
            dummy_img = np.zeros((64, 64, 3), dtype=np.uint8)
            self.engine(dummy_img)
        except Exception as e:
            raise OCREngineError("ENGINE_INIT_FAILED", f"Failed to initialize RapidOCR: {str(e)}")

    def detect_and_recognize(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        image_id: str = "SAMPLE"
    ) -> OCRResult:
        start_time = time.perf_counter()

        # Convert image input to numpy BGR array
        if isinstance(image_input, (str, Path)):
            img_path = str(image_input)
            img_pil = Image.open(img_path)
            w, h = img_pil.size
            img_np = np.array(img_pil)
        elif isinstance(image_input, Image.Image):
            w, h = image_input.size
            img_np = np.array(image_input)
        elif isinstance(image_input, np.ndarray):
            if image_input.ndim == 2:
                h, w = image_input.shape
                img_np = cv2.cvtColor(image_input, cv2.COLOR_GRAY2BGR)
            else:
                h, w = image_input.shape[:2]
                img_np = image_input
        else:
            raise OCREngineError("INVALID_INPUT", "Unsupported image input type.")

        # Handle 3-channel conversion if RGBA or 2-channel
        if img_np.ndim == 3 and img_np.shape[2] == 4:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
        elif img_np.ndim == 3 and img_np.shape[2] == 1:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)

        # Adaptive resolution scaling for high-resolution images
        scale = 1.0
        ocr_input = img_np
        max_dim = max(w, h)
        if max_dim > self.max_side_len:
            scale = float(self.max_side_len) / float(max_dim)
            new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
            ocr_input = cv2.resize(img_np, (new_w, new_h), interpolation=cv2.INTER_AREA)

        try:
            results, elapse = self.engine(ocr_input)
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
                
                # Rescale polygon coordinates back to original image dimensions if scaled
                pts_scaled = np.array(poly, dtype=float)
                if scale != 1.0:
                    pts_scaled /= scale
                
                pts = pts_scaled.astype(int)
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

