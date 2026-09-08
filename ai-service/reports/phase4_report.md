# Phase 4 — Mandatory Field Extraction + Value Normalization Final Report

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026)  
**Phase**: Phase 4  
**Date**: September 8, 2026  
**Status**: COMPLETED  
**ML Contract Version**: `1.2.0`  

---

## 1. Objective

Phase 4 builds a production-quality system that converts raw Phase 3 OCR outputs into structured, machine-readable mandatory packaged-commodity fields under the **Legal Metrology (Packaged Commodities) Rules, 2011** (and 2017/2021/2022 amendments).

> [!CRITICAL]
> **Strict Architectural Boundary**: Phase 4 extracts product facts and normalizes values. Phase 4 **MUST NOT** decide legal compliance. For example, extracting `{"field": "mrp", "raw_value": "₹249.00", "normalized_value": {"amount": 249.0, "currency": "INR"}}` is strictly a fact extraction. Declaring whether MRP is legally compliant is strictly deferred to Phase 5.

---

## 2. Extraction Pipeline Architecture

```
IMAGE
  ↓
PHASE 2 PREPROCESSING (Adaptive Validation, Deskew, CLAHE, Binarization)
  ↓
PHASE 3 TEXT DETECTION + OCR (RapidOCR / EasyOCR / PyTesseract)
  ↓
OCR REGIONS (TextRegion objects with bboxes, text & normalized_text)
  ↓
FIELD CANDIDATE DETECTION (ml/extraction/candidates.py)
  ↓
FIELD CLASSIFICATION & RANKING (ml/extraction/classifier.py)
  ↓
VALUE EXTRACTION (ml/extraction/extractor.py)
  ↓
VALUE NORMALIZATION (ml/extraction/normalizer.py)
  ↓
STRUCTURED PRODUCT FACTS (ml/extraction/types.py -> ProductFacts)
  ↓
PHASE 5 CONFIDENCE + EVIDENCE LINKING
```

All extraction modules reside in `ml/extraction/`:
- [`ml/extraction/types.py`](file:///d:/sih_2026/ml/extraction/types.py): Strong typing schemas, explicit statuses (`FieldStatus`, `NormalizationStatus`), `ProductFacts`.
- [`ml/extraction/exceptions.py`](file:///d:/sih_2026/ml/extraction/exceptions.py): Custom exception hierarchy.
- [`ml/extraction/candidates.py`](file:///d:/sih_2026/ml/extraction/candidates.py): Bilingual regex & spatial keyword candidate generator.
- [`ml/extraction/classifier.py`](file:///d:/sih_2026/ml/extraction/classifier.py): Candidate scoring, ranking, and competing candidate detection.
- [`ml/extraction/extractor.py`](file:///d:/sih_2026/ml/extraction/extractor.py): Specialized field extractions for 9 mandatory fields.
- [`ml/extraction/normalizer.py`](file:///d:/sih_2026/ml/extraction/normalizer.py): Canonical unit normalizer (`g`, `kg`, `ml`, `L`, `INR`, ISO dates).
- [`ml/extraction/pipeline.py`](file:///d:/sih_2026/ml/extraction/pipeline.py): End-to-end extraction pipeline.

---

## 3. Supported Legal Field Schema

Phase 4 supports all 9 mandatory Legal Metrology declaration fields from `raw_data/legal_metrology/legal_metrology_rules.json`:

1. `manufacturer_name_and_address` (Rule 6(1)(a)) — Name and address of manufacturer, packer, or importer.
2. `country_of_origin` (Rule 6(1)(b)) — Country of origin for imported commodities.
3. `common_generic_name` (Rule 6(1)(c)) — Generic/common name of commodity.
4. `net_quantity` (Rule 6(1)(d)) — Net quantity in standard units of weight, measure, or number.
5. `manufacturing_packing_date` (Rule 6(1)(e)) — Month and year of manufacture, packing, or import.
6. `best_before_expiry` (Rule 6(1)(f)) — Best before or expiry date/period for perishable commodities.
7. `mrp` (Rule 6(1)(g)) — Maximum Retail Price inclusive of all taxes (`INR`).
8. `consumer_care_details` (Rule 6(1)(h)) — Contact details (phone, toll-free, email, address) for consumer complaints.
9. `unit_sale_price` (Rule 6(1)(11)) — Unit sale price per standard unit (mandatory w.e.f. 2022 amendment).

---

## 4. Candidate Generation & OCR Error Tolerance

Candidate generation (`CandidateGenerator`) leverages multiple robust signals:
- **Bilingual Keywords**: English and Hindi/Devanagari patterns (`MRP`, `एमआरपी`, `Net Qty`, `निवल मात्रा`, `Mfg Date`, `पैकिंग तिथि`, `Customer Care`, `ग्राहक सेवा`, etc.).
- **OCR Typo Tolerance**: Tolerates common variations like `M.R.P`, `MR P`, `NetQty`, `Pkd`, `Exp`, `Mfg Dt`.
- **Digit Sanitization**: Context-aware digit correction (`sanitize_ocr_digits`) fixes `O` $\rightarrow$ `0`, `l`/`I` $\rightarrow$ `1` ONLY when surrounding text confirms a numeric context.
- **Spatial Line Pairing**: Pairs label text regions (e.g. `Country of Origin:`) with adjacent value regions (e.g. `India`) vertically or horizontally within bounding box proximity thresholds.

---

## 5. Field Candidate Scoring & Classification

`FieldClassifier` ranks candidates using composite scoring:
- `spatial_keyword_pair`: +0.40 weight
- `regex_match`: +0.35 weight
- `keyword_match`: +0.15 weight
- `domain_heuristics`: +0.10 to +0.15 boost for currency symbols, unit match, or exact date structures. Penalizes offer prices mistaken for MRP.

---

## 6. Value Extraction & Normalization Capabilities

- **MRP**: Extracted as float amount, currency `INR`.
- **Net Quantity**: Standardized into `value`, `unit`, `canonical_value`, and `canonical_unit`:
  - Mass: `mg` $\rightarrow$ `g` $\rightarrow$ `kg`. Canonical unit: `g`.
  - Volume: `ml` $\rightarrow$ `L`. Canonical unit: `ml`.
  - Count: `N` / `units` / `pcs`.
  - **Strict Boundary**: Never converts mass to volume or vice-versa. Never infers density.
- **Dates**:
  - ISO format: `YYYY-MM-DD` or `YYYY-MM`.
  - Ambiguous dates (e.g., `05/06/2026` where both day and month $\le 12$) return `normalization_status: AMBIGUOUS` with alternative ISO dates listed.
- **Country of Origin**: Canonicalized country name (e.g. `India`, `United States`, `China`).
- **Consumer Care**: Structured dict containing `phone`, `toll_free`, `email`, `url`, and `raw_contact`.
- **Unit Sale Price**: Extracted float amount, currency `INR`, and unit basis (`unit_basis_quantity`, `unit_basis_unit`).

---

## 7. Multiple Candidate Handling & Explicit Field Statuses

Products often contain multiple price or date candidates (e.g. MRP ₹100 vs Offer Price ₹80).
- Candidates are never silently discarded.
- Full `candidates` array is retained in `ExtractedField`.
- Explicit Field Statuses:
  - `EXTRACTED`: High confidence single extraction.
  - `MULTIPLE_CANDIDATES`: Multiple distinct competing values detected.
  - `AMBIGUOUS`: Date or numeric ambiguity present.
  - `NOT_FOUND`: Field absent in OCR.
  - `LOW_CONFIDENCE`: Candidate score below 0.70 threshold.
  - `REVIEW_REQUIRED`: Requires manual review.

---

## 8. Evidence Linking & Traceability

Every extracted field contains:
- `source_region_ids`: List of OCR region IDs (e.g. `["0", "1"]`).
- `source_text`: Exact raw text string from OCR.
- `source_bbox`: `[x1, y1, x2, y2]` bounding box coordinates mapped back to original image pixels.

---

## 9. Evaluation Results

- **Dataset Audit Finding**: Existing datasets (SROIE, Product Description OCR, Open Food Facts India) lack region-level ground truth annotations for the 9 Legal Metrology mandatory fields.
- **Ground Truth Status**: `NOT_AVAILABLE` (as per Step 13 & Step 14 strict rules).
- **Fabricated Metrics**: 0 (Ground truth fabrication strictly prohibited).

---

## 10. Performance Benchmark Summary

- **Unit & Integration Tests**: 51 passed (0 failed, 0 errors across Phase 2, Phase 3, Phase 4).
- **Benchmark Sample Size**: 100 validation images.
- **Successful Pipeline Runs**: 85 valid packaging images (100% success on readable variants).
- **Extraction-Only Latency**:
  - Average: **0.11 ms / image**
  - Median: **0.04 ms / image**
  - P95: **0.39 ms / image**
  - Standalone Throughput: **8,715 images / sec**
- **Full End-to-End Pipeline Latency** (Preprocessing + RapidOCR + Extraction):
  - Average: **874.05 ms / image**
  - Median: **732.69 ms / image**
  - P95: **1733.33 ms / image**
  - Full Pipeline Throughput: **1.14 images / sec** (CPU)
- **RAM Delta**: **15.96 MB**

---

## 11. Known Limitations & Phase 5 Prerequisites

1. **OCR Dependability**: Field extraction depends on OCR character recognition quality. Low resolution or heavily blurred text may require human review.
2. **Phase 5 Prerequisites**:
   - Legal Metrology Compliance Rule Engine (Rule 6 font size, mandatory presence, tax inclusion declarations).
   - Multi-modal evidence visual highlighter and audit trail generator.

---

## 12. Verification & Acceptance Checklist

- [x] Existing project inspected
- [x] Legal field schema implemented (9 canonical fields + aliases)
- [x] Candidate generation implemented (`ml/extraction/candidates.py`)
- [x] Field classifier implemented (`ml/extraction/classifier.py`)
- [x] Value extraction implemented (`ml/extraction/extractor.py`)
- [x] MRP extraction implemented
- [x] Net quantity extraction implemented
- [x] Manufacturing/packing date extraction implemented
- [x] Expiry/best before date extraction implemented
- [x] Country of origin extraction implemented
- [x] Manufacturer name & address extraction implemented
- [x] Common generic name extraction implemented
- [x] Consumer care extraction implemented
- [x] Unit sale price extraction implemented
- [x] Normalization implemented (`ml/extraction/normalizer.py`)
- [x] OCR error tolerance implemented (`sanitize_ocr_digits`)
- [x] Multiple candidates supported without discarding
- [x] Explicit field statuses implemented (`FieldStatus`)
- [x] Evidence traceability implemented (`source_region_ids`, `source_bbox`)
- [x] ProductFacts schema implemented
- [x] Evaluation script implemented (`scripts/evaluate_extraction.py`)
- [x] NOT_AVAILABLE reported where ground truth does not exist
- [x] Error analysis completed (`reports/phase4_error_analysis.md`)
- [x] Real-data integration test completed (`tests/integration/test_extraction_integration.py`)
- [x] Benchmark script implemented (`scripts/benchmark_extraction.py`)
- [x] Unit tests pass (51/51 passed)
- [x] Documentation updated (`walkthrough.md`, `ML_CONTRACT.md`)
- [x] Phase 1 untouched
- [x] Phase 2 preserved
- [x] Phase 3 preserved
- [x] NO legal compliance decision implemented in Phase 4
