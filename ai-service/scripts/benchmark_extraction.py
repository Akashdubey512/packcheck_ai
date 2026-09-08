"""
Phase 4 Extraction Benchmark Script
Measures extraction-only latency vs full pipeline latency (Preprocessing + OCR + Extraction),
throughput (images/sec), P95 latency, and RAM memory delta on real validation images.
"""

import time
import json
import numpy as np
import psutil
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline


class ExtractionBenchmark:
    """Benchmark suite for Phase 4 Field Extraction and Full Pipeline performance."""

    def __init__(self, val_dir: str = "processed_data/val/images"):
        self.val_dir = Path(val_dir)
        self.preproc = PreprocessingPipeline()
        self.ocr_engine = get_ocr_engine("rapidocr")
        self.extraction_pipeline = ExtractionPipeline()

    def run_benchmark(self, num_samples: int = 100, output_path: str = "reports/phase4_benchmark.json") -> Dict[str, Any]:
        """Execute performance benchmark on validation dataset images."""
        if not self.val_dir.exists():
            raise FileNotFoundError(f"Validation images directory missing: {self.val_dir}")

        image_files = sorted(
            list(self.val_dir.glob("*.jpg")) +
            list(self.val_dir.glob("*.png")) +
            list(self.val_dir.glob("*.jpeg"))
        )[:num_samples]

        total_images = len(image_files)
        if total_images == 0:
            raise ValueError(f"No validation images found in {self.val_dir}")

        process = psutil.Process(os.getpid())
        ram_start_mb = process.memory_info().rss / (1024 * 1024)

        full_pipeline_latencies = []
        extraction_only_latencies = []
        successful_runs = 0

        print(f"Running Phase 4 Benchmark on {total_images} validation images...")

        # Pre-generate OCR results for extraction-only measurement
        ocr_results = []
        for img_path in image_files:
            try:
                preproc_res = self.preproc.process(str(img_path))
                if "ocr_primary" not in preproc_res["variants"]:
                    continue
                primary_img = preproc_res["variants"]["ocr_primary"]
                
                # Full pipeline timing
                t0 = time.perf_counter()
                ocr_res = self.ocr_engine.detect_and_recognize(primary_img, image_id=img_path.stem)
                facts = self.extraction_pipeline.process(ocr_res, product_id=img_path.stem)
                t1 = time.perf_counter()
                
                full_lat = (t1 - t0) * 1000.0
                full_pipeline_latencies.append(full_lat)
                ocr_results.append(ocr_res)
                successful_runs += 1

            except Exception as e:
                print(f"Error benchmarking image {img_path.name}: {e}")

        # Measure extraction-only latency
        for ocr_res in ocr_results:
            t0 = time.perf_counter()
            self.extraction_pipeline.process(ocr_res, product_id=ocr_res.image_id)
            t1 = time.perf_counter()
            extraction_only_latencies.append((t1 - t0) * 1000.0)

        ram_end_mb = process.memory_info().rss / (1024 * 1024)
        ram_delta_mb = ram_end_mb - ram_start_mb

        total_full_time_sec = sum(full_pipeline_latencies) / 1000.0 if full_pipeline_latencies else 1.0

        results = {
            "total_images": total_images,
            "successful_runs": successful_runs,
            "success_rate_percent": round((successful_runs / total_images) * 100.0, 2),
            "full_pipeline": {
                "avg_latency_ms": round(float(np.mean(full_pipeline_latencies)), 2),
                "median_latency_ms": round(float(np.median(full_pipeline_latencies)), 2),
                "p95_latency_ms": round(float(np.percentile(full_pipeline_latencies, 95)), 2),
                "throughput_images_per_sec": round(successful_runs / total_full_time_sec, 2)
            },
            "extraction_only": {
                "avg_latency_ms": round(float(np.mean(extraction_only_latencies)), 2),
                "median_latency_ms": round(float(np.median(extraction_only_latencies)), 2),
                "p95_latency_ms": round(float(np.percentile(extraction_only_latencies, 95)), 2),
                "throughput_images_per_sec": round(len(extraction_only_latencies) / (sum(extraction_only_latencies) / 1000.0), 2)
            },
            "memory": {
                "ram_start_mb": round(ram_start_mb, 2),
                "ram_end_mb": round(ram_end_mb, 2),
                "ram_delta_mb": round(ram_delta_mb, 2)
            }
        }

        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

        print("\n============================================================")
        print("PHASE 4 BENCHMARK RESULTS")
        print("============================================================")
        print(f"Total Images: {results['total_images']}")
        print(f"Successful Runs: {results['successful_runs']} ({results['success_rate_percent']}%)")
        print(f"Full Pipeline Avg Latency: {results['full_pipeline']['avg_latency_ms']} ms/img")
        print(f"Full Pipeline P95 Latency: {results['full_pipeline']['p95_latency_ms']} ms/img")
        print(f"Extraction-Only Avg Latency: {results['extraction_only']['avg_latency_ms']} ms/img")
        print(f"Extraction-Only P95 Latency: {results['extraction_only']['p95_latency_ms']} ms/img")
        print(f"Extraction-Only Throughput: {results['extraction_only']['throughput_images_per_sec']} imgs/sec")
        print(f"RAM Delta: {results['memory']['ram_delta_mb']} MB")
        print(f"Results saved to: {out_file}")
        print("============================================================\n")

        return results


def main():
    benchmark = ExtractionBenchmark()
    benchmark.run_benchmark(num_samples=100)


if __name__ == "__main__":
    main()
