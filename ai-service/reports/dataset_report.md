# Phase 1: Dataset Collection, Audit, and Preparation Report

**Project**: Legal Metrology (Packaged Commodities) Automated Compliance Auditor  
**Dataset Version**: `v1.0.0` | **Annotation Version**: `v1.0.0`  
**Generated At**: 2026-09-07 23:09:28  

---

## 1. Executive Summary

Phase 1 establishes a clean, audited, version-controlled dataset pipeline for Legal Metrology mandatory packaging compliance verification, OCR benchmarking, and key field extraction.

All original datasets remain unchanged under `raw_data/`, and all processed, leakage-free splits are created separately in `processed_data/`.

### Key Metrics Summary
- **Total Datasets Collected & Audited**: 7
- **Total Raw Files**: 2012
- **Total Image Samples**: 1603
- **Valid & Readable Images**: 1603
- **Corrupted / Invalid Files Detected**: 0
- **Exact Duplicate Images (MD5)**: 1
- **Data Leakage Check**: Passed (100% Zero-Leakage Enforced across splits)

---

## 2. Dataset Collection & Audit Breakdown

| Dataset Name | Total Files | Image Count | Annotation Files | Valid Images | Corrupted Images | MD5 Duplicates |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Legal Metrology Rules** | 1 | 0 | 1 | 0 | 0 | 0 |
| **Open Food Facts (India)** | 115 | 114 | 1 | 114 | 0 | 0 |
| **SROIE Receipt Dataset** | 1086 | 1083 | 3 | 1083 | 0 | 0 |
| **Product Description OCR** | 760 | 380 | 380 | 380 | 0 | 1 |
| **Indian Scene Text** | 36 | 17 | 10 | 17 | 0 | 0 |
| **CORD-v2 Layout Dataset** | 2 | 0 | 2 | 0 | 0 | 0 |
| **Label Extraction ViT** | 12 | 9 | 0 | 9 | 0 | 0 |


---

## 3. Dataset Specifications & Structure

### 3.1 Legal Metrology (Packaged Commodities) Rules, 2011 & Amendments
- **Source**: Department of Consumer Affairs, Government of India
- **Mandatory Declarations Rules Specified**:
  1. Manufacturer / Packer / Importer Name & Address (Rule 6(1)(a))
  2. Country of Origin (Rule 6(1)(b))
  3. Common / Generic Name of Commodity (Rule 6(1)(c))
  4. Net Quantity & Standard Unit (Rule 6(1)(d))
  5. Month & Year of Mfg / Packing (Rule 6(1)(e))
  6. Best Before / Expiry Date (Rule 6(1)(f))
  7. Maximum Retail Price (MRP incl. of all taxes) (Rule 6(1)(g))
  8. Consumer Care Contact Details (Rule 6(1)(h))
  9. Unit Sale Price (Rule 6(11) - 2022 Amendment)

### 3.2 Open Food Facts (India Filtered)
- **Source**: Open Food Facts API (India Tagged)
- **Metadata Fields**: Barcode, Product Name, Brand, Net Weight, Quantity, Category, Ingredients, Image URLs
- **Packaging Images**: Filtered & stored in `raw_data/open_food_facts_india/images/`

### 3.3 SROIE Receipt OCR Benchmark
- **Format**: Bounding Boxes (QUAD / AABB) & Ground Truth Transcripts (`train_gt.txt`, `test_gt.txt`)
- **Key Fields**: Merchant Name, Date, Total Amount, Tax

### 3.4 Product Description English & Hindi OCR
- **Source**: Real-world product packaging images in English & Hindi
- **Format**: Image files + OCR transcript annotations

### 3.5 Indian Scene Text Dataset
- **Source**: AI4Bharat / IIT Madras
- **Languages**: Tamil, Hindi, Telugu, Malayalam, Punjabi, English
- **Formats**: Bounding Box (AABB & QUAD) and Word Recognition crops

### 3.6 CORD-v2 Document Layout Dataset
- **Source**: NAVER CLOVA CORD-v2
- **Splits**: Validation and Test sets for key-value field extraction

---

## 4. Train / Validation / Test Split Manifest

To prevent **Data Leakage**, images belonging to the same product group, receipt ID, or brand sequence were strictly assigned to a single split.

- **Train Split (80%)**: 1324 images
- **Validation Split (10%)**: 164 images
- **Test Split (10%)**: 118 images
- **Leakage Prevention Verification**: `PASSED` (Zero product ID overlap between train, val, and test)

---

## 5. Output Artifacts Directory Structure

```
d:/sih_2026/
├── sih/                       # Python Virtual Environment
├── raw_data/                  # Unchanged Original Datasets
│   ├── legal_metrology/
│   ├── open_food_facts_india/
│   ├── sroie/
│   ├── product_desc_ocr/
│   ├── indian_scene_text/
│   ├── cord_v2/
│   └── label_extraction_vit/
├── processed_data/            # Cleaned, Split & Versioned Datasets
│   ├── train/
│   ├── val/
│   ├── test/
│   ├── split_manifest.json
│   └── annotation_version.json
├── scripts/                   # Automated Pipeline Scripts
│   ├── fetch_datasets.py
│   ├── audit_datasets.py
│   ├── prepare_splits.py
│   └── generate_report.py
└── reports/                   # Data Quality & Statistics Deliverables
    ├── data_quality_report.json
    ├── dataset_statistics.json
    └── dataset_report.md
```
