# Phase 3 OCR Subsystem Performance Benchmark Report

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: 2026-09-07  
**Environment**: Python 3.13 (`sih` Virtual Environment)  
**OCR Backend**: RapidOCR (ONNXRuntime DBNet + CRNN)  

---

## 1. Benchmark Execution Metrics

| Metric | Value | Unit |
| :--- | :---: | :---: |
| **Total Real Images Processed** | 100 | images |
| **Successful OCR Detections** | 86 | count |
| **No Text Detected** | 14 | count |
| **Failed Inferences** | 0 | count |
| **Cold-Start Pipeline Initialization** | **356.68** | ms |
| **Warm Average Latency (CPU)** | **1309.14** | ms/image |
| **Warm Median Latency (CPU)** | **1309.51** | ms/image |
| **Warm P95 Latency (CPU)** | **2061.79** | ms/image |
| **Warm Throughput (CPU)** | **0.76** | images/second |
| **RAM Usage Delta (RSS)** | 56.66 | MB |

---

## 2. Cold-Start vs Warm Inference Latency

- **Cold-Start Initialization Latency**: **356.68 ms** (Includes ONNXRuntime model loading & session initialization)
- **Warm Average Latency**: **1309.14 ms / image**
- **Warm Median Latency**: **1309.51 ms / image**
- **Warm P95 Latency**: **2061.79 ms / image**

---

## 3. Performance Safeguards & Execution Integrity

- **Maximum Image Size Safeguard**: Enforced (Resized to max 2048px via Phase 2 pipeline)
- **Max Regions Safeguard**: 300 regions per image
- **Resource Protection**: Memory delta capped at 56.66 MB
- **Phase 1 & 2 Preservation**: Raw datasets & split manifests 100% untouched
