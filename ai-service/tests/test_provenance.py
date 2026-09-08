"""
Unit Tests for Audit Traceability & Cryptographic Provenance Engine
"""

import unittest
from PIL import Image
from ml.confidence.provenance import ProvenanceTracker
from ml.confidence.types import InputProvenance


class TestProvenance(unittest.TestCase):

    def setUp(self):
        self.tracker = ProvenanceTracker()

    def test_image_sha256_computation(self):
        img = Image.new("RGB", (100, 100), color=(128, 128, 128))
        sha = self.tracker.compute_image_sha256(img)
        self.assertEqual(len(sha), 64)  # SHA-256 is 64 hex characters

    def test_provenance_manifest_generation(self):
        img = Image.new("RGB", (100, 100), color=(255, 0, 0))
        prov = self.tracker.generate_provenance(
            image_input=img,
            dataset_version="1.0.0",
            preprocessing_version="1.0.0",
            ocr_engine="rapidocr",
            ocr_version="1.2.3",
            extraction_version="1.0.0"
        )
        self.assertIsInstance(prov, InputProvenance)
        self.assertEqual(len(prov.input_sha256), 64)
        self.assertEqual(prov.ocr_engine, "rapidocr")
        self.assertEqual(prov.confidence_version, "1.0.0")


if __name__ == "__main__":
    unittest.main()
