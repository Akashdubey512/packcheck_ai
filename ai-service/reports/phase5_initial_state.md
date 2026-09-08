# Phase 5 Initial State Audit Report

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026)  
**Phase**: Phase 5 — Confidence Calibration, Evidence Linking & Audit Traceability  
**Date**: September 8, 2026  

---

## 1. Executive Summary

Phase 1, Phase 2, Phase 3, and Phase 4 are fully complete, verified, and benchmarked:
- **Phase 1**: Dataset collection, zero-leakage 80/10/10 split (1324 train / 164 val / 118 test).
- **Phase 2**: Image quality validation, orientation, deskew, contrast preprocessing pipeline (12.92 ms avg latency, 17/17 tests passing).
- **Phase 3**: Text Detection + OCR Engine (RapidOCR primary, EasyOCR & PyTesseract fallbacks, 28/28 tests passing).
- **Phase 4**: Mandatory Field Extraction + Value Normalization (9 canonical fields, `ProductFacts` schema, 51/51 tests passing).

Phase 5 introduces **Confidence Calibration**, **Evidence Linking & Crop Generation**, **Provenance Hashing**, and **Audit Traceability**.

> [!CRITICAL]
> **Strict Architectural Boundary**: Phase 5 measures confidence, links visual & textual evidence, generates evidence crops, provides audit traceability, and explains extraction uncertainty. Phase 5 **MUST NOT** decide legal compliance. Legal compliance evaluation is strictly deferred to a later dedicated rule engine phase.

---

## 2. Available Confidence & Traceability Signals

| Stage | Input Signal | Output Metric / Artifact | Status |
| :--- | :--- | :--- | :--- |
| **Phase 2** | Image blur, brightness, contrast, noise | `ImageQualityMetrics` | Preserved in Preprocessing Result |
| **Phase 3** | OCR recognizer & detector scores | `TextRegion.confidence`, `detector_confidence`, `recognizer_confidence` | Preserved in `OCRResult` |
| **Phase 4** | Keyword match, regex score, spatial proximity | `FieldCandidate.score`, `ExtractedField.extraction_confidence` | Preserved in `ProductFacts` |
| **Phase 4** | Unit scaling & date pattern parsing | `NormalizedValue.normalization_status` | Preserved in `ProductFacts` |
| **Phase 4** | OCR region bounding boxes | `source_region_ids`, `source_bbox` | Preserved in `ProductFacts` |

---

## 3. Calibration Feasibility & Ground Truth Status

- **Dataset Audit**: Phase 1 datasets (SROIE, Product Description OCR, Open Food Facts India) lack region-level entity ground truth for the 9 Legal Metrology mandatory packaging fields.
- **Calibration Status**: Expected calibration status will be `CALIBRATION_UNAVAILABLE` or `UNCALIBRATED`.
- **Strict Rule**: No fabricated expected calibration error (ECE), reliability diagrams, or Platt scaling curves will be reported where ground truth does not exist.

---

## 4. Proposed Phase 5 Architecture

```
PRODUCT FACTS (Phase 4) + PREPROCESSED IMAGE (Phase 2) + OCR RESULT (Phase 3)
  ↓
CONFIDENCE ENGINE (ml/confidence/calibrator.py)
  ↓
EVIDENCE LINKING & CROP GENERATOR (ml/confidence/evidence.py)
  ↓
PROVENANCE ENGINE (ml/confidence/provenance.py - SHA-256 Hashing)
  ↓
UNCERTAINTY EXPLAINER (ml/confidence/explainer.py)
  ↓
AUDITED PRODUCT FACTS / CONFIDENCE RESULT (ml/confidence/pipeline.py)
```

Target Modules (`ml/confidence/`):
- `ml/confidence/__init__.py`
- `ml/confidence/types.py`
- `ml/confidence/exceptions.py`
- `ml/confidence/calibrator.py`
- `ml/confidence/evidence.py`
- `ml/confidence/provenance.py`
- `ml/confidence/explainer.py`
- `ml/confidence/pipeline.py`
