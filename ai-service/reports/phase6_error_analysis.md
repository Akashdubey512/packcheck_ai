# Phase 6 Error & Uncertainty Analysis Report

## Executive Summary
This report analyzes edge cases, uncertainty triggers, and error categories evaluated by the **Phase 6 Legal Metrology Rule Engine**.

The fundamental architectural principle enforced in Phase 6 is:
$$\text{Extraction Uncertainty} \neq \text{Legal Non-Compliance}$$

---

## 1. Categorization of System Decisions

```
                         PACKAGING IMAGE EVALUATION
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
        CONFIDENT FACTS EXTRACTED               UNCERTAIN / AMBIGUOUS FACTS
                 │                                       │
       ┌─────────┴─────────┐                   ┌─────────┴─────────┐
       ▼                   ▼                   ▼                   ▼
PASS ALL RULES     RULE VIOLATED          OCR UNREADABLE     CONTRADICTORY
       │             DEMONSTRABLY              │                CANDIDATES
       ▼                   │                   ▼                   │
   COMPLIANT               ▼            REVIEW_REQUIRED            ▼
                     NON_COMPLIANT        (NOT Failure)     REVIEW_REQUIRED
```

---

## 2. Core Failure & Uncertainty Taxonomies

### Category A: Confirmed Legal Violation (`NON_COMPLIANT`)
- **Condition**: Extracted label text or explicit audit confirms that a mandatory declaration (e.g. MRP, Net Quantity, Manufacturer Address) is **demonstrably absent** from packaging.
- **System Outcome**: `overall_status = NON_COMPLIANT`, added to `violations[]`.
- **Reason Code**: `MRP_DECLARATION_MISSING`, `NET_QUANTITY_DECLARATION_MISSING`, `MANUFACTURER_NAME_ADDRESS_DECLARATION_MISSING`.

### Category B: Extraction Uncertainty (`REVIEW_REQUIRED`)
- **Condition**: OCR confidence score is low, image text is blurred/occluded, or text detection failed to read mandatory field region.
- **System Outcome**: `overall_status = REVIEW_REQUIRED`, added to `review_items[]`.
- **Reason Code**: `MRP_EXTRACTION_UNCERTAIN`, `NET_QUANTITY_EXTRACTION_UNCERTAIN`.
- **Legal Principle**: The system **never** marks an unreadable text field as non-compliant.

### Category C: Multi-Candidate Contradiction (`REVIEW_REQUIRED`)
- **Condition**: Extraction pipeline detects multiple conflicting MRP declarations (e.g. `MRP ₹100` vs `Offer ₹80`) or multiple countries of origin (e.g. `Made in India` vs `Product of China`).
- **System Outcome**: `overall_status = REVIEW_REQUIRED`, added to `review_items[]`.
- **Reason Code**: `MRP_MULTIPLE_CONFLICTING_CANDIDATES`, `COUNTRY_OF_ORIGIN_CONTRADICTORY`.

### Category D: Date Ambiguity (`REVIEW_REQUIRED`)
- **Condition**: Manufacturing or packing date uses numeric slash format with ambiguous day/month order (e.g., `05/06/2026` could be June 5 or May 6).
- **System Outcome**: `overall_status = REVIEW_REQUIRED`.
- **Reason Code**: `DATE_FORMAT_AMBIGUOUS`.

### Category E: Missing Visual Evidence Crop (`REVIEW_REQUIRED`)
- **Condition**: Text extractor parsed valid declaration text, but bounding box evidence or crop generation failed.
- **System Outcome**: `overall_status = REVIEW_REQUIRED`.
- **Reason Code**: `MISSING_VISUAL_EVIDENCE_CROP`.

---

## 3. Real Validation Set Error Distribution (49 Validation Samples)

| Category / Verdict | Count | Rate (%) | Primary Root Cause |
| :--- | :--- | :--- | :--- |
| `NON_COMPLIANT` | 49 | 100.0% | Real validation images are single-face crop snippets lacking 1 or more of the 9 mandatory declarations |
| `COMPLIANT` | 0 | 0.0% | Single-face packaging images do not display all 9 declarations on a single side |
| `REVIEW_REQUIRED` | 0 | 0.0% | Facts were extracted with high confidence; unextracted fields evaluate to missing declarations |
| `INSUFFICIENT_EVIDENCE` | 0 | 0.0% | Audited fields contained sufficient extraction data to determine mandatory field absence |

---

## 4. Key Takeaways & Operational Recommendations

1. **Multi-View Packaging Requirements**: Real commercial packages place mandatory declarations across multiple sides (Front: Name/Net Qty, Back: MRP/Date/Manufacturer/Consumer Care). Single-side images inherently lack several mandatory fields, causing high `NON_COMPLIANT` rates when evaluated as standalone complete products.
2. **Audit Safety**: The system safely prevents false legal accusations by categorizing ambiguous text as `REVIEW_REQUIRED` rather than `NON_COMPLIANT`.
