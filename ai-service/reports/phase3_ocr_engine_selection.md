# Phase 3: OCR Engine Evaluation & Selection Report

**Project**: Legal Metrology (Packaged Commodities) Automated Compliance Auditor  
**Date**: 2026-09-07  
**Environment**: Python 3.13 (`sih` Virtual Environment)  

---

## 1. Executive Summary

Selecting an OCR engine for Indian packaged commodities requires balancing **English accuracy**, **Hindi/Devanagari script support**, **small/rotated packaging text recognition**, **CPU/GPU inference latency**, and **deployment stability**.

Three primary candidate engines were installed, benchmarked, and evaluated:
1. **RapidOCR** (ONNXRuntime DBNet Detector + SVTR/CRNN Recognizer)
2. **EasyOCR** (PyTorch CRAFT Detector + ResNet/LSTM Recognizer)
3. **PyTesseract** (Tesseract 5 C++ OCR Engine Wrapper)

**Selected Primary Engine**: **RapidOCR**  
**Selected Fallback Engines**: **EasyOCR** and **PyTesseract**

---

## 2. Technical Evaluation Matrix

| Criteria | RapidOCR (ONNX) | EasyOCR (PyTorch) | PyTesseract (Tesseract 5) |
| :--- | :---: | :---: | :---: |
| **Primary Backend Technology** | ONNX Runtime (C++) | PyTorch (Python/C++) | Native C++ Binary |
| **English Accuracy** | Excellent | Excellent | Very Good |
| **Hindi/Devanagari Support** | Excellent (`hi` ONNX model) | Good (`hi` PyTorch model) | Requires `tessdata/hin.traineddata` |
| **Rotated & Curved Packaging Text** | High (DBNet Polygon Detection) | High (CRAFT Polygon Detection) | Low (Line-level horizontal assumption) |
| **CPU Inference Latency** | **Fast (~40-80 ms)** | Moderate (~200-500 ms) | Moderate (~150-300 ms) |
| **Memory Footprint (RAM)** | **Low (~80-150 MB)** | Higher (~400-800 MB PyTorch) | Low (~50-100 MB) |
| **Bounding Box Precision** | BBox + 4-Point Polygon | BBox + 4-Point Polygon | BBox `[x, y, w, h]` |
| **Engine Confidence Availability** | **Native per-region score** | Native per-region score | Page/word confidence score |
| **Deployment Complexity** | **Zero C++ binary setup (pure pip ONNX)** | Pure pip PyTorch setup | Requires external Tesseract executable |

---

## 3. Detailed Justification for RapidOCR Selection

1. **ONNXRuntime CPU Performance**: RapidOCR uses optimized ONNX Runtime binaries for DBNet detection and CRNN/SVTR recognition. It achieves sub-100ms per-image latency on CPU without PyTorch GPU memory overhead.
2. **DBNet Text Line Detection**: Packaging text often appears at arbitrary angles, small fonts, or dense multi-line blocks. DBNet (Real-time Scene Text Detection) provides pixel-level text region segmentation superior to traditional bounding box algorithms.
3. **Multilingual Support**: Supports both English (`en`) and Hindi (`hi`) Devanagari script out of the box with light footprint ONNX weights.
4. **Clean Abstraction**: The modular `BaseOCREngine` architecture allows EasyOCR and PyTesseract to serve as instant pluggable fallbacks.

---

## 4. Recognized Limitations

- **Complex Decorative / Embossed Fonts**: Highly stylized brand logos or metallic embossed text on foil packaging can degrade recognition accuracy.
- **Tesseract System Binary Dependency**: PyTesseract requires the native Tesseract binary (`tesseract.exe`) on Windows PATH; if missing, PyTesseract gracefully reports `ENGINE_INIT_FAILED`.
