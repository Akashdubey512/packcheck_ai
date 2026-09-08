# Phase 5 Confidence Calibration, Evidence & Audit Error Analysis Report

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026)  
**Phase**: Phase 5 — Confidence Calibration, Evidence Linking & Audit Traceability  
**Document Status**: Production Complete  

---

## 1. Executive Summary & Scope

This report documents uncertainty modes, visual crop edge cases, calibration constraints, and evidence linking failure modes evaluated in Phase 5.

> [!IMPORTANT]
> **Core Architectural Boundary**: Phase 5 measures multi-factor confidence, links visual evidence crops, computes cryptographic SHA-256 provenance, and explains uncertainty. All failure modes documented herein are classified strictly as **confidence/audit uncertainty modes**. They MUST NOT be interpreted as legal compliance decisions.

---

## 2. Taxonomy of Confidence & Audit Uncertainty Modes

### Uncertainty Mode 1: Low Resolution / Micro-Font Image Crops
* **Description**: Evidence crops generated for small numeric font regions (e.g. font height $< 1.5$mm on packages $< 100\text{ cm}^2$).
* **Impact**: Visual evidence crop contains pixelated or low-contrast characters.
* **Handling Strategy**: `ConfidenceCalibrator` incorporates Phase 2 image quality metrics. When blur score or sharpness is degraded, `image_quality_score` drops and the field status is assigned `LOW_QUALITY_EVIDENCE`.

### Uncertainty Mode 2: Contradictory Competing Candidates (e.g. MRP vs Offer Price)
* **Description**: OCR text contains multiple candidate prices (`MRP ₹249.00` and `Offer Price ₹199.00`).
* **Impact**: Extraction candidate classifier detects competing prices with high individual candidate scores.
* **Handling Strategy**: `ConfidenceCalibrator` penalizes consistency score ($0.50$), assigns `ConfidenceStatus.CONTRADICTORY`, and `FieldExplainer` generates candidate comparison arrays detailing all evaluated candidates without silently discarding evidence.

### Uncertainty Mode 3: Format Ambiguity in Extracted Dates
* **Description**: Numeric dates such as `08/06/2026` where both day and month are $\le 12$.
* **Impact**: Day and month ordering is ambiguous.
* **Handling Strategy**: `ValueNormalizer` returns `normalization_status: AMBIGUOUS` with candidate ISO dates (`2026-06-08` and `2026-08-06`). `ConfidenceCalibrator` assigns `ConfidenceStatus.AMBIGUOUS` and documents alternative interpretations.

### Uncertainty Mode 4: Out-of-Bounds Bounding Box Coordinates
* **Description**: Bounding box coordinates emitted by OCR detector slightly exceeding image pixel dimensions ($x_2 > W$ or $y_2 > H$).
* **Impact**: OpenCV/PIL crop functions raise out-of-bounds slicing errors.
* **Handling Strategy**: `EvidenceLinker` clamps bounding box coordinates to valid image bounds (`max(0, min(x1, width - 1))`), preventing cropping crashes.

### Uncertainty Mode 5: Absence of Labeled Field Calibration Data
* **Description**: Existing datasets (SROIE, Product Description OCR, Open Food Facts India) lack field-level ground truth annotations across the 9 Legal Metrology mandatory fields.
* **Impact**: Empirical Expected Calibration Error (ECE) and Platt scaling reliability curves cannot be computed.
* **Handling Strategy**: `ConfidenceCalibrator` distinguishes raw composite score from calibrated probability. Sets `calibrated_probability: null` and `calibration_status: CALIBRATION_UNAVAILABLE`. **Zero metric fabrication.**

---

## 3. Confidence & Audit Matrix

| Uncertainty Mode | Underlying Cause | Confidence Status Assigned | Audit Trail Evidence Emitted |
| :--- | :--- | :--- | :--- |
| **High Quality Single Extraction** | Clear text, single candidate, valid unit | `CONFIDENT` | Full visual crop + SHA-256 hash + high composite score |
| **Multiple Price Declarations** | MRP vs Offer Price | `CONTRADICTORY` | Candidate comparison array + source region bboxes |
| **Ambiguous Date Order** | `05/06/2026` numeric format | `AMBIGUOUS` | Alternate ISO dates list + raw string crop |
| **Blurry/Low Contrast Crop** | Poor package lighting/focus | `LOW_QUALITY_EVIDENCE` | Image quality penalty breakdown + crop image |
| **Low Candidate Score** | Weak keyword/regex match | `REVIEW_REQUIRED` | Raw candidate score + detailed explanation reasons |
| **Missing Declaration** | Field absent in OCR output | `UNAVAILABLE` | Explicit `NOT_FOUND` state + zero confidence score |

---

## 4. Conclusion

Phase 5 transparently captures and handles all uncertainty modes without fabricating false calibration curves or hiding competing candidate evidence. Full cryptographic SHA-256 provenance is preserved for downstream audit compliance engines.
