"""
Ground Truth Dataset Verification & Validation Command
Scans data/ground_truth/annotations/ for manually annotated packaging samples,
validates schema compliance, and outputs empirical dataset statistics.
"""

import json
from pathlib import Path
from data.ground_truth.annotation_validator import validate_annotation_file

BASE_DIR = Path(__file__).resolve().parent.parent
GT_ANNO_DIR = BASE_DIR / "data" / "ground_truth" / "annotations"
REPORTS_DIR = BASE_DIR / "reports"

def run_gt_validation():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    print("\n========================================================")
    print("GROUND TRUTH DATASET VALIDATION AUDIT")
    print("========================================================\n")

    if not GT_ANNO_DIR.exists():
        GT_ANNO_DIR.mkdir(parents=True, exist_ok=True)

    anno_files = list(GT_ANNO_DIR.glob("*.json"))
    sample_count = len(anno_files)
    valid_count = 0
    invalid_count = 0
    products = set()
    errors_summary = []

    for f_path in anno_files:
        is_valid, errs = validate_annotation_file(f_path)
        if is_valid:
            valid_count += 1
            try:
                with open(f_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    products.add(data.get("product_id"))
            except Exception:
                pass
        else:
            invalid_count += 1
            errors_summary.append({"file": f_path.name, "errors": errs})

    status_str = "GROUND_TRUTH_AVAILABLE" if valid_count > 0 else "GROUND_TRUTH_DATASET_NOT_AVAILABLE"

    report_data = {
        "status": status_str,
        "total_annotation_files_found": sample_count,
        "valid_annotated_samples": valid_count,
        "invalid_annotated_samples": invalid_count,
        "unique_product_count": len(products),
        "errors": errors_summary
    }

    report_json_path = REPORTS_DIR / "gt_dataset_verification.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    print(f"Status: {status_str}")
    print(f"Total Annotation Files Found: {sample_count}")
    print(f"Valid Annotated Samples: {valid_count}")
    print(f"Unique Products Count: {len(products)}")
    print(f"Report saved to: {report_json_path}\n")

    return report_data

if __name__ == "__main__":
    run_gt_validation()
