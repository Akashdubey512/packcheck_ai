# Legal Metrology Rule Coverage Matrix

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  
**Version**: `2022.1`  

---

## 1. Master Rule Coverage Matrix

| Rule ID | Legal Source | Requirement Description | Applicability | Implemented? | Validation Type | Evidence Type | Vision Req? | OCR Req? | Measure Req? | Status | Notes |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **LM-PC-MFR-001** | Rule 6(1)(a) | Manufacturer / Packer Name & Address | Mandatory | **YES** | Text Regex & NER | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Mandates complete name & address |
| **LM-PC-COO-001** | Rule 6(1)(b) | Country of Origin | Imported Goods | **YES** | Keyword & Regex | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Never inferred from brand/address |
| **LM-PC-GEN-001** | Rule 6(1)(c) | Common Generic Name | Mandatory | **YES** | Text & Dictionary | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Mandatory generic name declaration |
| **LM-PC-NET-001** | Rule 6(1)(d) | Net Quantity in Standard SI Units | Mandatory | **YES** | Unit Regex & Val | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Standard units (g, kg, ml, L, N) |
| **LM-PC-MFG-001** | Rule 6(1)(e) | Mfg / Packing Month & Year | Mandatory | **YES** | Date Parser & ISO | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Format: MM/YYYY or ISO |
| **LM-PC-EXP-001** | Rule 6(1)(f) | Best Before / Expiry Date | Perishables | **YES** | Date & Expiry Val | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Checked against Mfg date |
| **LM-PC-MRP-001** | Rule 6(1)(g) | MRP inclusive of all taxes | Mandatory | **YES** | Currency & Taxes | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Must include "incl. of all taxes" |
| **LM-PC-CARE-001**| Rule 6(1)(h) | Consumer Care Phone, Email, Address | Mandatory | **YES** | Contact Parser | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Requires telephone & email/address |
| **LM-PC-USP-001** | Rule 6(11) | Unit Sale Price per unit basis | Mandatory (2022) | **YES** | Price Basis Math | OCR Text + Crop | NO | **YES** | NO | **ACTIVE** | Mandatory w.e.f. Dec 1, 2022 |
| **LM-PC-FONT-001**| Schedule II | Minimum Height of Numerals | Mandatory | **NO** | Physical/Pixel | Image BBox Scale | **YES** | **YES** | **YES** | `UNSUPPORTED_AUTOMATION` | Requires physical package DPI calibration |
| **LM-PC-WEIGHT-001**| Section 36 | Actual Net Weight Verification | Mandatory | **NO** | Scale Measurement| Physical Balance | NO | NO | **YES** | `UNSUPPORTED_AUTOMATION` | Physical scale measurement required |

---

## 2. Automation Categorization Breakdown

1. **Fully Automatable via Text/OCR Evidence**: `LM-PC-MFR-001`, `LM-PC-COO-001`, `LM-PC-GEN-001`, `LM-PC-NET-001`, `LM-PC-MFG-001`, `LM-PC-EXP-001`, `LM-PC-MRP-001`, `LM-PC-CARE-001`, `LM-PC-USP-001`.
2. **Requires Physical Measurement / DPI Calibration (`UNSUPPORTED_AUTOMATION`)**: `LM-PC-FONT-001` (Numeral Height), `LM-PC-WEIGHT-001` (Physical Net Weight). Never fake validation for unsupported automation.
