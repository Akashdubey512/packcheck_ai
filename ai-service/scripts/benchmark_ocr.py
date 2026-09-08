"""
OCR Performance Benchmark Script
Measures cold-start vs warm inference latency, throughput (images/sec), and memory consumption on real dataset samples.
Outputs reports/phase3_performance.md.
"""

import sys
import json
import time
import psutil
import numpy as np
import pandas as pd
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from ml.ocr.pipeline import FullOCRPipeline

PROCESSED_DIR = BASE_DIR / "processed_data"
REPORTS_DIR = BASE_DIR / "reports"

def run_ocr_performance_benchmark(sample_limit: int = 100):
    print("==================================================", flush=True)
    print("Phase 3: OCR Subsystem Performance Benchmarking", flush=True)
    print("==================================================", flush=True)

    # Gather real image paths from processed_data/train, val, test
    all_image_paths = []
    for split in ["train", "val", "test"]:
        split_dir = PROCESSED_DIR / split / "images"
        if split_dir.exists():
            imgs = list(split_dir.glob("*.jpg")) + list(split_dir.glob("*.png")) + list(split_dir.glob("*.jpeg"))
            all_image_paths.extend(imgs)

    benchmark_paths = all_image_paths[:sample_limit]
    if not benchmark_paths:
        print("Error: No real benchmark image paths found in processed_data/", flush=True)
        return

    print(f"Benchmarking on {len(benchmark_paths)} real image samples...", flush=True)

    process_info = psutil.Process()
    mem_before_mb = process_info.memory_info().rss / (1024 * 1024)

    # 1. Cold-Start Initialization Measurement
    cold_start_begin = time.perf_counter()
    pipeline = FullOCRPipeline(backend_name="rapidocr")
    cold_start_latency_ms = round((time.perf_counter() - cold_start_begin) * 1000, 2)
    print(f"  [OK] Cold-Start Pipeline Initialization: {cold_start_latency_ms} ms", flush=True)

    latencies_ms = []
    success_count = 0
    no_text_count = 0
    fail_count = 0

    start_bench_time = time.perf_counter()

    for img_path in benchmark_paths:
        try:
            res = pipeline.process(img_path)
            latencies_ms.append(res["execution_time_ms"])
            if res["status"] in ["SUCCESS", "PARTIAL"]:
                success_count += 1
            elif res["status"] == "NO_TEXT":
                no_text_count += 1
            else:
                fail_count += 1
        except Exception:
            fail_count += 1

    total_bench_duration = time.perf_counter() - start_bench_time
    mem_after_mb = process_info.memory_info().rss / (1024 * 1024)
    mem_used_mb = round(max(0.0, mem_after_mb - mem_before_mb), 2)

    total_processed = len(benchmark_paths)
    avg_latency = float(np.mean(latencies_ms)) if latencies_ms else 0.0
    median_latency = float(np.median(latencies_ms)) if latencies_ms else 0.0
    p95_latency = float(np.percentile(latencies_ms, 95)) if latencies_ms else 0.0
    throughput_fps = float(total_processed / total_bench_duration) if total_bench_duration > 0 else 0.0

    print(f"\nOCR Performance Summary:", flush=True)
    print(f"  Total Images Audited: {total_processed}", flush=True)
    print(f"  Successful OCR: {success_count}", flush=True)
    print(f"  No Text Detected: {no_text_count}", flush=True)
    print(f"  Failed Images: {fail_count}", flush=True)
    print(f"  Cold-Start Latency: {cold_start_latency_ms} ms", flush=True)
    print(f"  Warm Average Latency: {round(avg_latency, 2)} ms/img", flush=True)
    print(f"  Warm Median Latency: {round(median_latency, 2)} ms/img", flush=True)
    print(f"  Warm P95 Latency: {round(p95_latency, 2)} ms/img", flush=True)
    print(f"  Warm Throughput: {round(throughput_fps, 2)} images/sec", flush=True)
    print(f"  RAM Usage: {mem_used_mb} MB", flush=True)

    # Save Performance Report: reports/phase3_performance.md
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / "phase3_performance.md"

    report_md = f"""# Phase 3 OCR Subsystem Performance Benchmark Report

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: {pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Environment**: Python 3.13 (`sih` Virtual Environment)  
**OCR Backend**: RapidOCR (ONNXRuntime DBNet + CRNN)  

---

## 1. Benchmark Execution Metrics

| Metric | Value | Unit |
| :--- | :---: | :---: |
| **Total Real Images Processed** | {total_processed} | images |
| **Successful OCR Detections** | {success_count} | count |
| **No Text Detected** | {no_text_count} | count |
| **Failed Inferences** | {fail_count} | count |
| **Cold-Start Pipeline Initialization** | **{cold_start_latency_ms}** | ms |
| **Warm Average Latency** | **{round(avg_latency, 2)}** | ms/image |
| **Warm Median Latency** | **{round(median_latency, 2)}** | ms/image |
| **Warm P95 Latency** | **{round(p95_latency, 2)}** | ms/image |
| **Warm Throughput** | **{round(throughput_fps, 2)}** | images/second |
| **RAM Usage Delta (RSS)** | {mem_used_mb} | MB |

---

## 2. Cold-Start vs Warm Inference Latency

- **Cold-Start Latency**: {cold_start_latency_ms} ms (Includes model loading and ONNX session initialization)
- **Warm Min Latency**: {round(float(np.min(latencies_ms)), 2) if latencies_ms else 0.0} ms
- **Warm Median Latency**: {round(median_latency, 2)} ms
- **Warm P95 Latency**: {round(p95_latency, 2)} ms
- **Warm Max Latency**: {round(float(np.max(latencies_ms)), 2) if latencies_ms else 0.0} ms
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_md)

    print(f"\n[OK] Phase 3 performance report saved to {report_path}", flush=True)

    return {
        "total_processed": total_processed,
        "success_count": success_count,
        "no_text_count": no_text_count,
        "fail_count": fail_count,
        "cold_start_ms": cold_start_latency_ms,
        "avg_latency_ms": round(avg_latency, 2),
        "median_latency_ms": round(median_latency, 2),
        "p95_latency_ms": round(p95_latency, 2),
        "throughput_fps": round(throughput_fps, 2),
        "memory_mb": mem_used_mb
    }

if __name__ == "__main__":
    run_ocr_performance_benchmark()
