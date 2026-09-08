"""
Real-Data End-to-End Pipeline Integration Test (Phase 2 -> Phase 3 -> Phase 4 -> Phase 5)
Verifies full pipeline execution, visual evidence crop generation, cryptographic SHA-256 provenance, and audit traceability.
"""

import unittest
from pathlib import Path
from PIL import Image

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline
from ml.confidence.pipeline import ConfidencePipeline
from ml.confidence.types import AuditedProductFacts, CalibrationStatus


class TestConfidenceIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.val_images_dir = Path("processed_data/val/images")
        cls.preproc_pipeline = PreprocessingPipeline()
        cls.ocr_engine = get_ocr_engine("rapidocr")
        cls.extraction_pipeline = ExtractionPipeline()
        cls.confidence_pipeline = ConfidencePipeline(crop_output_dir="processed_data/evidence_crops")

    def test_e2e_audited_pipeline_on_real_images(self):
        """Run Phase 2 -> 3 -> 4 -> 5 full audited pipeline on real packaging validation images."""
        if not self.val_images_dir.exists():
            self.skipTest(f"Validation images directory missing: {self.val_images_dir}")

        image_files = sorted(
            list(self.val_images_dir.glob("open_food_facts_india_*.jpg"))
        )[:3]

        if not image_files:
            image_files = sorted(
                list(self.val_images_dir.glob("*.jpg")) +
                list(self.val_images_dir.glob("*.png"))
            )[:3]

        self.assertGreaterEqual(len(image_files), 1, "No validation images found for real integration test")

        for img_path in image_files:
            with self.subTest(image=img_path.name):
                # Step 1: Preprocessing
                preproc_res = self.preproc_pipeline.process(str(img_path))
                if "ocr_primary" not in preproc_res["variants"]:
                    continue

                primary_img = preproc_res["variants"]["ocr_primary"]

                # Step 2: OCR Execution
                ocr_res = self.ocr_engine.detect_and_recognize(
                    image_input=primary_img,
                    image_id=img_path.stem
                )

                # Step 3: Mandatory Field Extraction
                facts = self.extraction_pipeline.process(ocr_res, product_id=img_path.stem)

                # Step 4: Phase 5 Confidence, Evidence & Audit Pipeline
                audited = self.confidence_pipeline.process(
                    product_facts=facts,
                    image_input=img_path,
                    ocr_result=ocr_res,
                    preprocessing_result=preproc_res
                )

                # Verification
                self.assertIsInstance(audited, AuditedProductFacts)
                self.assertEqual(audited.product_id, img_path.stem)
                self.assertEqual(len(audited.provenance.input_sha256), 64)

                # Verify Evidence Manifest & Crop Files
                manifest = audited.evidence_manifest
                self.assertEqual(manifest.product_id, img_path.stem)

                for crop in manifest.crops:
                    self.assertEqual(len(crop.crop_sha256), 64)
                    crop_file = Path(crop.image_path)
                    self.assertTrue(crop_file.exists(), f"Evidence crop file missing: {crop.image_path}")

                # Verify Calibration status is CALIBRATION_UNAVAILABLE (no fake curves)
                for f_name, audited_f in audited.fields.items():
                    self.assertEqual(
                        audited_f.confidence.calibration_status,
                        CalibrationStatus.CALIBRATION_UNAVAILABLE.value
                    )
                    self.assertIsNone(audited_f.confidence.calibrated_probability)


if __name__ == "__main__":
    unittest.main()
