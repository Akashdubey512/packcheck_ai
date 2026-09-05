"""
AI Service entrypoint (Sandeep & Gyanish).
Exposes POST /analyze per docs/api-contract.md.
This service must be stateless: no database access, image in -> JSON out.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Legal Metrology Compliance AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to BACKEND_ORIGIN before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    image_base64: str
    panel_width_cm: Optional[float] = None
    panel_height_cm: Optional[float] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    # 1. decode payload.image_base64 -> image (Gyanish: app/ocr/preprocess.py)
    # 2. run OCR -> list of {text, bbox, confidence} (Gyanish: app/ocr/ocr_engine.py)
    # 3. extract declarations from OCR output (Sandeep: app/extraction/declarations.py)
    # 4. run rule engine -> overall_status + violations (Sandeep: app/extraction/rule_engine.py)
    # 5. return JSON matching docs/api-contract.md exactly
    raise NotImplementedError("Wire up ocr + extraction pipeline here")
