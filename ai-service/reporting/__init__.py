"""
Reporting Package
Generates official regulatory Legal Metrology Compliance Inspection Reports.
"""

from .pdf_exporter import generate_inspection_pdf

__all__ = ["generate_inspection_pdf"]
