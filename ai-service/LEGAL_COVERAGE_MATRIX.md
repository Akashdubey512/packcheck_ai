# Legal Metrology Rule Coverage Matrix

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  
**Version**: `2022.1`  
**Authority**: Department of Consumer Affairs, Ministry of Consumer Affairs, Food and Public Distribution, Government of India  

---

## 1. Comprehensive Legal Coverage Matrix

| Rule ID | Legal Source | Requirement Description | Field Name | Applicability | Automated | Partially Automated | Unsupported | Evidence Required | Implementation File | Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **LM-PC-MFR-001** | Rule 6(1)(a) | Manufacturer/Packer/Importer Name & Address | `manufacturer_name_address` | Mandatory | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-COO-001** | Rule 6(1)(b) | Country of Origin for Imported Goods | `country_of_origin` | Imported Goods | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-GEN-001** | Rule 6(1)(c) | Common or Generic Name of Commodity | `generic_name` | Mandatory | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-NET-001** | Rule 6(1)(d) | Net Quantity in Standard SI Units | `net_quantity` | Mandatory | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-MFG-001** | Rule 6(1)(e) | Month & Year of Mfg / Packing / Import | `manufacture_or_packing_date` | Mandatory | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-EXP-001** | Rule 6(1)(f) | Best Before / Expiry Date for Perishables | `expiry_or_use_by_date` | Perishables / Food | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-MRP-001** | Rule 6(1)(g) | MRP inclusive of all taxes | `mrp_inclusive_of_taxes` | Mandatory | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-CARE-001**| Rule 6(1)(h) | Consumer Care Contact (Phone, Email, Address)| `consumer_care_contact` | Mandatory | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-USP-001** | Rule 6(11) | Unit Sale Price per unit basis | `unit_sale_price` | Mandatory (2022) | **YES** | NO | NO | Text + BBox Crop | `ml/compliance/field_rules.py` | `tests/test_golden_rules.py` | **ACTIVE** |
| **LM-PC-FONT-001**| Schedule II | Minimum Height of Numerals (mm) | `numeral_height` | Mandatory | NO | NO | **YES** | Camera DPI Calibration | N/A | `tests/test_golden_rules.py` | `UNSUPPORTED_AUTOMATION` |
| **LM-PC-WEIGHT-001**| Section 36 | Actual Net Weight Verification | `actual_weight` | Mandatory | NO | NO | **YES** | Physical Weighing Scale | N/A | `tests/test_golden_rules.py` | `UNSUPPORTED_AUTOMATION` |

---

## 2. Categorization of Legal Automation Boundaries

1. **Automatically Verifiable Text Declarations**: All 9 mandatory text declarations (`manufacturer_name_address`, `country_of_origin`, `generic_name`, `net_quantity`, `manufacture_or_packing_date`, `expiry_or_use_by_date`, `mrp_inclusive_of_taxes`, `consumer_care_contact`, `unit_sale_price`).
2. **Requirements Requiring Physical Hardware Calibration (`UNSUPPORTED_AUTOMATION`)**: Physical numeral font height in mm (`LM-PC-FONT-001`) and physical scale weight balance (`LM-PC-WEIGHT-001`).
3. **Category-Specific Declarations**: Expiry date mandatory for perishable/food items; Country of Origin mandatory for imported goods.
