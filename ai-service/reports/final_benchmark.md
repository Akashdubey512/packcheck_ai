# Final System Evaluation & Benchmark Report

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026 PS ID 26034)  
**Date**: 2026-09-09 00:23:35  
**Overall Test Status**: **100 / 100 PASSED (100% PASS RATE)**  

---

## 1. Pipeline Execution Latency Breakdown

| Pipeline Stage | Latency (ms) | Throughput (img/sec) | Subsystem Package |
| :--- | :---: | :---: | :--- |
| **Phase 2 Preprocessing** | 43.03 ms | 23.24 | `ml/preprocessing/` |
| **Phase 3 Text Detection & OCR** | 2998.86 ms | 0.33 | `ml/ocr/` |
| **Phase 4 Field Candidate Extraction** | 8.28 ms | 120.77 | `ml/extraction/` |
| **Phase 5 Confidence & Evidence** | 21.38 ms | 46.77 | `ml/confidence/` |
| **Phase 6 Legal Compliance Engine** | 4.19 ms | 238.66 | `ml/compliance/` |
| **Single-View Pipeline Total** | **3075.74 ms** | **0.33** | End-to-End |
| **Multi-View Inspection Total** | **2024.83 ms** | **0.49** | `ml/inspection/` |
| **Regulatory PDF Exporter** | **8.33 ms** | N/A | `reporting/pdf_exporter.py` |

---

## 2. Accuracy & Ground Truth Status

- **Structural Image Validation**: **100.0%**
- **OCR Text-Detected Image Rate**: **86.0%**
- **OCR CER / WER / IoU**: `NOT_AVAILABLE` (Zero metric fabrication enforced)
- **Field Extraction Precision / Recall / F1**: `NOT_AVAILABLE` (Ground truth unavailable in unannotated v1.0.0 subset)
- **Probability Calibration**: `CALIBRATION_UNAVAILABLE`
- **Legal Engine Determinism**: **100.0%**
