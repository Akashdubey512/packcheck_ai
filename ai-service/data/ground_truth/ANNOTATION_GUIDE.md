# Indian Packaged-Product Ground Truth Annotation Specification & Guidelines

**Project**: Legal Metrology Packaged Commodity Automated Compliance Auditor (SIH 2026 PS ID 26034)  
**Version**: `1.0.0`  

---

## 1. Schema & Standard Operating Procedures

Ground-truth dataset annotations for Legal Metrology compliance research must follow `data/ground_truth/annotation_schema.json`.

### Categories Supported
- `food`
- `cosmetics`
- `electronics`
- `household_goods`
- `garments_textiles`
- `imported_goods`
- `other`

### View Orientations
- `front`
- `back`
- `left`
- `right`
- `top`
- `bottom`
- `other`

### Presence Flags
- `PRESENT`: Declaration text clearly visible and localized with tight bbox coordinates `[x1, y1, x2, y2]`.
- `ABSENT`: Declaration verified as completely absent from the entire physical package.
- `UNCLEAR`: Declaration text present but blurred, occluded, or unreadable.
- `NOT_APPLICABLE`: Declaration not required for the specific product category (e.g. expiry date for non-perishables).
- `NOT_VISIBLE`: Declaration not present on the current image view, but may legally exist on uninspected package faces. **Crucial Rule**: `NOT_VISIBLE` must **never** be interpreted as `ABSENT`.

---

## 2. Leakage-Free Product Splitting
To prevent product-level train/validation/test data leakage, all image views originating from the same physical product (`product_id`) must be assigned strictly to a single dataset split using `data/ground_truth/split_generator.py`.
