"""
Unit tests for image_validator.py module
"""

import unittest
import numpy as np
import tempfile
from pathlib import Path
from PIL import Image

from ml.preprocessing.image_validator import validate_image, detect_mime_format

class TestImageValidator(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_path = Path(self.temp_dir.name)

        # Create valid test image
        self.valid_img_path = self.temp_path / "valid.jpg"
        img = Image.new("RGB", (200, 200), color="blue")
        img.save(self.valid_img_path, format="JPEG")

        # Create tiny image
        self.tiny_img_path = self.temp_path / "tiny.png"
        img_tiny = Image.new("RGB", (10, 10), color="red")
        img_tiny.save(self.tiny_img_path, format="PNG")

        # Create RGBA image
        self.rgba_img_path = self.temp_path / "rgba.png"
        img_rgba = Image.new("RGBA", (100, 100), color=(255, 0, 0, 128))
        img_rgba.save(self.rgba_img_path, format="PNG")

        # Create corrupt image file
        self.corrupt_img_path = self.temp_path / "corrupt.jpg"
        with open(self.corrupt_img_path, "wb") as f:
            f.write(b"NOT_AN_IMAGE_HEADER_DATA")

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_valid_image(self):
        res = validate_image(self.valid_img_path)
        self.assertTrue(res["valid"])
        self.assertEqual(res["width"], 200)
        self.assertEqual(res["height"], 200)
        self.assertEqual(res["channels"], 3)
        self.assertEqual(len(res["errors"]), 0)

    def test_image_not_found(self):
        missing_path = self.temp_path / "non_existent.jpg"
        res = validate_image(missing_path)
        self.assertFalse(res["valid"])
        self.assertEqual(res["errors"][0]["code"], "IMAGE_NOT_FOUND")

    def test_corrupt_image(self):
        res = validate_image(self.corrupt_img_path)
        self.assertFalse(res["valid"])
        self.assertEqual(res["errors"][0]["code"], "IMAGE_UNREADABLE")

    def test_tiny_image_error(self):
        res = validate_image(self.tiny_img_path, min_width=32, min_height=32)
        self.assertFalse(res["valid"])
        self.assertEqual(res["errors"][0]["code"], "IMAGE_TOO_SMALL")

    def test_rgba_image_warning(self):
        res = validate_image(self.rgba_img_path)
        self.assertTrue(res["valid"])
        self.assertEqual(res["channels"], 4)
        self.assertTrue(any("alpha channel" in w for w in res["warnings"]))

if __name__ == "__main__":
    unittest.main()
