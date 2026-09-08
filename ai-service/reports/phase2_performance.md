# Phase 2 Preprocessing Performance Benchmark Report

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: 2026-09-07 23:29:39  
**Environment**: Python 3.13 (`sih` Virtual Environment)  

---

## 1. Executive Summary

This report documents the empirical latency, throughput, and memory consumption of the Phase 2 Preprocessing Pipeline (`ml/preprocessing/pipeline.py`) evaluated on representative real dataset image samples.

---

## 2. Empirical Benchmark Metrics

| Metric | Value | Unit |
| :--- | :---: | :---: |
| **Total Images Audited** | 100 | images |
| **Successful Validation Rate** | 100.0% | percent |
| **Failed / Corrupt Images** | 0 | count |
| **Average Latency** | **12.92** | ms/image |
| **Median Latency** | **12.09** | ms/image |
| **P95 Latency** | **20.11** | ms/image |
| **Throughput** | **74.99** | images/second |
| **Memory Delta (RSS)** | 10.81 | MB |

---

## 3. Latency Distribution Breakdown

- **Min Latency**: 1.98 ms
- **Max Latency**: 42.39 ms
- **Median Latency**: 12.09 ms
- **P95 Latency**: 20.11 ms

---

## 4. Execution Integrity & Non-Destructive Guarantee

- **Original Datasets**: Unmodified in `raw_data/`
- **Split Assignments**: Preserved (Train: 1324, Val: 164, Test: 118)
- **Zero File Leakage**: Confirmed
