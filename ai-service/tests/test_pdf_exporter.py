"""
Unit Tests for Regulatory PDF Exporter
"""

import unittest
from pathlib import Path
from reporting.pdf_exporter import generate_inspection_pdf

class TestPDFExporter(unittest.TestCase):

    def test_pdf_generation(self):
        payload = {
            "inspection_id": "TEST_PDF_99",
            "overall_status": "COMPLIANT",
            "views_analyzed": 1,
            "compliance_result": {
                "field_outcomes": {
                    "mrp": {"rule_id": "LM-PC-MRP-001", "field_name": "mrp", "extracted_value": "₹150.00", "status": "PASS"}
                }
            }
        }
        pdf_path = generate_inspection_pdf(payload)
        self.assertTrue(Path(pdf_path).exists())
        self.assertTrue(Path(pdf_path).stat().st_size > 0)

if __name__ == "__main__":
    unittest.main()
