# Phase 2 Initial State Assessment

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: 2026-09-07  
**Project Root**: `d:\sih_2026\`  
**Environment**: `d:\sih_2026\sih` (Python 3.13)  

---

## 1. Current Architecture & Phase 1 Preserved State

The workspace contains the completed Phase 1 dataset foundation. Phase 1 assets are preserved and immutable:

- **Raw Datasets Directory**: `d:\sih_2026\raw_data\` (contains original datasets: Legal Metrology Rules, Open Food Facts India, SROIE, Product Desc OCR, Indian Scene Text, CORD-v2, Label Extraction ViT).
- **Processed Datasets Directory**: `d:\sih_2026\processed_data\` (contains zero-leakage group splits: Train = 1,324 samples, Val = 164 samples, Test = 118 samples).
- **Dataset Manifests**:
  - `raw_data/dataset_version.json` (Version `v1.0.0`)
  - `processed_data/split_manifest.json` (Stratified zero-leakage split configuration)
  - `processed_data/annotation_version.json` (Version `v1.0.0`)
- **Reports & Audits**:
  - `reports/data_quality_report.json`
  - `reports/dataset_statistics.json`
  - `reports/dataset_report.md`
- **Known Dataset Anomalies**: 
  - Exactly 1 MD5 duplicate image detected in Product Description OCR dataset, which is preserved without modification.
  - Corrupted images = 0.

---

## 2. Existing Scripts & Data Flow

- `scripts/fetch_datasets.py`: Dataset acquisition & directory initialization.
- `scripts/audit_datasets.py`: File integrity, format checking, resolution stats, MD5 & perceptual hash duplicate detection.
- `scripts/prepare_splits.py`: Group-stratified zero-leakage dataset partitioning.
- `scripts/generate_report.py`: Consolidated statistics & markdown report generation.

---

## 3. Reusable Components

- **Image Hash & MD5 Audit Utilities** in `scripts/audit_datasets.py` (`compute_md5`, `compute_dhash`, `inspect_image_file`).
- **Directory Path Constants & Manifest Schemas** in `scripts/fetch_datasets.py` and `scripts/prepare_splits.py`.

---

## 4. Missing Phase 2 Components (To Be Built)

The following components are required to construct the Phase 2 Image Quality Assessment, Preprocessing & ML Pipeline Foundation:

1. **Configuration**:
   - `configs/preprocessing.yaml`: Configurable thresholds for image validation, quality metrics, orientation, deskewing, and pipeline variants.
2. **ML Preprocessing Package (`ml/preprocessing/`)**:
   - `ml/preprocessing/__init__.py`: Package initialization & API exports.
   - `ml/preprocessing/image_validator.py`: Image validation with explicit error codes (`IMAGE_NOT_FOUND`, `IMAGE_UNREADABLE`, `INVALID_IMAGE_FORMAT`, `IMAGE_TOO_SMALL`, `IMAGE_TOO_LARGE`, `UNSUPPORTED_CHANNELS`).
   - `ml/preprocessing/quality.py`: Image quality metrics (resolution, Laplacian blur variance, brightness, contrast, noise estimate, exposure, sharpness).
   - `ml/preprocessing/orientation.py`: EXIF orientation detection and 0°/90°/180°/270° rotation.
   - `ml/preprocessing/deskew.py`: Conservative line/Hough-based deskewing.
   - `ml/preprocessing/perspective.py`: Modular perspective distortion handler with fallback when boundary is not reliably detected.
   - `ml/preprocessing/pipeline.py`: Adaptive preprocessing pipeline emitting multiple OCR-ready variants (`original`, `ocr_primary`, `ocr_secondary`) and returning structured JSON metadata.
   - `ml/preprocessing/augmentation.py`: Training-only data augmentations (rotations, brightness, contrast, noise, JPEG compression, mild blur).
3. **Contracts & Interfaces**:
   - `ML_CONTRACT.md`: Standardized JSON contract defining the preprocessing → OCR interface.
4. **Scripts & Benchmarks**:
   - `scripts/evaluate_preprocessing.py`: Multi-pipeline comparison framework.
   - `scripts/benchmark_preprocessing.py`: Performance benchmark (latency, throughput, memory) on real dataset splits.
   - `reports/phase2_performance.md`: Benchmark performance report.
   - `reports/phase2_report.md`: Comprehensive Phase 2 markdown deliverable.
5. **Unit Test Suite (`tests/`)**:
   - `tests/test_image_validator.py`
   - `tests/test_image_quality.py`
   - `tests/test_orientation.py`
   - `tests/test_deskew.py`
   - `tests/test_perspective.py`
   - `tests/test_preprocessing.py`
   - `tests/test_augmentation.py`
