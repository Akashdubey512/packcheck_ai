"""
Unit Tests for Evidence Linking & Crop Generation Engine
"""

import unittest
from PIL import Image, ImageDraw
from pathlib import Path
import shutil

from ml.extraction.types import ProductFacts, ExtractedField, FieldStatus
from ml.confidence.evidence import EvidenceLinker
from ml.confidence.types import EvidenceManifest


class TestEvidenceLinking(unittest.TestCase):

    def setUp(self):
        self.output_dir = Path("scratch/test_evidence_crops")
        self.linker = EvidenceLinker(crop_output_dir=str(self.output_dir))

        # Create dummy PIL Image
        self.img = Image.new("RGB", (200, 200), color=(255, 255, 255))
        draw = ImageDraw.Draw(self.img)
        draw.rectangle([10, 10, 100, 40], fill=(0, 0, 0))

    def tearDown(self):
        if self.output_dir.exists():
            shutil.rmtree(self.output_dir, ignore_errors=True)

    def test_evidence_manifest_generation(self):
        field = ExtractedField(
            field_name="mrp",
            raw_text="MRP ₹249.00",
            raw_value="₹249.00",
            source_region_ids=["0"],
            source_bbox=[10, 10, 100, 40],
            status=FieldStatus.EXTRACTED.value
        )
        facts = ProductFacts(product_id="test_img_crop_01", fields={"mrp": field})
        manifest = self.linker.generate_evidence_manifest(facts, image_input=self.img)

        self.assertIsInstance(manifest, EvidenceManifest)
        self.assertEqual(manifest.product_id, "test_img_crop_01")
        self.assertEqual(len(manifest.crops), 1)

        crop = manifest.crops[0]
        self.assertEqual(crop.field_name, "mrp")
        self.assertEqual(crop.bbox, [10, 10, 100, 40])
        self.assertTrue(Path(crop.image_path).exists())
        self.assertNotEqual(crop.crop_sha256, "")
        self.assertNotEqual(crop.crop_sha256, "UNAVAILABLE")


if __name__ == "__main__":
    unittest.main()
