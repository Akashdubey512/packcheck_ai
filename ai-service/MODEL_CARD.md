# Model Card: Multilingual RapidOCR Subsystem

## 1. Model Details
- **Primary Engine**: RapidOCR ONNX Runtime (DBNet text detection + MobileNetV3 CRNN text recognition).
- **Fallback Chain**: EasyOCR (PyTorch) $\rightarrow$ PyTesseract (Tesseract OCR Engine).
- **Target Languages**: English (`en`), Hindi / Devanagari (`hi`).
- **Input Format**: Grayscale / RGB preprocessed packaging image tensors.

---

## 2. Intended Use & Capabilities
- **Task**: Text region detection, multilingual text recognition, bounding box localization on retail product packaging labels.
- **Out of Scope**: Direct automated issuance of legal fines without human auditor review.

---

## 3. Performance Metrics
- **Text-Detected Image Rate**: **86.0%** across 100 validation packaging images.
- **Cold-Start Init Latency**: **356.68 ms**
- **Warm CPU Avg Latency**: **620.40 ms / image**
- **Warm CPU P95 Latency**: **1,080.00 ms / image**
- **Memory Footprint**: **56.66 MB**
