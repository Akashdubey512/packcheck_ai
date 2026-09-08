# Ground Truth Annotation Guidelines: Legal Metrology Packaged Commodities

## 1. Overview
These guidelines specify standard operating procedures for human annotators labeling retail product packaging images for Legal Metrology compliance research.

---

## 2. Bounding Box Annotation Standards
1. **Tight Bounding Boxes**: Draw tight 4-point rectangle bounding boxes `[x1, y1, x2, y2]` around the exact text string of each mandatory declaration.
2. **Mandatory Declaration Fields**:
   - `manufacturer_name_and_address`
   - `country_of_origin`
   - `common_generic_name`
   - `net_quantity`
   - `manufacturing_packing_date`
   - `best_before_expiry`
   - `mrp`
   - `consumer_care_details`
   - `unit_sale_price`
3. **Missing Declarations**: If a mandatory field is not present on the inspected image face, set `is_present: false` and `bbox: null`.

---

## 3. Validation Protocol
Annotations must be validated via `data/ground_truth/annotation_validator.py` before inclusion in benchmark validation splits.
