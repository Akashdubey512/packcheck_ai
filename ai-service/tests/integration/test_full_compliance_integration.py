"""
Real-Data Full End-to-End Pipeline Integration Test
Phase 2 Preprocessing -> Phase 3 OCR -> Phase 4 Extraction -> Phase 5 Confidence -> Phase 6 Legal Compliance
Verifies complete pipeline execution on real validation packaging images.
"""

import unittest
from pathlib import Path
from PIL import Image

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline
from ml.confidence.pipeline import ConfidencePipeline
from ml.compliance.pipeline import CompliancePipeline
from ml.compliance.types import ComplianceResult, ComplianceStatus


class TestFullComplianceIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.val_images_dir = Path("processed_data/val/images")
        cls.preproc_pipeline = PreprocessingPipeline()
        cls.ocr_engine = get_ocr_engine("rapidocr")
        cls.extraction_pipeline = ExtractionPipeline()
        cls.confidence_pipeline = ConfidencePipeline(crop_output_dir="processed_data/evidence_crops")
        cls.compliance_pipeline = CompliancePipeline()

    def test_e2e_full_compliance_pipeline_on_real_images(self):
        """Run Phase 2 -> 3 -> 4 -> 5 -> 6 full compliance pipeline on real validation packaging images."""
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

        self.assertGreaterEqual(len(image_files), 1, "No validation images found for full compliance integration test")

        for img_path in image_files:
            with self.subTest(image=img_path.name):
                # Step 1: Preprocessing
                preproc_res = self.preproc_pipeline.process(str(img_path))
                if "ocr_primary" not in preproc_res["variants"]:
                    continue
                primary_img = preproc_res["variants"]["ocr_primary"]

                # Step 2: Phase 3 OCR
                ocr_res = self.ocr_engine.detect_and_recognize(primary_img, image_id=img_path.stem)

                # Step 3: Phase 4 Mandatory Field Extraction
                facts = self.extraction_pipeline.process(ocr_res, product_id=img_path.stem)

                # Step 4: Phase 5 Confidence & Audit
                audited = self.confidence_pipeline.process(
                    product_facts=facts,
                    image_input=img_path,
                    ocr_result=ocr_res,
                    preprocessing_result=preproc_res
                )

                # Step 5: Phase 6 Legal Rule Engine
                compliance_res = self.compliance_pipeline.process(audited_facts=audited)

                # Schema & Verdict Verification
                self.assertIsInstance(compliance_res, ComplianceResult)
                self.assertEqual(compliance_res.product_id, img_path.stem)
                self.assertIn(compliance_res.overall_status, [
                    ComplianceStatus.COMPLIANT.value,
                    ComplianceStatus.NON_COMPLIANT.value,
                    ComplianceStatus.REVIEW_REQUIRED.value,
                    ComplianceStatus.INSUFFICIENT_EVIDENCE.value
                ])
                self.assertGreaterEqual(len(compliance_res.rules_evaluated), 1)
                self.assertIsNotNone(compliance_res.provenance)


if __name__ == "__main__":
    unittest.main()
