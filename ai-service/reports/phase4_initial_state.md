# Phase 4 Initial State Assessment

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: 2026-09-08  
**Project Root**: `d:\sih_2026\`  
**Environment**: `d:\sih_2026\sih` (Python 3.13)  
**Phase Target**: Phase 4 – Mandatory Field Extraction + Value Normalization  

---

## 1. Current Architecture & Preserved State

- **Phase 1 Dataset Foundation (`v1.0.0`)**: 1,324 train, 164 val, 118 test image samples preserved in `processed_data/` with zero-leakage group allocation. Original datasets unchanged in `raw_data/`.
- **Phase 2 Preprocessing Pipeline**: Validated and benchmarked (12.92 ms latency, 100% validation success).
- **Phase 3 OCR Subsystem**: RapidOCR (ONNXRuntime DBNet + CRNN) primary engine with EasyOCR and PyTesseract fallbacks. Exposes `full_raw_text`, `full_normalized_text`, bounding boxes, polygon coordinates, and confidence per region.
- **Unit Test Suite**: 28 passed out of 28.

---

## 2. Legal Metrology Mandatory Field Definitions Source

Sourced directly from `raw_data/legal_metrology/legal_metrology_rules.json`:

1. `manufacturer_name_and_address` (Rule 6(1)(a)): Name and address of manufacturer, packer, or importer.
2. `country_of_origin` (Rule 6(1)(b)): Country of origin for imported commodities.
3. `common_generic_name` (Rule 6(1)(c)): Common or generic name of the commodity.
4. `net_quantity` (Rule 6(1)(d)): Net quantity in standard units of weight, measure, or number.
5. `manufacturing_packing_date` (Rule 6(1)(e)): Month and year of manufacture/packing/import.
6. `best_before_expiry` (Rule 6(1)(f)): Best before or use-by date/month/year.
7. `mrp` (Rule 6(1)(g)): Maximum Retail Price inclusive of all taxes.
8. `consumer_care_details` (Rule 6(1)(h)): Phone, email, address for consumer complaints.
9. `unit_sale_price` (Rule 6(11)): Unit sale price per g, kg, ml, l, or unit.

---

## 3. Dataset Annotation Gaps & Evaluation Strategy

- **Open Food Facts (India)**: Contains product metadata (barcode, product_name, brands, net_weight, quantity, categories). Can evaluate `net_quantity` and `common_generic_name` normalization.
- **SROIE Receipt Dataset**: Contains receipt total, date, merchant, and tax annotations.
- **Product Description OCR & Indian Scene Text**: Contain text transcripts, but lack structured 9-field Legal Metrology ground truth schemas.
- **Evaluation Rule**: Metric calculations will report `NOT_AVAILABLE` where field ground truth is absent. No fake ground truth or metrics will be fabricated.

---

## 4. Proposed Extraction & Normalization Architecture

```
PHASE 3 OCR RESULT (ML_CONTRACT.md Payload)
            ↓
CANDIDATE GENERATION (ml/extraction/candidates.py)
[Pattern regex, keyword signals, spatial proximity, OCR error variations]
            ↓
FIELD CLASSIFIER / SCORING (ml/extraction/classifier.py)
[Deterministic multi-signal scoring & multi-candidate ranking]
            ↓
VALUE EXTRACTION (ml/extraction/extractor.py)
[Specialized regex & structural parsers for MRP, Net Qty, Dates, Origin, Care, Mfg, Unit Price]
            ↓
VALUE NORMALIZATION (ml/extraction/normalizer.py)
[Canonical units (g, kg, ml, L), INR currency, ISO dates; preserves raw_text & raw_value]
            ↓
STRUCTURED PRODUCT FACTS (ml/extraction/pipeline.py -> ProductFacts)
[Traceable source_region_ids, source_text, source_bbox, field statuses]
            ↓
PHASE 5 COMPLIANCE ENGINE (Future Phase)
```

---

## 5. Strict Scope & Boundaries

1. **Extraction Only**: Phase 4 extracts facts and normalizes values.
2. **No Legal Decisions**: Phase 4 MUST NOT determine whether a product is compliant or non-compliant. Compliance decisions are strictly deferred to Phase 5.
3. **Traceability**: Every extracted field must link back to OCR `source_region_ids`, `source_text`, and `source_bbox`.
