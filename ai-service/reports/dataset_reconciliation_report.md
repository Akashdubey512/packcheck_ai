# Dataset Count Reconciliation Audit Report

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026)  
**Date**: September 8, 2026  
**Status**: RECONCILED  

---

## 1. Executive Summary & Canonical Count Statement

During initial project reporting, early draft markdown summaries listed total image samples as **1,603** (recording 114 images for Open Food Facts India). However, physical file audits and split manifest verification confirm:

> [!IMPORTANT]
> **Canonical Dataset Count**: The official, deterministic total image count across the audited dataset splits is **1,606 images**.

### Canonical Split Breakdown
- **Train Split**: 1,324 samples (82.44%)
- **Validation Split**: 164 samples (10.21%)
- **Test Split**: 118 samples (7.35%)
- **Total Processed Samples**: **1,606 samples (100.0%)**

---

## 2. Root Cause Analysis of Previous Reporting Discrepancy

An empirical audit of raw files and split manifests (`processed_data/train/manifest.json`, `val/manifest.json`, `test/manifest.json`) revealed the exact origin of the 3-image discrepancy:

| Dataset Name | Draft Report Count | Physical Audit Count | Variance | Root Cause Explanation |
| :--- | :---: | :---: | :---: | :--- |
| **Indian Scene Text** | 17 | 17 | 0 | Exact match |
| **Open Food Facts (India)** | 114 | **117** | **+3** | 3 additional valid images downloaded during API fetch were indexed in split manifest but left unupdated in text draft table. |
| **SROIE Receipt Dataset** | 1083 | 1083 | 0 | Exact match |
| **Label Extraction ViT** | 9 | 9 | 0 | Exact match |
| **Product Description OCR** | 380 | 380 | 0 | Exact match (Includes 1 intentional MD5 duplicate sample) |
| **TOTAL** | **1603** | **1606** | **+3** | Canonical total confirmed as 1,606 |

---

## 3. Data Integrity Commitments

1. **No Raw Data Alteration**: `raw_data/` directory files remain untouched.
2. **No Split Manifest Regeneration**: Existing split manifests (`processed_data/split_manifest.json`) and membership assignments remain preserved without data leakage.
3. **No Metric Fabrication**: All reports have been updated to reflect the canonical count of **1,606 samples**.
