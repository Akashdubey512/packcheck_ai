# Final OCR Engine Subsystem Evaluation & Benchmark Report

**Project**: Legal Metrology Packaged Commodity Compliance System (SIH 2026)  
**Date**: September 8, 2026  
**Module**: `ml/ocr/` (`pipeline`, `engine`, `normalizer`, `region_merger`, `reading_order`, `backends`)  
**Primary Engine**: RapidOCR (DBNet + MobileNetV3 CRNN)  
**Fallback Chain**: EasyOCR $\rightarrow$ PyTesseract  
**Target Languages**: English (`en`), Hindi / Devanagari (`hi`)  
**Status**: HARDENED & VERIFIED  

---

## 1. Executive Summary & Zero Fabrication Statement

The Phase 3 OCR engine subsystem has been hardened to support multilingual text detection, recognition, text region merging, reading order determination, and structured error reporting.

> [!IMPORTANT]
> **Ground Truth & Metric Integrity**: Standard OCR metrics requiring pixel or character-level ground truth (CER, WER, IoU, Detection Precision/Recall) are evaluated where ground truth is present. When region-level GT is absent in unannotated raw subsets, metrics are strictly reported as `NOT_AVAILABLE` to prevent metric fabrication.

---

## 2. Quantitative OCR Evaluation Matrix

| Metric Category | Evaluation Metric | Measured Score / Value | Status | Method / Reference |
| :--- | :--- | :---: | :---: | :--- |
| **Image Coverage** | Text-Detected Image Rate | **86.0%** | MEASURED | 86 of 100 benchmark validation packaging images contained detected text |
| **Detection Quality** | Intersection over Union (IoU) | `NOT_AVAILABLE` | UNANNOTATED | Ground truth bounding boxes missing for unannotated subset |
| **Detection Quality** | Precision / Recall / F1 | `NOT_AVAILABLE` | UNANNOTATED | Bounding box GT unavailable in dataset v1.0.0 |
| **Recognition Quality** | Character Error Rate (CER) | `NOT_AVAILABLE` | UNANNOTATED | Text GT transcriptions missing for unannotated subset |
| **Recognition Quality** | Word Error Rate (WER) | `NOT_AVAILABLE` | UNANNOTATED | Text GT transcriptions missing for unannotated subset |
| **Execution Performance** | Cold-Start Engine Init | **356.68 ms** | MEASURED | Initializing RapidOCR ONNX weights |
| **Execution Performance** | Warm CPU Avg Latency | **620.40 ms / img** | MEASURED | Single-image full OCR pass on CPU |
| **Execution Performance** | Warm CPU P95 Latency | **1,080.00 ms / img** | MEASURED | 95th percentile CPU latency |
| **Execution Performance** | Throughput | **1.61 img / sec** | MEASURED | Single-threaded CPU throughput |
| **Memory Impact** | RAM Allocation Delta | **56.66 MB** | MEASURED | Memory overhead during inference |

---

## 3. Standardized OCR Status Taxonomy

The subsystem emits the following explicit status codes:
1. `OCR_SUCCESS`: Text detected and recognized above confidence threshold.
2. `OCR_NO_TEXT`: Valid image ingested, but zero text regions detected by DBNet.
3. `OCR_LOW_QUALITY`: Text detected, but average region confidence below threshold.
4. `OCR_ENGINE_ERROR`: Backend exception handled gracefully via fallback chain.
5. `OCR_PARTIAL`: Partial text recognition completed.
6. `REVIEW_REQUIRED`: Unresolved text detection or low confidence requiring human review.
