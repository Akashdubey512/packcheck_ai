"""
Real-Data End-to-End Pipeline Integration Test
Phase 2 Preprocessing -> Phase 3 OCR Engine -> Phase 4 Mandatory Field Extraction
"""

import unittest
from pathlib import Path
from PIL import Image

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline
from ml.extraction.types import ProductFacts, CANONICAL_FIELD_NAMES


class TestExtractionIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.val_images_dir = Path("processed_data/val/images")
        cls.preproc_pipeline = PreprocessingPipeline()
        cls.ocr_engine = get_ocr_engine("rapidocr")
        cls.extraction_pipeline = ExtractionPipeline()

    def test_e2e_pipeline_on_real_images(self):
        """Run Phase 2 -> Phase 3 -> Phase 4 pipeline on sample real packaging images."""
        if not self.val_images_dir.exists():
            self.skipTest(f"Validation images directory missing: {self.val_images_dir}")

        image_files = sorted(list(self.val_images_dir.glob("open_food_facts_india_*.jpg")))[:5]
        if not image_files:
            image_files = sorted(list(self.val_images_dir.glob("*.jpg")) + list(self.val_images_dir.glob("*.png")) + list(self.val_images_dir.glob("*.jpeg")))[:5]

        self.assertGreaterEqual(len(image_files), 1, "No real validation images found for integration test")

        for img_path in image_files:
            with self.subTest(image=img_path.name):
                # Step 1: Phase 2 Preprocessing
                preproc_res = self.preproc_pipeline.process(str(img_path))
                self.assertTrue(preproc_res["validation"]["valid"], f"Preprocessing failed for {img_path.name}")
                self.assertIn("ocr_primary", preproc_res["variants"])

                primary_img = preproc_res["variants"]["ocr_primary"]

                # Step 2: Phase 3 OCR Execution
                ocr_res = self.ocr_engine.detect_and_recognize(
                    image_input=primary_img,
                    image_id=img_path.stem
                )
                self.assertIsNotNone(ocr_res)
                self.assertIn(ocr_res.status, ["SUCCESS", "NO_TEXT", "PARTIAL"])

                # Step 3: Phase 4 Mandatory Field Extraction
                facts = self.extraction_pipeline.process(ocr_res, product_id=img_path.stem)

                # Schema & Traceability Verification
                self.assertIsInstance(facts, ProductFacts)
                self.assertEqual(facts.product_id, img_path.stem)
                self.assertEqual(len(facts.fields), 9)

                for canon_field in CANONICAL_FIELD_NAMES:
                    self.assertIn(canon_field, facts.fields)
                    extracted = facts.fields[canon_field]
                    self.assertEqual(extracted.field_name, canon_field)

                    # Verify region traceability: region IDs must come from OCR result
                    for r_id in extracted.source_region_ids:
                        valid_rids = [str(r.region_id) for r in ocr_res.regions]
                        self.assertIn(str(r_id), valid_rids, f"Fabricated or invalid region ID {r_id} found in {canon_field}")


if __name__ == "__main__":
    unittest.main()
