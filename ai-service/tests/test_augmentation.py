"""
Unit tests for augmentation.py module
"""

import unittest
from PIL import Image

from ml.preprocessing.augmentation import get_training_augmentation

class TestAugmentation(unittest.TestCase):
    def setUp(self):
        self.test_img = Image.new("RGB", (100, 100), color="blue")

    def test_eval_mode_no_aug(self):
        res = get_training_augmentation(self.test_img, is_training=False)
        self.assertEqual(res, self.test_img)

    def test_train_mode_aug(self):
        res = get_training_augmentation(self.test_img, is_training=True)
        self.assertIsNotNone(res)
        self.assertIsInstance(res, Image.Image)

if __name__ == "__main__":
    unittest.main()
