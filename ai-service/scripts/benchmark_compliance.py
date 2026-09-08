"""
Phase 6 Legal Metrology Performance Benchmark Script
Measures latency (average, median, P95), throughput, and memory usage for:
1. Phase 6 only
2. Phase 4 + 5 + 6
3. Phase 2 + 3 + 4 + 5 + 6 (Full End-to-End Pipeline)
"""

import os
import sys
import json
import time
import psutil
import numpy as np
from pathlib import Path
from typing import Dict, Any, List

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline
from ml.confidence.pipeline import ConfidencePipeline
from ml.compliance.pipeline import CompliancePipeline


def run_benchmark(val_images_dir: str = "processed_data/val/images", limit: int = 50) -> Dict[str, Any]:
    print("=" * 70)
    print("PHASE 6: LEGAL METROLOGY PERFORMANCE BENCHMARK")
    print("=" * 70)

    val_dir = Path(val_images_dir)
    if not val_dir.exists():
        print(f"[!] Validation images directory not found at {val_dir}")
        return {}

    image_paths = sorted(list(val_dir.glob("*.jpg")) + list(val_dir.glob("*.jpeg")) + list(val_dir.glob("*.png")))
    print(f"Found {len(image_paths)} validation images in {val_dir}. Benchmarking on first {min(limit, len(image_paths))} images...")

    preproc_pipeline = PreprocessingPipeline()
    ocr_engine = get_ocr_engine("rapidocr")
    extraction_pipeline = ExtractionPipeline()
    confidence_pipeline = ConfidencePipeline()
    compliance_pipeline = CompliancePipeline()

    process = psutil.Process(os.getpid())

    # Pre-extract data for Phase 6 only & Phase 4+5+6 benchmarks
    pipeline_data = []
    for img_path in image_paths[:limit]:
        if not img_path.exists():
            continue

        try:
            preproc_res = preproc_pipeline.process(str(img_path))
            if "ocr_primary" not in preproc_res["variants"]:
                continue
            primary_img = preproc_res["variants"]["ocr_primary"]

            ocr_res = ocr_engine.detect_and_recognize(primary_img, image_id=img_path.stem)
            facts = extraction_pipeline.process(ocr_res, product_id=img_path.stem)
            audited = confidence_pipeline.process(
                product_facts=facts,
                image_input=img_path,
                ocr_result=ocr_res,
                preprocessing_result=preproc_res
            )
            pipeline_data.append({
                "img_path": img_path,
                "preproc_res": preproc_res,
                "ocr_res": ocr_res,
                "facts": facts,
                "audited": audited
            })
        except Exception as e:
            print(f"[!] Warmup error on {img_path}: {e}")

    num_samples = len(pipeline_data)
    print(f"Pre-extracted {num_samples} valid test cases. Running benchmark iterations...\n")

    # -------------------------------------------------------------
    # Benchmark 1: Phase 6 Only
    # -------------------------------------------------------------
    mem_before = process.memory_info().rss / (1024 * 1024)
    phase6_latencies = []

    for item in pipeline_data:
        audited = item["audited"]
        t0 = time.perf_counter()
        _ = compliance_pipeline.process(audited_facts=audited)
        t1 = time.perf_counter()
        phase6_latencies.append((t1 - t0) * 1000.0)

    mem_after = process.memory_info().rss / (1024 * 1024)
    mem_delta_phase6 = mem_after - mem_before

    # -------------------------------------------------------------
    # Benchmark 2: Phase 4 + 5 + 6
    # -------------------------------------------------------------
    mem_before = process.memory_info().rss / (1024 * 1024)
    p456_latencies = []

    for item in pipeline_data:
        ocr_res = item["ocr_res"]
        img_path = item["img_path"]
        preproc_res = item["preproc_res"]
        t0 = time.perf_counter()
        facts = extraction_pipeline.process(ocr_res, product_id=img_path.stem)
        audited = confidence_pipeline.process(
            product_facts=facts,
            image_input=img_path,
            ocr_result=ocr_res,
            preprocessing_result=preproc_res
        )
        _ = compliance_pipeline.process(audited_facts=audited)
        t1 = time.perf_counter()
        p456_latencies.append((t1 - t0) * 1000.0)

    mem_after = process.memory_info().rss / (1024 * 1024)
    mem_delta_p456 = mem_after - mem_before

    # -------------------------------------------------------------
    # Benchmark 3: Full End-to-End Pipeline (Phase 2 + 3 + 4 + 5 + 6)
    # -------------------------------------------------------------
    mem_before = process.memory_info().rss / (1024 * 1024)
    full_latencies = []

    for item in pipeline_data:
        img_path = item["img_path"]
        t0 = time.perf_counter()
        preproc_res = preproc_pipeline.process(str(img_path))
        primary_img = preproc_res["variants"]["ocr_primary"]
        ocr_res = ocr_engine.detect_and_recognize(primary_img, image_id=img_path.stem)
        facts = extraction_pipeline.process(ocr_res, product_id=img_path.stem)
        audited = confidence_pipeline.process(
            product_facts=facts,
            image_input=img_path,
            ocr_result=ocr_res,
            preprocessing_result=preproc_res
        )
        _ = compliance_pipeline.process(audited_facts=audited)
        t1 = time.perf_counter()
        full_latencies.append((t1 - t0) * 1000.0)

    mem_after = process.memory_info().rss / (1024 * 1024)
    mem_delta_full = mem_after - mem_before

    def compute_stats(latencies: List[float], mem_delta: float) -> Dict[str, Any]:
        arr = np.array(latencies)
        avg = float(np.mean(arr))
        med = float(np.median(arr))
        p95 = float(np.percentile(arr, 95))
        throughput = 1000.0 / avg if avg > 0 else 0.0
        return {
            "samples": len(latencies),
            "average_latency_ms": round(avg, 2),
            "median_latency_ms": round(med, 2),
            "p95_latency_ms": round(p95, 2),
            "throughput_items_per_sec": round(throughput, 2),
            "memory_delta_mb": round(mem_delta, 2)
        }

    benchmark_res = {
        "benchmark_metadata": {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "samples_tested": num_samples,
            "system_os": sys.platform,
            "python_version": sys.version.split()[0]
        },
        "phase6_standalone": compute_stats(phase6_latencies, mem_delta_phase6),
        "phase4_5_6_combined": compute_stats(p456_latencies, mem_delta_p456),
        "full_pipeline_phase2_3_4_5_6": compute_stats(full_latencies, mem_delta_full)
    }

    # Save output
    out_dir = "reports"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "phase6_benchmark.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(benchmark_res, f, indent=2)

    print(f"[+] Benchmark complete! Saved to {out_file}\n")
    print(f"Phase 6 Standalone: Avg = {benchmark_res['phase6_standalone']['average_latency_ms']} ms | P95 = {benchmark_res['phase6_standalone']['p95_latency_ms']} ms")
    print(f"Phase 4+5+6:        Avg = {benchmark_res['phase4_5_6_combined']['average_latency_ms']} ms | P95 = {benchmark_res['phase4_5_6_combined']['p95_latency_ms']} ms")
    print(f"Full E2E Pipeline:  Avg = {benchmark_res['full_pipeline_phase2_3_4_5_6']['average_latency_ms']} ms | P95 = {benchmark_res['full_pipeline_phase2_3_4_5_6']['p95_latency_ms']} ms")

    return benchmark_res


if __name__ == "__main__":
    run_benchmark()
