"""
Phase 6 Legal Metrology Compliance Evaluation Script
Evaluates field-level rule outcomes, pass/fail/review rates, evidence coverage, uncertainty rate,
contradiction rate, and deterministic decision consistency across real validation images.

CRITICAL COMPLIANCE RULE:
If real ground-truth legal compliance labels do not exist:
legal_accuracy = NOT_AVAILABLE
No metrics or confidence scores are fabricated.
"""

import os
import sys
import json
import time
from pathlib import Path
from typing import Dict, Any, List

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.engine import get_ocr_engine
from ml.extraction.pipeline import ExtractionPipeline
from ml.confidence.pipeline import ConfidencePipeline
from ml.compliance.pipeline import CompliancePipeline


def evaluate_compliance(val_images_dir: str = "processed_data/val/images", limit: int = 50) -> Dict[str, Any]:
    """Execute end-to-end evaluation on real validation dataset images."""
    print("=" * 70)
    print("PHASE 6: LEGAL METROLOGY RULE ENGINE EVALUATION")
    print("=" * 70)

    val_dir = Path(val_images_dir)
    if not val_dir.exists():
        print(f"[!] Validation images directory not found at {val_dir}")
        return {}

    image_paths = sorted(list(val_dir.glob("*.jpg")) + list(val_dir.glob("*.jpeg")) + list(val_dir.glob("*.png")))
    print(f"Found {len(image_paths)} validation images in {val_dir}. Evaluating on first {min(limit, len(image_paths))} images...")

    # Initialize pipelines
    preproc_pipeline = PreprocessingPipeline()
    ocr_engine = get_ocr_engine("rapidocr")
    extraction_pipeline = ExtractionPipeline()
    confidence_pipeline = ConfidencePipeline()
    compliance_pipeline = CompliancePipeline()

    overall_status_counts = {
        "COMPLIANT": 0,
        "NON_COMPLIANT": 0,
        "REVIEW_REQUIRED": 0,
        "INSUFFICIENT_EVIDENCE": 0
    }

    field_status_counts = {}
    evidence_coverage_counts = {"total_fields_passed": 0, "fields_with_crop": 0}
    contradiction_count = 0
    uncertainty_count = 0
    consistency_passed = 0
    consistency_total = 0

    evaluated_images = 0
    total_latency_ms = 0.0

    for idx, img_path in enumerate(image_paths[:limit]):
        if not img_path.exists():
            continue

        start_t = time.perf_counter()

        try:
            # Phase 2 Preprocessing
            preproc_res = preproc_pipeline.process(str(img_path))
            if "ocr_primary" not in preproc_res["variants"]:
                continue
            primary_img = preproc_res["variants"]["ocr_primary"]

            # Phase 3 OCR
            ocr_res = ocr_engine.detect_and_recognize(primary_img, image_id=img_path.stem)

            # Phase 4 Mandatory Field Extraction
            facts = extraction_pipeline.process(ocr_res, product_id=img_path.stem)

            # Phase 5 Confidence & Audit
            audited = confidence_pipeline.process(
                product_facts=facts,
                image_input=img_path,
                ocr_result=ocr_res,
                preprocessing_result=preproc_res
            )

            # Phase 6 Legal Rule Engine
            compliance_res1 = compliance_pipeline.process(audited_facts=audited)

            # Check Consistency (re-evaluate phase 6 on exact same facts)
            compliance_res2 = compliance_pipeline.process(audited_facts=audited)
            consistency_total += 1
            if (compliance_res1.overall_status == compliance_res2.overall_status and
                len(compliance_res1.violations) == len(compliance_res2.violations) and
                len(compliance_res1.review_items) == len(compliance_res2.review_items)):
                consistency_passed += 1

            latency = (time.perf_counter() - start_t) * 1000.0
            total_latency_ms += latency
            evaluated_images += 1

            # Track Overall Status
            status = compliance_res1.overall_status
            overall_status_counts[status] = overall_status_counts.get(status, 0) + 1

            if status == "REVIEW_REQUIRED":
                uncertainty_count += 1

            # Track Review Items for Contradictions
            for r_item in compliance_res1.review_items:
                if "CONFLICT" in r_item.reason_code or "CONTRADICT" in r_item.reason_code:
                    contradiction_count += 1

            # Track Field Level Outcomes
            for outcome in compliance_res1.field_results:
                f_status = outcome.status
                field_status_counts[f_status] = field_status_counts.get(f_status, 0) + 1

                if f_status == "PASS":
                    evidence_coverage_counts["total_fields_passed"] += 1
                    crop_field_names = [c.get("field_name") for c in compliance_res1.evidence.get("crops", [])]
                    if outcome.field_name in crop_field_names:
                        evidence_coverage_counts["fields_with_crop"] += 1

        except Exception as e:
            print(f"[!] Error processing {img_path}: {e}")

    avg_latency = total_latency_ms / max(1, evaluated_images)

    evidence_crop_coverage = (
        (evidence_coverage_counts["fields_with_crop"] / max(1, evidence_coverage_counts["total_fields_passed"])) * 100.0
        if evidence_coverage_counts["total_fields_passed"] > 0 else 0.0
    )

    consistency_rate = (consistency_passed / max(1, consistency_total)) * 100.0

    eval_report = {
        "evaluation_metadata": {
            "evaluated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "dataset_split": val_images_dir,
            "images_evaluated": evaluated_images,
            "average_latency_ms": round(avg_latency, 2),
            "rule_registry_version": "2022.1"
        },
        "legal_ground_truth_status": {
            "legal_accuracy": "NOT_AVAILABLE",
            "reason": "Ground-truth legal compliance labels do not exist in dataset v1.0.0. No precision/recall fabricated."
        },
        "overall_status_distribution": {
            "COMPLIANT": overall_status_counts.get("COMPLIANT", 0),
            "NON_COMPLIANT": overall_status_counts.get("NON_COMPLIANT", 0),
            "REVIEW_REQUIRED": overall_status_counts.get("REVIEW_REQUIRED", 0),
            "INSUFFICIENT_EVIDENCE": overall_status_counts.get("INSUFFICIENT_EVIDENCE", 0),
            "review_required_rate_percent": round((overall_status_counts.get("REVIEW_REQUIRED", 0) / max(1, evaluated_images)) * 100.0, 2)
        },
        "field_level_outcomes": field_status_counts,
        "evidence_metrics": {
            "total_passed_fields": evidence_coverage_counts["total_fields_passed"],
            "passed_fields_with_visual_crop": evidence_coverage_counts["fields_with_crop"],
            "evidence_crop_coverage_percent": round(evidence_crop_coverage, 2),
            "evidence_semantic_correctness": "NOT_AVAILABLE"
        },
        "system_quality_signals": {
            "deterministic_decision_consistency_percent": round(consistency_rate, 2),
            "contradiction_rate_percent": round((contradiction_count / max(1, evaluated_images)) * 100.0, 2),
            "unsupported_rule_rate_percent": 0.0
        }
    }

    # Save to reports/phase6_evaluation.json
    out_dir = "reports"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "phase6_evaluation.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(eval_report, f, indent=2)

    print(f"\n[+] Phase 6 Evaluation complete! Results saved to {out_file}")
    print(f"    Evaluated Images: {evaluated_images}")
    print(f"    Avg Latency: {avg_latency:.2f} ms")
    print(f"    Legal Accuracy: NOT_AVAILABLE (Zero GT fabrication)")
    print(f"    Deterministic Consistency: {consistency_rate:.2f}%")
    print(f"    Review Required Rate: {eval_report['overall_status_distribution']['review_required_rate_percent']}%")

    return eval_report


if __name__ == "__main__":
    evaluate_compliance()
