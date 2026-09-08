# Master Gap Analysis & Architectural Hardening Strategy

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  
**Date**: September 8, 2026  
**Auditor**: Senior System Architect & ML/CV/OCR/Legal-Tech Engineer  
**Status**: AUDITED & STRATEGY FOR HARDENING DEFINED  

---

## 1. Executive Overview

This document presents a comprehensive audit of the existing codebase (`d:\sih_2026\`) across Phase 1 through Phase 6 and outlines the exact implementation plan to bring the project from a **working prototype** to a **production-oriented, scientifically evaluated, auditable, multi-view packaged-commodity compliance system**.

Strict adherence to non-negotiable principles:
1. **Zero Metric Fabrication**: Unmeasured metrics return `NOT_AVAILABLE`.
2. **Explicit Uncertainty Handling**: OCR errors, low quality, missing crops, or unknown applicability lead to `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE`, **never** `NON_COMPLIANT`.
3. **Architectural Separation**: ML/CV/OCR extracts evidence; a deterministic versioned rule engine evaluates legal compliance; human auditors resolve ambiguity with full audit logging.
4. **No Illegal Inferences**: Country of Origin is **never** inferred from brand name, address, language, or website.

---

## 2. Comprehensive Phase-by-Phase & Domain Status Audit (A–T)

### A. Phase 1 Status (Dataset & Data Pipeline)
- **Current State**: 1,606 canonical image samples reconciled across `processed_data/train/` (1,324), `val/` (164), `test/` (118). Manifests preserved.
- **Identified Gaps**: Missing formal `DATASET_CARD.md`, product-level group leakage verification tool, and multi-view sample structure.
- **Severity**: MEDIUM

### B. Phase 2 Status (Image Quality & Preprocessing)
- **Current State**: Structural validation, quality metrics (blur, luminance, contrast, noise, sharpness), EXIF orientation, deskew, and CLAHE variants implemented in `ml/preprocessing/`.
- **Identified Gaps**: Adaptive processing threshold classification (`GOOD`, `ACCEPTABLE`, `POOR`, `UNUSABLE`), explicit fallback to original image when enhancement degrades quality, and regression tests.
- **Severity**: MEDIUM

### C. Phase 3 Status (Text Detection & OCR Subsystem)
- **Current State**: `RapidOCR` primary backend with `EasyOCR` and `PyTesseract` fallbacks, supporting English (`en`) and Hindi/Devanagari (`hi`). Regional bounding boxes and normalized text returned.
- **Identified Gaps**: Standardized OCR error codes (`OCR_NO_TEXT`, `OCR_LOW_QUALITY`, `OCR_ENGINE_ERROR`, `OCR_PARTIAL`, `OCR_SUCCESS`), explicit distinction between raw engine confidence and calibrated probability.
- **Severity**: MEDIUM

### D. Phase 4 Status (Mandatory Field Candidate Extraction)
- **Current State**: Extracting all 9 mandatory fields (`mrp`, `net_quantity`, `manufacturing_packing_date`, `best_before_expiry`, `country_of_origin`, `consumer_care_details`, `manufacturer_name_and_address`, `common_generic_name`, `unit_sale_price`) with candidate ranking and normalization.
- **Identified Gaps**: Candidate status taxonomy needs explicit enforcement (`EXTRACTED`, `NOT_FOUND`, `AMBIGUOUS`, `INVALID_FORMAT`, `INVALID_VALUE`, `MULTIPLE_CANDIDATES`, `LOW_CONFIDENCE`, `NOT_APPLICABLE`, `REVIEW_REQUIRED`). Candidate lists must preserve all rejected candidates for auditability.
- **Severity**: HIGH

### E. Phase 5 Status (Confidence Calibration, Evidence & Provenance)
- **Current State**: Composite confidence scoring, crop image generation into `processed_data/evidence_crops/`, SHA-256 sample provenance tracking.
- **Identified Gaps**: Explicit distinction between `crop_generation_success` and `semantic_evidence_correctness`; formal `calibration_report.md` recording `CALIBRATION_UNAVAILABLE` when GT is missing.
- **Severity**: MEDIUM

### F. Phase 6 Status (Legal Compliance Rule Engine)
- **Current State**: Rule schema, rule loader, rule registry version `2022.1`, applicability evaluator, field validators, consistency engine, decision engine, and audit provenance in `ml/compliance/`.
- **Identified Gaps**: Effective-date based historical rule selection, comprehensive legal source cross-verification against official Govt of India Gazette notifications, font-height vs package area legal matrix documentation.
- **Severity**: HIGH

### G. Missing Functionality (Architecture Gaps)
- **Current State**: System operates on single image inputs; lacks multi-view fusion, web auditor UI, regulatory PDF report exporter, and production API server.
- **Identified Gaps**:
  1. Multi-view inspection engine (`ml/inspection/`): `session.py`, `view_classifier.py`, `view_registry.py`, `product_aggregator.py`, `cross_view_fusion.py`, `inspection_pipeline.py`.
  2. Interactive Web Auditor Dashboard (FastAPI + HTML/JS/CSS): Single/multi-image upload, interactive region bounding box overlay, candidate review/override, audit logging.
  3. Regulatory PDF Exporter (`reporting/pdf_exporter.py`): Official "Legal Metrology Compliance Inspection Report" generator.
  4. Production REST API (`app/main.py`): `/health`, `/ready`, `/api/v1/inspect`, `/api/v1/review`, `/api/v1/report`.
- **Severity**: CRITICAL

### H. Incorrect Assumptions
- **Current State**: Risk of single-image missing fields being flagged as legal non-compliance.
- **Identified Gaps**: Explicit guardrail: Missing declaration on 1 face of package **must** evaluate to `INSUFFICIENT_EVIDENCE` or `REVIEW_REQUIRED` if other package faces have not been inspected.
- **Severity**: CRITICAL

### I. Scientific Evaluation Gaps
- **Current State**: Full system benchmarks report execution times, but accuracy metrics return `NOT_AVAILABLE` due to lack of ground-truth labels in dataset v1.0.0.
- **Identified Gaps**: Need a dedicated Ground Truth Dataset architecture (`data/ground_truth/` or `processed_data/ground_truth/`) with annotation schema, validator, guidelines, and an evaluation framework (`scripts/evaluate_full_system.py`) that cleanly handles `NOT_AVAILABLE` without metric fabrication.
- **Severity**: HIGH

### J. Legal-Rule Gaps
- **Current State**: 9 rules implemented based on standard 2011/2022 rules.
- **Identified Gaps**: Build a formal Rule Coverage Matrix categorizing text OCR validation, visual layout validation, physical measurement validation, category context, and unsupported automation (`reports/legal_source_verification.md`, `LEGAL_RULES.md`).
- **Severity**: HIGH

### K. Dataset Gaps
- **Current State**: 1,606 image dataset reconciled; raw data untouched.
- **Identified Gaps**: Create `reports/dataset_integrity_final.md` and `DATASET_CARD.md`.
- **Severity**: MEDIUM

### L. Multi-View Gaps
- **Current State**: No multi-view aggregation or contradiction engine across multiple package faces.
- **Identified Gaps**: Implement `ml/inspection/` module to handle Front, Back, Left, Right, Top, Bottom package face aggregation and contradiction detection (e.g. MRP 120 on front vs 150 on back).
- **Severity**: CRITICAL

### M. UI Gaps
- **Current State**: CLI and script interfaces only.
- **Identified Gaps**: Develop an Auditor Web UI featuring image side-by-side view, detected region overlays, candidate dropdowns, rule status, and human review override tracking.
- **Severity**: CRITICAL

### N. Security Gaps
- **Current State**: Basic file path validation in `image_validator.py`.
- **Identified Gaps**: Add explicit file upload security: max image dimensions (8000x8000), max file size (20MB), MIME check, decompression bomb protection, path traversal sanitizer, temporary file cleanup. Create `SECURITY.md`.
- **Severity**: HIGH

### O. Deployment Gaps
- **Current State**: Python scripts run locally.
- **Identified Gaps**: Create `Dockerfile`, `docker-compose.yml`, `/health` & `/ready` endpoints, deployment guide in `DEPLOYMENT.md`.
- **Severity**: HIGH

### P. MLOps Gaps
- **Current State**: Basic manifest JSONs.
- **Identified Gaps**: Implement formal `MODEL_CARD.md`, `DATASET_CARD.md`, `reports/reproducibility_report.md`, and structured logging with correlation IDs.
- **Severity**: MEDIUM

### Q. Documentation Gaps
- **Current State**: `ML_CONTRACT.md` and phase reports exist.
- **Identified Gaps**: Comprehensive suite: `README.md`, `walkthrough.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`, `DATASET_CARD.md`, `MODEL_CARD.md`, `LEGAL_RULES.md`, `ANNOTATION_GUIDELINES.md`, `API.md`, `SECURITY.md`, `LIMITATIONS.md`.
- **Severity**: HIGH

### R. Testing Gaps
- **Current State**: 86 unit tests passing for P2–P6 single image processing.
- **Identified Gaps**: Add test suites for multi-view inspection, GT annotation validation, security file uploads, PDF generation, API endpoints, error taxonomy, and golden synthetic rule fixtures.
- **Severity**: HIGH

### S. Performance Gaps
- **Current State**: Average P2-P6 latency ~630 ms on CPU.
- **Identified Gaps**: Comprehensive benchmarking of multi-view pipeline, PDF export latency, and memory footprint.
- **Severity**: MEDIUM

### T. Production Risks
- **Current State**: Prototype operation without production safeguards.
- **Identified Gaps**: Document production risk mitigation, rate limiting, resource caps, model drift monitoring design, and legal disclaimers.
- **Severity**: HIGH

---

## 3. Master Gap & Implementation Summary Table

| Gap ID | Component / Area | Current State | Expected State | Severity | Proposed Fix | Status |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: |
| **GAP-01** | Multi-View Inspection | Single-image pipeline | Multi-view session, view classification, candidate fusion, contradiction engine | **CRITICAL** | Build `ml/inspection/` package | PLANNED |
| **GAP-02** | Auditor Web UI | CLI/Script execution | Web dashboard with region overlay & human audit workflow | **CRITICAL** | Build FastAPI server & web UI in `app/` | PLANNED |
| **GAP-03** | Regulatory PDF Exporter | No export capability | Generated official compliance PDF report | **HIGH** | Build `reporting/pdf_exporter.py` | PLANNED |
| **GAP-04** | Ground Truth Dataset | No GT annotation schema | GT schema, annotation validator, evaluation scripts | **HIGH** | Build `data/ground_truth/` & evaluation | PLANNED |
| **GAP-05** | Legal Rule Verification | 9 rules without source matrix | Verified rules, source URLs, font height matrix | **HIGH** | Create `reports/legal_source_verification.md` & `LEGAL_RULES.md` | PLANNED |
| **GAP-06** | Preprocessing Hardening | Basic quality checks | Quality categories (`GOOD`, `POOR`, etc.), safe fallback | **MEDIUM** | Hardened `ml/preprocessing/quality.py` & tests | PLANNED |
| **GAP-07** | OCR Error Taxonomy | Generic exceptions | Explicit OCR error codes (`OCR_NO_TEXT`, etc.) | **MEDIUM** | Update `ml/ocr/types.py` & `engine.py` | PLANNED |
| **GAP-08** | Candidate Extraction | Candidate ranking active | Full candidate list preservation & status semantics | **HIGH** | Update `ml/extraction/types.py` & `candidates.py` | PLANNED |
| **GAP-09** | Confidence & Evidence | Raw composite score | `CALIBRATION_UNAVAILABLE` report, crop vs semantic check | **MEDIUM** | Create `reports/calibration_report.md` | PLANNED |
| **GAP-10** | Security & Privacy | Path validation | Safe upload handling, max size limits, path sanitization | **HIGH** | Build `ml/security/` & `SECURITY.md` | PLANNED |
| **GAP-11** | API Server & Endpoints | No REST server | FastAPI app with `/health`, `/ready`, `/inspect` | **HIGH** | Build `app/main.py` & `API.md` | PLANNED |
| **GAP-12** | Deployment & MLOps | Local execution only | `Dockerfile`, `docker-compose`, Model Card, Dataset Card | **HIGH** | Create Docker & MLOps artifacts | PLANNED |
| **GAP-13** | Documentation Suite | Partial reports | Complete 10+ architectural markdown docs | **HIGH** | Author full doc suite | PLANNED |
| **GAP-14** | Test Suite Expansion | 86 single-view tests | Expanded tests covering multi-view, security, PDF, API | **HIGH** | Expand test suite in `tests/` | PLANNED |
