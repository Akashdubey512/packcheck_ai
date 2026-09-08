# Phase 3 OCR Error Analysis & Field Extraction Risk Assessment

**Project**: Legal Metrology Packaged Commodities Compliance Auditor  
**Date**: 2026-09-07  
**Subsystem**: Phase 3 Text Detection & Recognition (OCR)  

---

## 1. Executive Summary

Packaging OCR operates under challenging real-world conditions (curved surfaces, metallic reflections, dense multi-lingual text, small font numerals, and decorative branding fonts). This report analyzes real-world OCR failure modes and assesses extraction risks for mandatory Legal Metrology declarations.

*Note: This report analyzes text recognition risks only and does NOT make legal compliance decisions.*

---

## 2. Qualitative Failure Mode Taxonomy

### 2.1 Optical & Physical Packaging Artifacts
1. **Glare & Metallic Reflections**: Glossy plastic wrappers and foil pouches reflect ambient light, blinding text detection boxes over mandatory declarations (e.g., MRP or Mfg Date).
2. **Curved Cylindrical Containers**: Bottled and canned products exhibit extreme perspective distortion along label edges, distorting bounding box geometry and word ordering.
3. **Low Contrast & Small Font Numeral Degradation**: Mandatory declarations (such as Unit Sale Price or Net Quantity) printed in tiny fonts (<2.5mm) on dark backgrounds degrade character recognition.

### 2.2 Script & Font Artifacts
1. **Devanagari Matra & Shirorekha Segmentation**: Continuous top bar (Shirorekha) in Hindi text can lead to multi-word line fragmentation or missegmentation of vowel glyphs (Matras).
2. **Decorative & Stylized Branding Fonts**: Brand logos and stylized font glyphs confuse general-purpose OCR models, leading to character hallucination.

### 2.3 Numeric & Formatting Ambiguities
1. **Character Confusion ('0' vs 'O', '1' vs 'I', '8' vs 'B')**:
   - Example: `MRP ₹ 249.OO` recognized instead of `MRP ₹ 249.00`.
   - Example: `NET WT 500g` recognized as `NET WT 5009`.

---

## 3. Legal Metrology Mandatory Declaration Risk Analysis

| Legal Metrology Field | Typical Packaging Pattern | Primary OCR Risk | Mitigation Strategy for Phase 4 |
| :--- | :--- | :--- | :--- |
| **Maximum Retail Price (MRP)** | `MRP Rs. 250.00 incl. of all taxes` | Confusion of `0`/`O`, missing rupee symbol `₹` or `Rs.` | Pattern-regex parser + numeric value validation in Phase 4 |
| **Net Quantity** | `Net Qty: 500 g` or `Net Weight: 1 L` | Unit misrecognition (`g` vs `9`, `ml` vs `m1`) | Standard unit validation (`g`, `kg`, `ml`, `l`, `m`, `u`) in Phase 4 |
| **Mfg / Packing Date** | `MFG DATE: 05/2026` or `PKD 05/26` | Date delimiter confusion (`/` vs `|` vs `.`) | Multi-format date regex parser (`MM/YYYY`, `MM/YY`, `MMM YYYY`) |
| **Best Before / Expiry** | `Best Before 6 Months from Mfg` | Multi-line text region fragmentation | Line region merging (`ml/ocr/region_merger.py`) |
| **Manufacturer Details** | `Mfd by: ABC Foods Ltd, Mumbai` | Name/Address text split across lines | Spatial reading order line grouping |
| **Country of Origin** | `Country of Origin: India` | Missing keyword detection | Keyword alias matching (`Made in India`, `Product of India`) |
| **Consumer Care Contact** | `Contact: 1800-123-456, care@brand.com` | Digit dropping in phone numbers, `@` to `a` in email | Dedicated regex validators for email and phone numbers |
| **Unit Sale Price** | `Unit Sale Price: Rs. 0.50 / g` | Decimal point misrecognition | Mathematical check ($USP = \frac{MRP}{NetQty}$) in Phase 4 |

---

## 4. Phase 4 Hand-off Safeguards

1. **Dual Text Preservation**: Downstream Phase 4 field extractors receive both `raw_text` and `normalized_text` from Phase 3.
2. **Explicit Confidence Passing**: OCR confidence values are forwarded directly without artificial thresholding or truncation.
3. **No Automatic Autocorrection**: Phase 3 does NOT automatically convert `249.OO` to `249.00`; the raw evidence is preserved for the Phase 4 Legal Rule Engine.
