# Phase 3 Initial State Assessment

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: 2026-09-07  
**Project Root**: `d:\sih_2026\`  
**Environment**: `d:\sih_2026\sih` (Python 3.13)  
**Phase Target**: Phase 3 – Text Detection + OCR Subsystem  

---

## 1. Current Repository Architecture & Preserved State

### Phase 1 Preserved Datasets & Splits (`v1.0.0`)
- **Raw Datasets (`raw_data/`)**: Immutable original collections for Legal Metrology Rules, Open Food Facts India, SROIE Receipt OCR, Product Description En/Hi OCR, Indian Scene Text, CORD-v2 Layout, and Label Extraction ViT.
- **Split Allocations (`processed_data/`)**: Zero-leakage group stratified splits preserved:
  - **Train**: 1,324 image samples
  - **Validation**: 164 image samples
  - **Test**: 118 image samples
- **Preserved Anomalies**: 1 MD5 duplicate in Product Description OCR dataset preserved without modification.

### Phase 2 Preprocessing & Quality Infrastructure
- Modular package under `ml/preprocessing/`:
  - `image_validator.py`: Structural header/MIME & dimension validation.
  - `quality.py`: Objective blur (Laplacian var), luminance brightness, RMS contrast, Sobel sharpness, noise, exposure metrics.
  - `orientation.py`: EXIF tag (274) orientation detection and rotation.
  - `deskew.py`: Hough transform text line deskewing (>0.5° threshold).
  - `perspective.py`: Modular 4-point homography transform interface (`NO_RELIABLE_BOUNDARY` when unintegrated).
  - `pipeline.py`: Adaptive processing producing `ocr_primary` and `ocr_secondary` variants.
  - `augmentation.py`: Training-only augmentations.
- **Phase 2 Benchmark Results**: 100% validation success on 100 real images; 12.92 ms avg latency; 74.99 imgs/sec throughput.
- **Unit Test Suite**: 17 tests passed out of 17.

---

## 2. Available Datasets & OCR Ground Truth Matrix

| Dataset Name | Total Files | Image Count | Ground Truth Format | OCR Benchmark Suitability |
| :--- | :---: | :---: | :---: | :--- |
| **SROIE Receipt OCR** | 1086 | 1083 | Line bounding boxes + transcript (`train_gt.txt`, `test_gt.txt`) | **High** (Word/Line Detection & Text Accuracy CER/WER) |
| **Product Description OCR** | 760 | 380 | XML annotation files + English & Hindi transcripts | **High** (Packaging OCR CER/WER in English & Hindi) |
| **Indian Scene Text** | 36 | 17 | CSV QUAD / AABB bbox + Multilingual transcripts | **High** (Multilingual Indian signboard/label text) |
| **CORD-v2 Layout** | 2 | 0 | JSON key-value ground truth parses | **Medium** (Layout parsing benchmark) |
| **Open Food Facts (India)** | 115 | 114 | Product metadata JSON (barcodes, brands, net weights) | **Medium** (Field extraction ground truth) |
| **Label Extraction ViT** | 12 | 9 | Extracted packaging image crops | **Low** (Qualitative packaging text testing) |

---

## 3. Existing Dependencies & Preprocessing Interface

- **Interface Contract**: Defined in `ML_CONTRACT.md` (emits `validation`, `quality`, `orientation`, `deskew`, `perspective`, and `variants` dictionary containing `ocr_primary` and `ocr_secondary`).
- **Dependencies**: OpenCV (`cv2`), Pillow (`PIL`), NumPy, Pandas, PyYAML, SciPy, ImageHash, Psutil.

---

## 4. Proposed Phase 3 Architecture

```
ORIGINAL IMAGE / RAW IMAGE PATH
             ↓
PHASE 2 PREPROCESSING PIPELINE (ml/preprocessing/pipeline.py)
[Returns: ocr_primary & ocr_secondary variants + quality metadata]
             ↓
OCR ENGINE ABSTRACTION (ml/ocr/base.py & ml/ocr/engine.py)
[Backend selector: RapidOCR / EasyOCR / PyTesseract / Custom]
             ↓
TEXT DETECTION & RECOGNITION (ml/ocr/backends/*)
[Detects text bounding boxes [x1, y1, x2, y2] & raw text transcripts + engine confidence]
             ↓
TEXT REGION MERGING & READING ORDER (ml/ocr/region_merger.py & reading_order.py)
[Deterministic top→bottom, left→right line grouping]
             ↓
UNICODE & TEXT NORMALIZATION (ml/ocr/normalizer.py)
[Preserves raw_text AND generates normalized_text]
             ↓
STRUCTURED OCR RESULT (ML_CONTRACT.md OCR Payload Schema)
             ↓
PHASE 4 FIELD EXTRACTION (Future Phase)
```

---

## 5. Scope & Strict Boundaries

1. **OCR Scope Only**: Phase 3 detects text regions, recognizes characters, computes confidence scores, formats bounding boxes, and reconstructs reading order.
2. **No Compliance Judgments**: Phase 3 NEVER determines compliance, MRP legality, or mandatory declaration absence. Compliance decisions belong strictly to Phase 4 legal rule engines.
3. **No Metric Fabrication**: If ground truth is unavailable or confidence is uncomputed by the engine, explicit `NOT_AVAILABLE` or `null` values are emitted.
