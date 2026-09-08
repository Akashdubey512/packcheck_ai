"""
PyTesseract Engine Backend Wrapper
Wraps Tesseract 5 OCR engine via pytesseract.
"""

import time
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Union, Dict, Any, List
from PIL import Image

from ..base import BaseOCREngine
from ..types import OCRResult, TextRegion, BoundingBox
from ..exceptions import OCREngineError
from ..normalizer import normalize_ocr_text

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

class PyTesseractBackend(BaseOCREngine):
    """PyTesseract Tesseract OCR Backend."""
    
    def __init__(self, languages: List[str] = None):
        super().__init__(name="pytesseract", version="0.3.13", languages=languages)
        if not PYTESSERACT_AVAILABLE:
            raise OCREngineError("ENGINE_INIT_FAILED", "pytesseract is not installed.")
        
    def detect_and_recognize(
        self,
        image_input: Union[str, Path, np.ndarray, Image.Image],
        image_id: str = "SAMPLE"
    ) -> OCRResult:
        start_time = time.perf_counter()

        if isinstance(image_input, (str, Path)):
            img_pil = Image.open(str(image_input))
            w, h = img_pil.size
        elif isinstance(image_input, Image.Image):
            img_pil = image_input
            w, h = img_pil.size
        elif isinstance(image_input, np.ndarray):
            h, w = image_input.shape[:2]
            img_pil = Image.fromarray(image_input)
        else:
            raise OCREngineError("INVALID_INPUT", "Unsupported image input type.")

        try:
            # Language string e.g. "eng+hin"
            lang_str = "eng"
            data_df = pytesseract.image_to_data(img_pil, lang=lang_str, output_type=pytesseract.Output.DATAFRAME)
        except Exception as e:
            return OCRResult(
                image_id=image_id,
                engine=self.name,
                engine_version=self.version,
                image_width=w,
                image_height=h,
                status="FAILED",
                errors=[{"code": "ENGINE_INIT_FAILED", "message": f"Tesseract execution error (check binary installation): {str(e)}"}],
                execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2)
            )

        regions: List[TextRegion] = []
        raw_text_list: List[str] = []
        norm_text_list: List[str] = []

        if data_df is not None and not data_df.empty:
            # Filter non-empty text rows
            data_df = data_df.dropna(subset=['text'])
            data_df = data_df[data_df['text'].str.strip() != '']

            idx = 0
            for _, row in data_df.iterrows():
                text = str(row['text']).strip()
                if not text:
                    continue
                left = int(row['left'])
                top = int(row['top'])
                width_px = int(row['width'])
                height_px = int(row['height'])
                conf_val = float(row['conf'])

                conf = round(conf_val / 100.0, 4) if conf_val >= 0 else None
                bbox = BoundingBox(x1=left, y1=top, x2=left + width_px, y2=top + height_px)
                norm_t = normalize_ocr_text(text)

                text_reg = TextRegion(
                    region_id=idx,
                    bbox=bbox,
                    polygon=[(left, top), (left + width_px, top), (left + width_px, top + height_px), (left, top + height_px)],
                    text=text,
                    normalized_text=norm_t,
                    confidence=conf,
                    language="eng"
                )
                regions.append(text_reg)
                raw_text_list.append(text)
                norm_text_list.append(norm_t)
                idx += 1

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
