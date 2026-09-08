"""
Phase 5 Confidence, Evidence & Audit Benchmark Script
Measures isolated Phase 5 latency (confidence calibration, visual crop extraction, SHA-256 provenance hashing)
vs full audited pipeline latency (Phase 2 -> 3 -> 4 -> 5), throughput, and RAM memory usage.
"""

import time
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import psutil

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline
from ml.confidence.pipeline import ConfidencePipeline


class ConfidenceBenchmark:
    """Benchmark suite for Phase 5 Confidence & Evidence Pipeline."""

    def __init__(self, val_dir: str = "processed_data/val/images"):
        self.val_dir = Path(val_dir)
        self.preproc = PreprocessingPipeline()
        self.ocr_engine = get_ocr_engine("rapidocr")
        self.extraction_pipeline = ExtractionPipeline()
        self.confidence_pipeline = ConfidencePipeline(crop_output_dir="processed_data/evidence_crops")

    def run_benchmark(self, num_samples: int = 100, output_path: str = "reports/phase5_benchmark.json") -> Dict[str, Any]:
        """Run benchmark on validation images."""
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

        full_audited_latencies = []
        phase5_only_latencies = []
        successful_runs = 0
        total_crops_generated = 0

        print(f"Running Phase 5 Benchmark on {total_images} validation images...")

        for img_path in image_files:
            try:
                # Preprocessing
                preproc_res = self.preproc.process(str(img_path))
                if "ocr_primary" not in preproc_res["variants"]:
                    continue

                primary_img = preproc_res["variants"]["ocr_primary"]

                # OCR & Extraction
                ocr_res = self.ocr_engine.detect_and_recognize(primary_img, image_id=img_path.stem)
                facts = self.extraction_pipeline.process(ocr_res, product_id=img_path.stem)

                # Full Audited Pipeline timing (Phase 2 -> 3 -> 4 -> 5)
                t0 = time.perf_counter()
                audited = self.confidence_pipeline.process(
                    product_facts=facts,
                    image_input=img_path,
                    ocr_result=ocr_res,
                    preprocessing_result=preproc_res
                )
                t1 = time.perf_counter()

                full_lat = (t1 - t0) * 1000.0
                full_audited_latencies.append(full_lat)

                # Isolated Phase 5 Timing
                t0_p5 = time.perf_counter()
                self.confidence_pipeline.process(
                    product_facts=facts,
                    image_input=img_path,
                    ocr_result=ocr_res,
                    preprocessing_result=preproc_res
                )
                t1_p5 = time.perf_counter()
                phase5_only_latencies.append((t1_p5 - t0_p5) * 1000.0)

                total_crops_generated += len(audited.evidence_manifest.crops)
                successful_runs += 1

            except Exception as e:
                print(f"Error benchmarking image {img_path.name}: {e}")

        ram_end_mb = process.memory_info().rss / (1024 * 1024)
        ram_delta_mb = ram_end_mb - ram_start_mb

        total_full_time_sec = sum(full_audited_latencies) / 1000.0 if full_audited_latencies else 1.0

        results = {
            "total_images": total_images,
            "successful_runs": successful_runs,
            "success_rate_percent": round((successful_runs / total_images) * 100.0, 2),
            "total_evidence_crops_generated": total_crops_generated,
            "full_audited_pipeline": {
                "avg_latency_ms": round(float(np.mean(full_audited_latencies)), 2),
                "median_latency_ms": round(float(np.median(full_audited_latencies)), 2),
                "p95_latency_ms": round(float(np.percentile(full_audited_latencies, 95)), 2),
                "throughput_images_per_sec": round(successful_runs / total_full_time_sec, 2)
            },
            "phase5_confidence_only": {
                "avg_latency_ms": round(float(np.mean(phase5_only_latencies)), 2),
                "median_latency_ms": round(float(np.median(phase5_only_latencies)), 2),
                "p95_latency_ms": round(float(np.percentile(phase5_only_latencies, 95)), 2),
                "throughput_images_per_sec": round(len(phase5_only_latencies) / (sum(phase5_only_latencies) / 1000.0), 2)
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
        print("PHASE 5 BENCHMARK RESULTS")
        print("============================================================")
        print(f"Total Images: {results['total_images']}")
        print(f"Successful Runs: {results['successful_runs']} ({results['success_rate_percent']}%)")
        print(f"Total Evidence Crops Generated: {results['total_evidence_crops_generated']}")
        print(f"Full Audited Pipeline Avg Latency: {results['full_audited_pipeline']['avg_latency_ms']} ms/img")
        print(f"Full Audited Pipeline P95 Latency: {results['full_audited_pipeline']['p95_latency_ms']} ms/img")
        print(f"Phase 5 Only Avg Latency: {results['phase5_confidence_only']['avg_latency_ms']} ms/img")
        print(f"Phase 5 Only P95 Latency: {results['phase5_confidence_only']['p95_latency_ms']} ms/img")
        print(f"Phase 5 Only Throughput: {results['phase5_confidence_only']['throughput_images_per_sec']} imgs/sec")
        print(f"RAM Delta: {results['memory']['ram_delta_mb']} MB")
        print(f"Results saved to: {out_file}")
        print("============================================================\n")

        return results


def main():
    benchmark = ConfidenceBenchmark()
    benchmark.run_benchmark(num_samples=100)


if __name__ == "__main__":
    main()
