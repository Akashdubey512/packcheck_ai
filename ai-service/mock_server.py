"""
Temporary mock AI service for backend testing, before the real OCR/rule engine
is ready. Returns a fixed response matching docs/api-contract.md exactly.

Run:  uvicorn mock_server:app --reload --port 8000
"""
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import random

app = FastAPI(title="Mock AI Service")


class AnalyzeRequest(BaseModel):
    image_base64: str
    panel_width_cm: Optional[float] = None
    panel_height_cm: Optional[float] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    # Randomly toggle mfg_date/country_of_origin so you see both COMPLIANT
    # and NON_COMPLIANT results while testing, instead of always the same one.
    has_mfg_date = random.choice([True, False])
    has_country = random.choice([True, False])

    declarations = {
        "manufacturer_name_address": {"found": True, "value": "ABC Foods Pvt Ltd, Nagpur", "confidence": 0.91},
        "net_quantity": {"found": True, "value": "500 g", "confidence": 0.88},
        "mrp": {"found": True, "value": "₹120 (incl. of all taxes)", "confidence": 0.95},
        "mfg_date": {"found": has_mfg_date, "value": "08/2026" if has_mfg_date else None, "confidence": 0.85 if has_mfg_date else 0.0},
        "consumer_care": {"found": True, "value": "care@abcfoods.com, 1800-XXX-XXXX", "confidence": 0.80},
        "country_of_origin": {"found": has_country, "value": "India" if has_country else None, "confidence": 0.75 if has_country else 0.0},
        "generic_name": {"found": True, "value": "Refined Sunflower Oil", "confidence": 0.93},
        "unit_sale_price": {"found": False, "value": None, "confidence": 0.0},
    }

    violations = []
    if not has_mfg_date:
        violations.append("Month and Year of manufacture/packing not found")
    if not has_country:
        violations.append("Country of origin not declared")
    violations.append("Unit sale price not declared")

    return {
        "extracted_text": "MOCK OCR OUTPUT - replace with real OCR service",
        "declarations": declarations,
        "overall_status": "COMPLIANT" if not violations else "NON_COMPLIANT",
        "violations": violations,
    }
