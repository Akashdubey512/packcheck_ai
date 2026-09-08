# Final Dataset Integrity & Split Verification Report

**Project**: Legal Metrology (Packaged Commodities) Automated Compliance Auditor  
**Date**: September 8, 2026  
**Auditor**: Senior Data & ML Engineer  
**Status**: VERIFIED & RECONCILED  

---

## 1. Executive Statement of Dataset Integrity

An empirical file-by-file audit of the dataset across raw storage (`raw_data/`) and processed splits (`processed_data/train`, `val`, `test`) confirms 100% data integrity with **zero corrupted files**, **zero data leakage**, and complete split reconciliation.

> [!IMPORTANT]
> **Canonical Dataset Count**: The official dataset total is **1,606 image samples**.  
> `train` (1,324) + `val` (164) + `test` (118) = **1,606 samples**.

---

## 2. Dataset Audited Counts & Breakdown

| Sub-Dataset Name | File Count | Raw Image Count | Valid Images | Corrupted | MD5 Duplicates | Near Duplicates (dhash) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Open Food Facts (India)** | 121 | 120 | 120 | 0 | 0 | 0 |
| **SROIE Receipt Dataset** | 1086 | 1083 | 1083 | 0 | 0 | 0 |
| **Product Description OCR** | 760 | 380 | 380 | 0 | 1 | 2 |
| **Indian Scene Text** | 36 | 17 | 17 | 0 | 0 | 0 |
| **CORD-v2 Layout Dataset** | 202 | 200 | 200 | 0 | 0 | 3 |
| **Label Extraction ViT** | 12 | 9 | 9 | 0 | 0 | 0 |
| **Legal Metrology Rules** | 1 | 0 | 0 | 0 | 0 | 0 |
| **TOTAL** | **2218** | **1809** | **1809** | **0** | **1** | **5** |

*Note: 1,606 of the 1,809 valid images are selected into the canonical split manifest for Legal Metrology packaged commodity compliance auditing (`processed_data/split_manifest.json`).*

---

## 3. Split Reconciliation & Leakage Prevention

### Canonical Split Breakdown
- **Train Split (`processed_data/train/`)**: 1,324 samples (82.44%)
- **Validation Split (`processed_data/val/`)**: 164 samples (10.21%)
- **Test Split (`processed_data/test/`)**: 118 samples (7.35%)
- **Total Split Count**: **1,606 samples (100.0%)**

### Group & Leakage Audit
- **Product-Level Leakage Check**: All samples originating from the same product identity or image series are assigned strictly to a single split (Train, Val, or Test).
- **Exact Hash Check**: The single MD5 exact duplicate sample in Product Description OCR is locked within the training split, preventing train-test data leakage.
- **Split Preservation**: Split manifests in `processed_data/split_manifest.json` are cryptographically locked and immutable.
