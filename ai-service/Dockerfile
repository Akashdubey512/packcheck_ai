# Multi-stage Dockerfile for PackCheck AI Microservice (FastAPI & OCR Pipeline)
# Stage 1: Build & Python dependency installation
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install build & system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production runtime stage
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    OMP_NUM_THREADS=2 \
    ONNXRUNTIME_NUM_THREADS=2 \
    PORT=8000 \
    HOST=0.0.0.0

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed python site-packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

WORKDIR /app

# Create unprivileged runtime user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/processed_data/sessions /app/reports /home/appuser/.cache /home/appuser/.rapidocr && \
    chown -R appuser:appuser /app /home/appuser

# Copy application codebase
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser ml ./ml
COPY --chown=appuser:appuser reporting ./reporting
COPY --chown=appuser:appuser configs ./configs
COPY --chown=appuser:appuser scripts ./scripts

# Switch to unprivileged user and pre-bake model weights into container image layer
USER appuser
RUN python scripts/pre_download_models.py

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/ready || exit 1

# Launch production server with multi-worker concurrency
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
