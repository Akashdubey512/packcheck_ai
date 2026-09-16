# Optimized Production Dockerfile for PackCheck AI Microservice (FastAPI & RapidOCR)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    OMP_NUM_THREADS=1 \
    ONNXRUNTIME_NUM_THREADS=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install runtime system dependencies (Tesseract C++ & image processing libraries)
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

# Create unprivileged runtime user and necessary cache directories
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/processed_data/sessions /app/reports /home/appuser/.cache /home/appuser/.rapidocr && \
    chown -R appuser:appuser /app /home/appuser

# Copy application codebase
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser ml ./ml
COPY --chown=appuser:appuser reporting ./reporting
COPY --chown=appuser:appuser configs ./configs
COPY --chown=appuser:appuser scripts ./scripts
COPY --chown=appuser:appuser raw_data/legal_metrology ./raw_data/legal_metrology

# Switch to unprivileged user
USER appuser

# Pre-warm RapidOCR models during build (failsafe: never abort build if network is restricted)
RUN python scripts/pre_download_models.py || true

EXPOSE 8000

# Health check using fast /health liveness probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Launch production server with dynamic port and configurable concurrency
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers ${UVICORN_WORKERS:-1}"]
