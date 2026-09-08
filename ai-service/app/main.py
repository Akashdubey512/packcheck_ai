"""
FastAPI Production Server & Legal Metrology Auditor API
Exposes production REST endpoints and serves the Web Auditor Dashboard interface.
"""

import os
import shutil
import tempfile
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends

from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse

from ml.security.upload_validator import validate_upload_file, SecurityValidationError
from ml.inspection.inspection_pipeline import MultiViewInspectionPipeline
from app.services.audit_trail import AuditTrailService

app = FastAPI(
    title="Legal Metrology Compliance Auditor API",
    description="Automated legal metrology compliance inspection system under Packaged Commodities Rules, 2011.",
    version="1.0.0"
)

import json

BASE_DIR = Path(__file__).resolve().parent.parent
SESSIONS_DIR = BASE_DIR / "processed_data" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# Pipeline & Audit Trail singletons
pipeline = MultiViewInspectionPipeline()
audit_service = AuditTrailService()

def save_session_to_disk(inspection_id: str, payload: dict):
    file_path = SESSIONS_DIR / f"{inspection_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

def get_session_from_disk(inspection_id: str) -> Optional[dict]:
    file_path = SESSIONS_DIR / f"{inspection_id}.json"
    if file_path.exists():
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return None

# Serve static dashboard
STATIC_DIR = Path(__file__).parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    """Serve the Web Auditor Dashboard UI."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>Legal Metrology Compliance Auditor API</h1>"

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "HEALTHY", "service": "legal_metrology_auditor", "version": "1.0.0"}

@app.get("/ready")
async def readiness_check():
    """Readiness probe endpoint."""
    return {"status": "READY", "pipeline_initialized": True}

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks

@app.post("/api/v1/inspect")
async def inspect_packages(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    """Inspect one or multiple package face images for legal compliance."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    temp_paths = []
    try:
        temp_dir = Path(tempfile.mkdtemp())
        for u_file in files:
            t_path = temp_dir / u_file.filename
            with open(t_path, "wb") as f:
                shutil.copyfileobj(u_file.file, f)
            
            # Security validation
            validate_upload_file(t_path)
            temp_paths.append(t_path)

        # Run multi-view inspection pipeline
        result = pipeline.inspect_images(temp_paths)
        res_dict = result.to_dict()
        background_tasks.add_task(save_session_to_disk, result.inspection_id, res_dict)
        return res_dict

    except SecurityValidationError as se:
        raise HTTPException(status_code=400, detail=f"Security Validation Error: {str(se)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection Error: {str(e)}")
    finally:
        # Cleanup temporary files
        for tp in temp_paths:
            if tp.exists():
                try:
                    tp.unlink()
                except Exception:
                    pass

@app.post("/api/v1/review")
async def submit_human_review(
    inspection_id: str,
    field_name: str,
    new_value: str,
    reason: str,
    user_role: str = "LEGAL_METROLOGY_OFFICER"
):
    """Submit a human auditor override event."""
    session_data = get_session_from_disk(inspection_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Inspection session not found.")
    
    event = audit_service.log_override(
        inspection_id=inspection_id,
        field_name=field_name,
        old_value=session_data["unified_facts"].get(field_name, {}).get("consensus_value"),
        new_value=new_value,
        reason=reason,
        user_role=user_role
    )
    return {"status": "SUCCESS", "event": event.to_dict()}

@app.get("/api/v1/report/pdf/{inspection_id}")
async def download_pdf_report(inspection_id: str):
    """Download official regulatory PDF compliance report."""
    session_data = get_session_from_disk(inspection_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Inspection session not found.")

    from reporting.pdf_exporter import generate_inspection_pdf
    pdf_path = generate_inspection_pdf(session_data)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Compliance_Report_{inspection_id}.pdf"
    )

import base64

class LegacyAnalyzeRequest(BaseModel):
    image_base64: str
    panel_width_cm: Optional[float] = None
    panel_height_cm: Optional[float] = None

@app.post("/analyze")
async def analyze_package_legacy(payload: LegacyAnalyzeRequest):
    """
    Backwards-compatible endpoint for Node.js backend per docs/api-contract.md.
    Accepts base64 image, processes through inspection pipeline, and returns contract JSON.
    """
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Missing image_base64 payload")

    temp_path = None
    try:
        raw_b64 = payload.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(raw_b64)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_bytes)
            temp_path = Path(tmp.name)

        validate_upload_file(temp_path)
        result = pipeline.inspect_images([temp_path])
        res_dict = result.to_dict()

        # Map to declarations dictionary required by docs/api-contract.md
        statutory_fields = [
            "manufacturer_name_address",
            "net_quantity",
            "mrp",
            "mfg_date",
            "consumer_care",
            "country_of_origin",
            "generic_name",
            "unit_sale_price",
        ]
        declarations = {}
        for fld in statutory_fields:
            item = res_dict.get("unified_facts", {}).get(fld, {})
            val = item.get("consensus_value")
            found = bool(val and str(val).strip())
            conf = float(item.get("mean_confidence", 0.85)) if found else 0.0
            declarations[fld] = {
                "found": found,
                "value": str(val) if found else None,
                "confidence": round(conf, 2)
            }

        violations = []
        for v in res_dict.get("compliance_result", {}).get("violations", []):
            if isinstance(v, dict):
                violations.append(v.get("message") or v.get("rule_name") or str(v))
            else:
                violations.append(str(v))

        raw_status = res_dict.get("overall_status", "NON_COMPLIANT")
        overall_status = "COMPLIANT" if raw_status in ("PASS", "COMPLIANT") else "NON_COMPLIANT"

        return {
            "extracted_text": "",
            "declarations": declarations,
            "overall_status": overall_status,
            "violations": violations
        }
    except SecurityValidationError as se:
        raise HTTPException(status_code=400, detail=f"Security error: {str(se)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        if temp_path and temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

