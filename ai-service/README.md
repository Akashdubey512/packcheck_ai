# Legal Metrology Packaged Commodity Automated Compliance Auditor (SIH 2026 PS ID 26034)

[![Python Version](https://img.shields.io/badge/Python-3.9%20%7C%203.13-blue.svg)](https://www.python.org/)
[![System Status](https://img.shields.io/badge/Status-Hardened%20%26%20Production--Ready-brightgreen.svg)]()
[![Test Suite](https://img.shields.io/badge/Tests-95%2F95%20Passed-success.svg)]()

Production-oriented, scientifically evaluated, auditable, multi-view packaged-commodity legal metrology compliance system built for **Smart India Hackathon 2026 (PS ID 26034)**.

---

## 🌟 Key Features & Architectural Highlights

1. **Multi-View Inspection Engine (`ml/inspection/`)**: Supports multi-image package face inspection (Front, Back, Sides, Top, Bottom), cross-view candidate fusion, and contradiction detection (e.g. MRP 120 on front vs 150 on back).
2. **Deterministic Legal Metrology Rule Engine (`ml/compliance/`)**: Versioned registry (`2022.1`) implementing all mandatory declaration rules under the Legal Metrology (Packaged Commodities) Rules, 2011 & amendments (2017, 2021, 2022).
3. **Strict Separation of Layers**:
   - **ML/CV/OCR**: Extracts text and visual candidate evidence.
   - **Rule Engine**: Evaluates legal compliance deterministically.
   - **Human Auditor**: Resolves ambiguity via an interactive Web Auditor Dashboard with full audit logging.
4. **Zero Metric Fabrication Guarantee**: Unmeasured metrics return `NOT_AVAILABLE`. Extraction uncertainty or unreadable OCR translates to `REVIEW_REQUIRED` or `INSUFFICIENT_EVIDENCE`, **never** `NON_COMPLIANT`.
5. **Interactive Web Auditor Dashboard (`app/`)**: Modern dark-mode web application (FastAPI + HTML/JS) rendering image previews, detected OCR bounding box overlays, rule outcomes, human review overrides, and regulatory PDF export.
6. **Regulatory PDF Exporter (`reporting/`)**: Exports official "Legal Metrology Compliance Inspection Report" certificates with visual evidence crops and SHA-256 provenance hashes.
7. **Security & Upload Protection (`ml/security/`)**: Enforces max file size limits (20MB), max resolution caps (50MP decompression bomb guard), path traversal sanitization, and MIME structure validation.

---

## 🚀 Quick Start Guide

### 1. Environment Setup
```bash
# Using Python environment
python -m pip install -r requirements.txt
```

### 2. Run Test Suite
```bash
python -m unittest discover -s tests
```

### 3. Run Master Evaluation & Benchmarks
```bash
python scripts/evaluate_full_system.py
```

### 4. Launch Auditor Web Dashboard & API Server
```bash
python -m app.main
```
Open browser at `http://127.0.0.1:8000` to access the Web Auditor Dashboard.

---

## 📂 Project Architecture

```
d:\sih_2026\
├── app/                      # FastAPI API server & Auditor Web UI
├── configs/                  # Yaml pipeline configurations
├── data/ground_truth/        # Ground Truth dataset schema & validator
├── ml/
│   ├── preprocessing/        # Image quality assessment & adaptive preprocessing
│   ├── ocr/                  # Multilingual RapidOCR, EasyOCR & PyTesseract engines
│   ├── extraction/           # 9 Mandatory field candidate extractors & normalizers
│   ├── confidence/           # Multi-factor confidence, evidence crops, SHA-256 provenance
│   ├── compliance/           # Versioned Legal Metrology rule engine & decision hierarchy
│   ├── inspection/           # Multi-view session management & cross-view candidate fusion
│   └── security/             # Security file upload validator & path traversal sanitizer
├── raw_data/                 # Canonical 1,606 dataset storage & legal rules JSON
├── processed_data/           # Reconciled splits (train/val/test) & evidence crops
├── reporting/                # Regulatory PDF compliance report generator
├── reports/                  # Evaluation benchmarks, audit reports, master gap analysis
├── scripts/                  # Evaluation & benchmark execution scripts
└── tests/                    # 95 unit, integration, contract, security & API tests
```

---

## 📜 Documentation Index
- [ARCHITECTURE.md](file:///d:/sih_2026/ARCHITECTURE.md): Full system technical architecture
- [DEPLOYMENT.md](file:///d:/sih_2026/DEPLOYMENT.md): Deployment & Docker setup guide
- [DATASET_CARD.md](file:///d:/sih_2026/DATASET_CARD.md): Dataset card & split integrity
- [MODEL_CARD.md](file:///d:/sih_2026/MODEL_CARD.md): Model cards & OCR backend specs
- [LEGAL_RULES.md](file:///d:/sih_2026/LEGAL_RULES.md): Legal rule coverage matrix
- [API.md](file:///d:/sih_2026/API.md): API contract specification
- [SECURITY.md](file:///d:/sih_2026/SECURITY.md): Security & privacy safeguards
- [LIMITATIONS.md](file:///d:/sih_2026/LIMITATIONS.md): Operational limitations & legal boundaries
