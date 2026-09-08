"""
Unit Tests for File Upload Security Safeguards
"""

import unittest
from pathlib import Path
from ml.security.upload_validator import sanitize_filename, validate_upload_file, SecurityValidationError

class TestSecurity(unittest.TestCase):

    def test_sanitize_filename_traversal(self):
        filename = "../../../etc/passwd"
        clean = sanitize_filename(filename)
        self.assertNotIn("..", clean)
        self.assertEqual(clean, "passwd")

    def test_invalid_file_extension(self):
        fake_path = Path("test_script.py")
        fake_path.touch()
        try:
            with self.assertRaises(SecurityValidationError):
                validate_upload_file(fake_path)
        finally:
            if fake_path.exists():
                fake_path.unlink()

if __name__ == "__main__":
    unittest.main()
