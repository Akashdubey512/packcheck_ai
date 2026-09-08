# Deployment & Infrastructure Guide

**Project**: Software System to Check Compliance of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011 (SIH 2026 PS ID 26034)  

---

## 1. Local Development Setup

```bash
# Clone repository & navigate to root
cd d:/sih_2026/

# Install dependencies
python -m pip install -r requirements.txt

# Run API server & web auditor UI
python -m app.main
```
Navigate to `http://127.0.0.1:8000` in browser.

---

## 2. Docker Container Deployment

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV & Tesseract
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-hin \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["python", "-m", "app.main"]
```

---

## 3. Health & Readiness Probes

- **Health Probe**: `GET /health` $\rightarrow$ Returns `{"status": "HEALTHY"}`
- **Readiness Probe**: `GET /ready` $\rightarrow$ Returns `{"status": "READY"}`
