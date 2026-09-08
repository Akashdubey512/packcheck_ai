# Dataset Card: Legal Metrology Packaged Commodities Benchmark (SIH 2026 v1.0.0)

## 1. Dataset Details
- **Dataset Name**: Legal Metrology Packaged Commodities Multi-Source Benchmark Dataset
- **Version**: `1.0.0`
- **Release Date**: September 2026
- **Primary Task**: Document Analysis, Multilingual OCR, Mandatory Legal Declaration Field Extraction, and Legal Metrology Compliance Verification.
- **Maintainers**: SIH 2026 Development Team (PS ID 26034)

---

## 2. Sources & Licensing
- **Open Food Facts (India)**: Public API product packaging images (`https://in.openfoodfacts.org/`). License: Open Database License (ODbL).
- **Product Description OCR**: Indian retail product packaging images. `LICENSE_STATUS = NOT_AVAILABLE`.
- **Indian Scene Text Dataset**: Indian storefronts and packaging text. `LICENSE_STATUS = NOT_AVAILABLE`.
- **Label Extraction ViT**: Packaging label images. `LICENSE_STATUS = NOT_AVAILABLE`.
- **SROIE & CORD-v2**: Standard document/receipt datasets used for auxiliary receipt and layout OCR validation. Licenses: Public research benchmarks.

---

## 3. Dataset Composition
- **Total Image Samples**: **1,606 canonical samples**
- **Format**: JPEG, PNG
- **Resolution**: Ranging from 320x240 to 4032x3024 pixels
- **Languages**: English (`en`), Hindi / Devanagari (`hi`), Kannada, Tamil, Marathi
- **Product Categories**: Packaged FMCG food products, beverages, cosmetics, personal care items, household commodities.

---

## 4. Split & Leakage Strategy
- **Train Split**: 1,324 samples (82.44%)
- **Validation Split**: 164 samples (10.21%)
- **Test Split**: 118 samples (7.35%)
- **Total**: **1,606 samples**
- **Leakage Prevention**: Grouped split assignment ensuring images of identical products or source batches are strictly restricted to a single split.

---

## 5. Known Limitations & Biases
1. **Single-View Dominance in Legacy Subsets**: Legacy public subsets primarily provide front-of-pack images. Multi-view packaging (front + back + sides) is required for 100% legal verification.
2. **Lighting Variations**: Presence of severe glare, reflections, and curved packaging surfaces in real retail captures.
3. **No Metric Fabrication**: Ground truth text region bounding boxes and legal compliance labels are `NOT_AVAILABLE` for certain raw public subsets; metrics are evaluated strictly where GT is present.

---

## 6. Intended & Prohibited Use
- **Intended Use**: Academic research, automated legal compliance auditing support, demonstration for SIH 2026.
- **Prohibited Use**: Automated issuance of legally binding regulatory penalties without human officer verification.
