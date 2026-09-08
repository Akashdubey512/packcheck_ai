# Master Failure Mode & Error Taxonomy Analysis

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026)  
**Date**: September 8, 2026  
**Status**: COMPREHENSIVE TAXONOMY ESTABLISHED  

---

## 1. Failure Taxonomy & Root Causes

| Failure Category | Primary Root Cause | Subsystem | System Handling Strategy |
| :--- | :--- | :--- | :--- |
| `OCR_NO_TEXT` | Severe blur or non-text image face | `ml/ocr/` | Emit `OCR_NO_TEXT` status; flag `INSUFFICIENT_EVIDENCE` |
| `OCR_LOW_QUALITY` | Overexposure / specular reflection | `ml/ocr/` | Fallback to PyTesseract / high contrast variant |
| `EXTRACTION_AMBIGUITY` | Stylized font or non-standard date format | `ml/extraction/` | Preserve multiple candidates; emit `REVIEW_REQUIRED` |
| `CONTRADICTION` | Conflicting MRP/Dates across package faces | `ml/inspection/` | Cross-view contradiction engine flags `CONTRADICTION_DETECTED` |
| `INSPECTION_INCOMPLETE` | Only 1 image face uploaded | `ml/inspection/` | Missing fields set `INSUFFICIENT_EVIDENCE` instead of `NON_COMPLIANT` |
