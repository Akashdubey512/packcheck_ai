# Technical System Architecture

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  
**Version**: `1.0.0`  

---

## 1. High-Level Dataflow Architecture

```
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│   PACKAGE IMAGES       │───►│ PHASE 2: PREPROCESSING │───►│   PHASE 3: OCR ENGINE  │
│  (Front, Back, Sides)  │    │  Quality & Alignment   │    │ RapidOCR / EasyOCR / Py│
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
                                                                        │
                                                                        ▼
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│ PHASE 6: RULE ENGINE   │◄───│ PHASE 5: CONF & EVIDENCE│◄───│  PHASE 4: EXTRACTION   │
│ Versioned Legal Rules  │    │ Crops & SHA-256 Hash   │    │ 9 Mandatory Declarations│
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
            │
            ▼
┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│ MULTI-VIEW FUSION      │───►│ AUDITOR WEB DASHBOARD  │───►│ REGULATORY PDF REPORT  │
│ Contradiction Check    │    │ Human Override & Audit │    │ Compliance Inspection Report│
└────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

---

## 2. Architectural Boundaries & Guarantees

1. **Extraction vs Compliance Separation**: ML/CV/OCR models extract candidate text and bounding boxes. The Legal Rule Engine (`ml/compliance/`) is the sole component allowed to evaluate legal compliance verdicts (`COMPLIANT`, `NON_COMPLIANT`, `REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`).
2. **Uncertainty Protection**: Low OCR confidence, missing image faces, or unreadable text lead strictly to `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE`. Uncertainty is **never** converted into legal `NON_COMPLIANT`.
3. **Multi-View Consensus**: Cross-view fusion (`ml/inspection/cross_view_fusion.py`) verifies consistency of MRP, dates, quantities, and manufacturer details across multiple package faces. Contradictions trigger an immediate `REVIEW_REQUIRED` verdict.
4. **Audit Traceability**: Human auditor review overrides generate timestamped audit events with role attribution without overwriting original AI extraction results.
