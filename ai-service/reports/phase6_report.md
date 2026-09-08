# Phase 6 Legal Metrology Rule Engine & Compliance Decision Layer Report

## Executive Summary
Phase 6 implements the **Legal Metrology Rule Engine & Compliance Decision Layer** for the Smart India Hackathon 2026 project.

Phase 6 is the **FIRST AND ONLY phase allowed to make legal compliance decisions** (`COMPLIANT`, `NON_COMPLIANT`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`). ML layers (Phases 2–5) strictly extract facts, calculate confidence, and preserve evidence, but **NEVER directly output legal compliance**.

---

## 1. Architectural Flow

```
IMAGE
  ↓
Phase 2: Image Quality Assessment & Adaptive Preprocessing
  ↓
Phase 3: Text Detection & RapidOCR Engine
  ↓
Phase 4: 9 Mandatory Field Extraction & Standard Normalization
  ↓
Phase 5: Confidence Scoring, Uncertainty, Evidence Crops & SHA-256 Provenance
  ↓
Phase 6: LEGAL METROLOGY RULE ENGINE (ml/compliance/)
  ├── Versioned Legal Rule Registry (Rule 6, Legal Metrology Rules, 2011/2022)
  ├── Rule Applicability Engine
  ├── Specialized Field Validators (MRP, Net Qty, Dates, Address, Country)
  ├── Contradiction & Ambiguity Engine
  ├── Compliance Decision Model
  ├── Evidence-Backed Explanation Generator
  └── Cryptographic Provenance Tracker
  ↓
FINAL COMPLIANCE RESULT
(COMPLIANT / NON_COMPLIANT / REVIEW_REQUIRED / INSUFFICIENT_EVIDENCE)
```

---

## 2. Implementation Summary

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Types & Schemas** | [`ml/compliance/types.py`](file:///d:/sih_2026/ml/compliance/types.py) | `ComplianceResult`, `FieldRuleOutcome`, `ViolationItem`, `ReviewItem`, `ComplianceProvenance` |
| **Exceptions** | [`ml/compliance/exceptions.py`](file:///d:/sih_2026/ml/compliance/exceptions.py) | Hierarchy of rule evaluation & compliance exceptions |
| **Rule Schema** | [`ml/compliance/rule_schema.py`](file:///d:/sih_2026/ml/compliance/rule_schema.py) | Dataclass schema for Legal Metrology rules |
| **Rule Loader** | [`ml/compliance/rule_loader.py`](file:///d:/sih_2026/ml/compliance/rule_loader.py) | Dynamic JSON parser for legal rule data |
| **Rule Registry** | [`ml/compliance/rule_registry.py`](file:///d:/sih_2026/ml/compliance/rule_registry.py) | Versioned registry (`2022.1`) supporting effective dates & deprecations |
| **Applicability Engine** | [`ml/compliance/applicability.py`](file:///d:/sih_2026/ml/compliance/applicability.py) | Evaluates rule applicability (`APPLICABLE`, `NOT_APPLICABLE`, `UNKNOWN`) |
| **Field Validators** | [`ml/compliance/validators.py`](file:///d:/sih_2026/ml/compliance/validators.py) | Specialized legal validators for all 9 mandatory fields |
| **Field Rules Evaluator**| [`ml/compliance/field_rules.py`](file:///d:/sih_2026/ml/compliance/field_rules.py) | Evaluates individual LegalRules against audited product facts |
| **Consistency Checker** | [`ml/compliance/consistency.py`](file:///d:/sih_2026/ml/compliance/consistency.py) | Contradiction engine for multi-candidate conflicts |
| **Decision Engine** | [`ml/compliance/decision.py`](file:///d:/sih_2026/ml/compliance/decision.py) | Synthesizes field outcomes into overall compliance status |
| **Explanation Engine** | [`ml/compliance/explanations.py`](file:///d:/sih_2026/ml/compliance/explanations.py) | Generates evidence-backed human-readable explanations |
| **Provenance Tracker** | [`ml/compliance/provenance.py`](file:///d:/sih_2026/ml/compliance/provenance.py) | SHA-256 cryptographic provenance & version manifest builder |
| **Compliance Pipeline**| [`ml/compliance/pipeline.py`](file:///d:/sih_2026/ml/compliance/pipeline.py) | End-to-end Phase 6 compliance processing engine |

---

## 3. Key Measured Metrics & Benchmarks

All metrics below are strictly measured from real code execution without GT fabrication.

### Evaluation Metrics ([`reports/phase6_evaluation.json`](file:///d:/sih_2026/reports/phase6_evaluation.json))
- **Images Evaluated**: 49 validation images
- **Legal Accuracy**: `NOT_AVAILABLE` (Ground-truth legal compliance labels do not exist in dataset v1.0.0; 0 fabrication)
- **Deterministic Decision Consistency**: `100.0%` (100% reproducible outcomes under identical facts and rule version)
- **Evidence Crop Coverage**: `50.0%`
- **Contradiction Rate**: `8.16%`
- **Review Required Rate**: `0.0%` (on 49 validation images)

### Performance Benchmarks ([`reports/phase6_benchmark.json`](file:///d:/sih_2026/reports/phase6_benchmark.json))

| Benchmark Scope | Average Latency | Median Latency | P95 Latency | Throughput | Memory Delta |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 6 Standalone** | **0.10 ms** | **0.06 ms** | **0.38 ms** | **9,955 items/sec** | **+0.02 MB** |
| **Phase 4+5+6 Combined**| **9.73 ms** | **1.56 ms** | **62.01 ms** | **102 items/sec** | **+0.04 MB** |
| **Full E2E Pipeline (P2–P6)**| **630.34 ms** | **608.19 ms** | **1,144.54 ms** | **1.59 items/sec** | **+3.61 MB** |

---

## 4. Test Suite Execution & Acceptance Verification

- **Total Test Cases**: 86
- **Passed**: 86 (100% Pass Rate)
- **Failed**: 0
- **Errors**: 0
- **Execution Time**: ~0.85 seconds

```bash
d:\sih_2026\sih\Scripts\python.exe -m unittest discover -s tests
......................................................................................
----------------------------------------------------------------------
Ran 86 tests in 0.855s

OK
```
