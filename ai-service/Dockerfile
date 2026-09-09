# Multi-stage Dockerfile for PackCheck AI Microservice (FastAPI & OCR Pipeline)
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000 \
    HOST=0.0.0.0

# Install system OCR & Computer Vision dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create unprivileged runtime user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/processed_data /app/reports && \
    chown -R appuser:appuser /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python codebase
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser ml ./ml
COPY --chown=appuser:appuser reporting ./reporting
COPY --chown=appuser:appuser configs ./configs

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/ready || exit 1

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
