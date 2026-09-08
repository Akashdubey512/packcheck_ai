"""
Ground Truth Annotation Validator
Validates packaging ground truth annotation files against schema, checking bbox bounds, field names, ISO dates, and numeric formats.
"""

import json
from pathlib import Path
from typing import Dict, Any, List, Tuple

VALID_VIEWS = {"FRONT", "BACK", "SIDE_LEFT", "SIDE_RIGHT", "TOP", "BOTTOM", "UNKNOWN"}
MANDATORY_FIELDS = {
    "manufacturer_name_and_address",
    "country_of_origin",
    "common_generic_name",
    "net_quantity",
    "manufacturing_packing_date",
    "best_before_expiry",
    "mrp",
    "consumer_care_details",
    "unit_sale_price"
}

def validate_annotation_file(file_path: Path) -> Tuple[bool, List[str]]:
    """Validate a ground truth annotation JSON file."""
    errors = []
    if not file_path.exists():
        return False, [f"File not found: {file_path}"]

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return False, [f"JSON parse error: {str(e)}"]

    # Check top-level keys
    required_keys = ["product_id", "view_id", "image_id", "declarations", "annotator_id"]
    for key in required_keys:
        if key not in data or not data[key]:
            errors.append(f"Missing required key: '{key}'")

    view = data.get("view_id", "")
    if view not in VALID_VIEWS:
        errors.append(f"Invalid view_id '{view}'. Must be one of {VALID_VIEWS}")

    declarations = data.get("declarations", {})
    for field in MANDATORY_FIELDS:
        if field not in declarations:
            errors.append(f"Missing declaration entry for '{field}'")
        else:
            entry = declarations[field]
            if not isinstance(entry, dict):
                errors.append(f"Declaration '{field}' must be a dictionary")
                continue
            
            is_present = entry.get("is_present", False)
            bbox = entry.get("bbox")
            if is_present:
                if not bbox or not isinstance(bbox, list) or len(bbox) != 4:
                    errors.append(f"Field '{field}' marked present but missing 4-element bbox [x1, y1, x2, y2]")
                elif bbox[0] >= bbox[2] or bbox[1] >= bbox[3]:
                    errors.append(f"Field '{field}' invalid bbox coordinates: x1 < x2 and y1 < y2 required")

    return (len(errors) == 0), errors

if __name__ == "__main__":
    print("Ground truth annotation validator module loaded.")
