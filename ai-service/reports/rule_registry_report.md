# Legal Metrology Versioned Rule Registry Report

## Executive Summary
This report documents the design, structure, and operational verification of the **Versioned Legal Metrology Rule Registry** implemented in Phase 6 of the SIH 2026 Legal Metrology Packaged Commodity Compliance System.

The Rule Registry acts as the single authoritative source of structured legal rules derived directly from the **Legal Metrology (Packaged Commodities) Rules, 2011** (including amendments up to 2022).

---

## 1. Governance & Versioning Architecture

| Governance Property | Value |
| :--- | :--- |
| **Active Registry Version** | `2022.1` |
| **Legal Basis** | Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011 |
| **Source Rule File** | [`raw_data/legal_metrology/legal_metrology_rules.json`](file:///d:/sih_2026/raw_data/legal_metrology/legal_metrology_rules.json) |
| **Loader Module** | [`ml/compliance/rule_loader.py`](file:///d:/sih_2026/ml/compliance/rule_loader.py) |
| **Registry Module** | [`ml/compliance/rule_registry.py`](file:///d:/sih_2026/ml/compliance/rule_registry.py) |
| **Effective Date Support** | Supported (`2022-01-01` active) |
| **Deprecation Support** | Supported (`deprecated` field flag) |

---

## 2. Core Mandatory Rules Registry (9 Mandatory Declarations)

| Rule ID | Canonical Field Name | Legal Section / Rule | Validation Type | Severity | Evidence Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `LM_RULE_001` | `manufacturer_name_address` | Rule 6(1)(a) | `PRESENT` | `HIGH` | `True` |
| `LM_RULE_002` | `country_of_origin` | Rule 6(1)(b) | `PRESENT` | `HIGH` | `True` |
| `LM_RULE_003` | `generic_name` | Rule 6(1)(c) | `PRESENT` | `MEDIUM` | `True` |
| `LM_RULE_004` | `net_quantity` | Rule 6(1)(d) | `INVALID_FORMAT` | `HIGH` | `True` |
| `LM_RULE_005` | `manufacture_or_packing_date` | Rule 6(1)(e) | `INVALID_FORMAT` | `HIGH` | `True` |
| `LM_RULE_006` | `expiry_or_use_by_date` | Rule 6(1)(f) | `INVALID_FORMAT` | `MEDIUM` | `True` |
| `LM_RULE_007` | `mrp_inclusive_of_taxes` | Rule 6(1)(g) | `INVALID_VALUE` | `HIGH` | `True` |
| `LM_RULE_008` | `consumer_care_contact` | Rule 6(1)(h) | `PRESENT` | `HIGH` | `True` |
| `LM_RULE_009` | `unit_sale_price` | Rule 6(1)(11) | `INVALID_VALUE` | `MEDIUM` | `True` |

---

## 3. Rule Schema Specification

Every registered legal rule complies with the following strict dataclass schema ([`ml/compliance/rule_schema.py`](file:///d:/sih_2026/ml/compliance/rule_schema.py)):

```json
{
  "rule_id": "LM_RULE_007",
  "source": "Legal Metrology (Packaged Commodities) Rules, 2011",
  "source_title": "Declarations to be made on every package",
  "rule_version": "2022.1",
  "effective_date": "2022-01-01",
  "field": "mrp_inclusive_of_taxes",
  "requirement": "Maximum Retail Price (MRP) must be clearly printed inclusive of all taxes in Indian Rupees (₹).",
  "applicability": "ALL_PACKAGED_COMMODITIES",
  "validation_type": "INVALID_VALUE",
  "severity": "HIGH",
  "explanation": "Maximum Retail Price (MRP) declaration is mandatory under Rule 6(1)(g).",
  "evidence_requirement": true,
  "deprecated": false
}
```

---

## 4. Architectural Rules & Safeguards

1. **Zero Hardcoded Rules**: Python code contains no hardcoded legal text or thresholds; all rules are loaded dynamically from structured versioned JSON files.
2. **Version Awareness**: Historical rules, current rules, and future rule amendments are dynamically filtered based on package context timestamps.
3. **Traceability**: Every rule evaluation attaches the exact `rule_id`, `rule_version`, and legal citation to the final `ComplianceResult`.
