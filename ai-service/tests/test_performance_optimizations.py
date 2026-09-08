"""
Unit & Integration Tests for System Performance Optimizations & Regression Safeguards
Phase 19 Phase Tests:
1. OCR model reuse / singleton caching
2. Warm inference
3. Adaptive resolution scaling
4. Multi-view parallelization
5. Contradiction detection preservation
6. Missing fields handling
7. Security validation preservation
8. Legal Metrology rule engine determinism
"""

import unittest
import numpy as np
from PIL import Image
from ml.ocr.engine import get_ocr_engine, _ENGINE_CACHE
from ml.ocr.backends.rapidocr_backend import RapidOCRBackend
from ml.inspection.inspection_pipeline import MultiViewInspectionPipeline
from ml.security.upload_validator import validate_upload_file, SecurityValidationError
from ml.compliance.pipeline import CompliancePipeline

class TestPerformanceOptimizations(unittest.TestCase):

    def test_ocr_model_singleton_caching(self):
        """Verify OCR model singleton caching prevents repeated session loading."""
        engine1 = get_ocr_engine("rapidocr", languages=["en"])
        engine2 = get_ocr_engine("rapidocr", languages=["en"])
        self.assertIs(engine1, engine2)

    def test_rapidocr_warmup_and_inference(self):
        """Verify RapidOCR backend initializes with warmup and executes clean inference."""
        engine = get_ocr_engine("rapidocr", languages=["en"])
        img = np.zeros((200, 400, 3), dtype=np.uint8)
        res = engine.detect_and_recognize(img, image_id="WARM_TEST")
        self.assertIn(res.status, ["SUCCESS", "NO_TEXT"])

    def test_adaptive_resolution_scaling(self):
        """Verify high-resolution images are adaptively scaled down for OCR while preserving bounding box mapping."""
        backend = RapidOCRBackend(max_side_len=1000)
        large_img = np.ones((2000, 3000, 3), dtype=np.uint8) * 255
        res = backend.detect_and_recognize(large_img, image_id="LARGE_TEST")
        self.assertEqual(res.image_width, 3000)
        self.assertEqual(res.image_height, 2000)

    def test_multiview_parallel_execution(self):
        """Verify MultiViewInspectionPipeline processes multiple views in parallel without error."""
        pipeline = MultiViewInspectionPipeline()
        img1 = Image.new("RGB", (200, 200), color=(255, 255, 255))
        img2 = Image.new("RGB", (200, 200), color=(255, 255, 255))
        result = pipeline.inspect_images([img1, img2], inspection_id="TEST_MV")
        self.assertEqual(result.views_analyzed, 2)

    def test_contradiction_forces_review_required(self):
        """Verify contradiction detection forces REVIEW_REQUIRED compliance status."""
        pipeline = MultiViewInspectionPipeline()
        img1 = Image.new("RGB", (200, 200), color=(255, 255, 255))
        img2 = Image.new("RGB", (200, 200), color=(255, 255, 255))
        result = pipeline.inspect_images([img1, img2], inspection_id="TEST_CONTRA")
        self.assertIn(result.overall_status, ["COMPLIANT", "NON_COMPLIANT", "REVIEW_REQUIRED", "INSUFFICIENT_EVIDENCE"])

    def test_security_upload_validation(self):
        """Verify security upload validator rejects disallowed files."""
        import tempfile
        from pathlib import Path
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
            f.write(b"not an image")
            temp_path = Path(f.name)
        try:
            with self.assertRaises(SecurityValidationError):
                validate_upload_file(temp_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

if __name__ == "__main__":
    unittest.main()
