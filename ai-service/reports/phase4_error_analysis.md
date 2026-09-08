# Phase 4 Mandatory Field Extraction Error Analysis Report

**Project**: Legal Metrology (Packaged Commodities) Automated Compliance Auditor  
**Phase**: Phase 4 — Mandatory Field Extraction + Value Normalization  
**Document Status**: Production Complete  

---

## 1. Executive Summary & Scope

This report documents qualitative error modes and edge cases identified during Phase 4 field extraction and value normalization. In accordance with strict system boundaries:

> [!IMPORTANT]
> **Core Architectural Rule**: Phase 4 extracts structured product facts. All failure modes documented herein are classified strictly as **extraction/normalization errors**. They MUST NOT be interpreted as legal non-compliance decisions. Legal compliance evaluation is deferred to Phase 5.

---

## 2. Taxonomy of Extraction & Normalization Errors

### Error Mode 1: OCR Typo / Character Substitution Causing Misclassification
* **Description**: OCR character confusions (e.g., `M.R.P.` recognized as `M.R.P.`, `MR P`, or `N1et Qty`) degrade candidate generation confidence.
* **Impact**: Field classifier score drops below 0.70 threshold, leading to `LOW_CONFIDENCE` or `REVIEW_REQUIRED` status.
* **Mitigation**: Implemented context-aware character sanitization (`sanitize_ocr_digits`), fuzzy keyword regexes, and Devanagari/English synonym matching.

### Error Mode 2: Offer Price vs. Maximum Retail Price (MRP) Confusion
* **Description**: Packages displaying both `MRP ₹249.00` and `Offer Price ₹199.00` or `Special Price ₹150.00`.
* **Impact**: Standard naive single-regex extractors mistake the offer price for the legal MRP.
* **Mitigation**: Candidate generator scores both prices and penalizes terms like `offer price` or `discount`. When distinct valid price values coexist with high confidence, the field status is explicitly set to `MULTIPLE_CANDIDATES` rather than silently discarding competing evidence.

### Error Mode 3: Date Ambiguity (DD/MM/YYYY vs. MM/DD/YYYY)
* **Description**: Dates such as `05/06/2026` where both day and month are $\le 12$.
* **Impact**: Silently guessing day vs. month risks corrupting date calculations in downstream modules.
* **Mitigation**: `ValueNormalizer.normalize_date()` detects ambiguous components ($n_1 \le 12, n_2 \le 12, n_1 \neq n_2$), returns `normalization_status: AMBIGUOUS`, populates `possible_alternatives: ["2026-06-05", "2026-05-06"]`, and sets `field.status = AMBIGUOUS`.

### Error Mode 4: Net Quantity Unit Basis vs. Mass/Volume Cross-Conversion
* **Description**: Liquid commodities declaring `500 ml` or dry items declaring `500 g`.
* **Impact**: Naive converters attempting mass-to-volume conversion (e.g., `500 ml -> 500 g`) introduce errors because density is unknown.
* **Mitigation**: `ValueNormalizer.normalize_net_quantity()` enforces standard SI unit canonicalization (`mg` $\rightarrow$ `g`, `kg` $\rightarrow$ `g`, `l` $\rightarrow$ `ml`) within the SAME physical dimension (mass or volume). **Cross-conversion between mass and volume is strictly prohibited.**

### Error Mode 5: Manufacturer vs. Distributor / Marketer Confusion
* **Description**: Packages displaying "Manufactured by Corp A" and "Marketed by Corp B".
* **Impact**: Extracting "Corp B" when legal rules require the original manufacturer/packer name and address.
* **Mitigation**: `CandidateGenerator` ranks "Manufactured by" / "Mfd by" patterns with higher spatial and keyword weights over generic marketer mentions, while retaining full candidate provenance.

### Error Mode 6: Multi-line Address Truncation
* **Description**: Manufacturer addresses spanning 3–4 horizontal text regions across packaging folds.
* **Impact**: Single-region text extraction captures only the first line of the address.
* **Mitigation**: `_generate_paired_candidates()` groups vertically and horizontally adjacent text regions within spatial proximity thresholds ($<250$px horizontal, $<100$px vertical), merging region bounding boxes and source region IDs.

### Error Mode 7: Unit Sale Price (USP) Calculation & Parsing Confusion
* **Description**: Packages declaring unit prices like `₹ 0.50 / g` or `Rs 10 per 100 g`.
* **Impact**: Ambiguity between total package MRP and calculated unit sale price.
* **Mitigation**: `ValueNormalizer.normalize_unit_sale_price()` extracts amount, currency, unit basis quantity, and unit basis unit separately into `NormalizedValue`, maintaining explicit separation from `mrp`.

### Error Mode 8: Multilingual / Hindi (Devanagari) Text Extraction Failure
* **Description**: Hindi declarations (e.g. `निवल मात्रा 500 ग्राम`, `एमआरपी ₹ 250`) where character segmentation is noisy.
* **Impact**: Missed English-only regex matches.
* **Mitigation**: Integrated bilingual Devanagari regex patterns (`एमआरपी`, `निवल मात्रा`, `उत्पादन तिथि`, `ग्राहक सेवा`) in candidate generator.

---

## 3. Extraction Error Summary Matrix

| Field Name | Primary Error Mode | Root Cause | Handling Strategy |
| :--- | :--- | :--- | :--- |
| `mrp` | Offer price confusion / OCR digit swap | Coexisting discount labels; `O` vs `0` | Candidate ranking + `MULTIPLE_CANDIDATES` status |
| `net_quantity` | Unit basis misinterpretation | Non-standard abbreviations (`gm`, `gms`, `ml.`) | Unit normalization table + strict dimension boundary |
| `manufacturing_packing_date` | Ambiguous numeric format | `05/06/2026` day/month order | `AMBIGUOUS` normalization status + alternatives |
| `best_before_expiry` | Textual duration vs ISO date | Expressions like "12 Months from mfg" | Structured duration object in `NormalizedValue` |
| `country_of_origin` | Missed origin string | Embedded in dense address blocks | Keyword proximity lookup (`Made in`, `Origin`) |
| `consumer_care_details` | Multiple contacts (phone + email) | Split text regions across package | Multimodal regex (phone, toll-free, email, url) |
| `manufacturer_name_and_address` | Address line truncation | Multi-line wrap across folds | Spatial region pairing & bbox bounding |
| `common_generic_name` | Low contrast text | Small font height on lower panel | Proximity to trade brand name |
| `unit_sale_price` | Missing USP declaration | Mandatory w.e.f. 2022 amendment | Explicit `NOT_FOUND` status |

---

## 4. Conclusion & Next Steps

All identified extraction error modes have explicit, deterministic handling rules in Phase 4 that prevent false claims or fabricated data. Traceability to source OCR region IDs is maintained across all 9 fields. Phase 5 will consume these structured facts without needing to re-parse raw strings.
