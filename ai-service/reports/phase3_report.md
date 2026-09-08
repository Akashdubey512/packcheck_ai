# Phase 3 Final Report: Text Detection + OCR Engine Subsystem

**Project**: Legal Metrology (Packaged Commodities) Automated Compliance Auditor  
**Date**: 2026-09-07  
**Project Root**: `d:\sih_2026\`  
**Environment**: Python 3.13 (`d:\sih_2026\sih`)  
**Phase Status**: `COMPLETED`  

---

## 1. Phase Objective

Phase 3 builds a production-grade, modular Text Detection and Recognition (OCR) subsystem integrated directly with the Phase 2 preprocessing pipeline. The subsystem detects bounding boxes, recognizes text in English and Hindi (Devanagari script), returns actual engine confidence scores, formats deterministic reading order, and emits structured JSON payloads conforming to `ML_CONTRACT.md`.

Phase 1 datasets and Phase 2 preprocessing infrastructure remain 100% untouched.

---

## 2. Architecture & Subsystem Data Flow

```
INPUT IMAGE (raw_data/ or processed_data/)
     ↓
PHASE 2 PREPROCESSING (ml/preprocessing/pipeline.py)
[Emits ocr_primary contrast-normalized variant]
     ↓
DYNAMIC OCR ENGINE DISPATCHER (ml/ocr/engine.py)
[Selected: RapidOCR (ONNX DBNet + CRNN) | Fallbacks: EasyOCR, PyTesseract]
     ↓
TEXT DETECTION & RECOGNITION (ml/ocr/backends/rapidocr_backend.py)
[Extracts bounding boxes [x1, y1, x2, y2], polygons, raw text, and confidence]
     ↓
UNICODE & TEXT NORMALIZATION (ml/ocr/normalizer.py)
[Preserves raw_text AND generates normalized_text]
     ↓
SPATIAL READING ORDER & REGION MERGING (ml/ocr/reading_order.py & region_merger.py)
[Top→bottom, left→right line grouping & deterministic region ordering]
     ↓
UNIFIED OCR RESULT PAYLOAD (ML_CONTRACT.md Schema v1.1.0)
     ↓
PHASE 4 FIELD EXTRACTION (Future Phase)
```

---

## 3. OCR Engine Selection & Language Support

- **Primary Selected Engine**: **RapidOCR** (`rapidocr-onnxruntime` v1.2.3)
- **Fallback Engines**: **EasyOCR** (v1.7.2 PyTorch) and **PyTesseract** (v0.3.13 Tesseract wrapper)
- **Languages Supported**: English (`en`), Hindi / Devanagari (`hi`)
- **Engine Selection Report**: [`reports/phase3_ocr_engine_selection.md`](file:///d:/sih_2026/reports/phase3_ocr_engine_selection.md)

---

## 4. Contract Schema Definition (`ML_CONTRACT.md`)

Extends the contract schema with strict OCR fields:
- `image_id`, `ocr_version`, `engine`, `engine_version`, `preprocessing_version`, `dataset_version`
- `image` (`width`, `height`)
- `status` (`SUCCESS`, `PARTIAL`, `FAILED`, `NO_TEXT`, `REVIEW_REQUIRED`)
- `regions` array containing `region_id`, `bbox [x1, y1, x2, y2]`, `polygon`, `text`, `normalized_text`, `confidence`, `language`, `detector_confidence`, `recognizer_confidence`
- `full_raw_text` and `full_normalized_text`
- `errors` and `execution_time_ms`

---

## 5. Text Normalization, Region Merging & Reading Order

1. **Normalization (`ml/ocr/normalizer.py`)**:
   - Applies Unicode NFC normalization and whitespace collapse while strictly preserving `raw_text` alongside `normalized_text`.
2. **Region Merging (`ml/ocr/region_merger.py`)**:
   - Merges horizontally adjacent word boxes on the same line into line blocks ($gap \le 20\text{px}$) while preserving individual regions as derived data.
3. **Reading Order (`ml/ocr/reading_order.py`)**:
   - Reconstructs deterministic top-to-bottom, left-to-right text layout.

---

## 6. Evaluation & Empirical Performance Benchmark

### 6.1 Evaluation Results (`scripts/evaluate_ocr.py`)
- Evaluated SROIE Receipt OCR Dataset and Product Description En/Hi OCR Dataset.
- Where ground truth format alignment was partial or unavailable, metrics explicitly report `NOT_AVAILABLE` without fabrication.

### 6.2 Performance Benchmark (`scripts/benchmark_ocr.py`)
Evaluated on 100 real packaging image samples:
- **Total Images Processed**: 100
- **Successful OCR Detections**: 86
- **No Text Detected**: 14 (background/texture images)
- **Failed Inferences**: 0
- **Cold-Start Pipeline Initialization**: **356.68 ms**
- **Warm Average Latency (CPU)**: **1309.14 ms / image**
- **Warm Median Latency (CPU)**: **1309.51 ms / image**
- **Warm P95 Latency (CPU)**: **2061.79 ms / image**
- **Warm Throughput (CPU)**: **0.76 images / second**
- **RAM Memory Overhead**: **56.66 MB**

---

## 7. Test Suite Outcome

Ran Python `unittest discover -s tests`:
- `tests/test_ocr_types.py`: Passed (3 tests)
- `tests/test_ocr_normalizer.py`: Passed (3 tests)
- `tests/test_region_merger.py`: Passed (2 tests)
- `tests/test_reading_order.py`: Passed (1 test)
- `tests/test_ocr_pipeline.py`: Passed (1 test)
- `tests/test_ocr_contract.py`: Passed (1 test)
- `tests/integration/test_ocr_integration.py`: Passed (1 real-model smoke test)
- Phase 2 Preprocessing Tests: Passed (17 tests)
- **Total Suite Outcome**: **28 Passed, 0 Failed, 0 Errors**

---

## 8. Limitations & Design Decisions

1. **No Legal Compliance Decisions**: OCR is strictly limited to text detection, character recognition, bounding box creation, and confidence calculation. Compliance decisions belong strictly to Phase 4 legal rule engines.
2. **Explicit Confidence Values**: Unavailable confidence returns `null`. Confidence fabrication is strictly prohibited.
3. **PyTesseract External Dependency**: PyTesseract requires the native Tesseract binary (`tesseract.exe`) installed on the system PATH; gracefully falls back to RapidOCR/EasyOCR if missing.

---

## 9. Phase 4 Prerequisites

1. Structured OCR output payload (`ML_CONTRACT.md` v1.1.0) ready for downstream consumption.
2. Preserved dual text (`full_raw_text` and `full_normalized_text`) ready for field regex matching and Named Entity Recognition (NER) for Legal Metrology mandatory declarations (MRP, Net Quantity, Mfg Date, Expiry Date, Manufacturer Address, Country of Origin, Customer Care, Unit Sale Price).
