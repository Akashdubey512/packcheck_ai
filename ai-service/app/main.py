import os
import shutil
import tempfile
import asyncio
import copy
import hashlib
from collections import OrderedDict
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
import uuid
import json

from ml.security.upload_validator import validate_upload_file, SecurityValidationError
from ml.inspection.inspection_pipeline import MultiViewInspectionPipeline
from app.services.audit_trail import AuditTrailService

BASE_DIR = Path(__file__).resolve().parent.parent
SESSIONS_DIR = BASE_DIR / "processed_data" / "sessions"
SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# Pipeline & Audit Trail singletons
pipeline = MultiViewInspectionPipeline()
audit_service = AuditTrailService()

# In-memory LRU Response Cache for high-performance duplicate/preset inspection calls
_MAX_CACHE_SIZE = 128
_INSPECTION_CACHE: "OrderedDict[str, dict]" = OrderedDict()
_LEGACY_CACHE: "OrderedDict[str, dict]" = OrderedDict()
_CACHE_LOCK = asyncio.Lock()
IS_READY = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Production lifespan handler.
    Pre-warms OCR models and pipeline weights on startup so zero first-request latency occurs.
    """
    global IS_READY
    try:
        from PIL import Image
        warmup_img = Image.new("RGB", (160, 160), color=(255, 255, 255))
        # Warmup in worker thread
        await asyncio.to_thread(pipeline.inspect_images, [warmup_img], inspection_id="STARTUP_WARMUP")
        IS_READY = True
    except Exception as err:
        print(f"[!] Warning during startup warmup: {err}")
        IS_READY = True
    yield
    # Shutdown hook
    _INSPECTION_CACHE.clear()
    _LEGACY_CACHE.clear()

app = FastAPI(
    title="Legal Metrology Compliance Auditor API",
    description="Automated legal metrology compliance inspection system under Packaged Commodities Rules, 2011.",
    version="1.0.0",
    lifespan=lifespan
)

def compute_files_hash(file_paths: List[Path]) -> str:
    """Compute deterministic SHA-256 digest of input files."""
    hasher = hashlib.sha256()
    for fp in sorted(file_paths, key=lambda p: p.name):
        with open(fp, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
    return hasher.hexdigest()

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
    """Liveness probe endpoint."""
    return {"status": "HEALTHY", "service": "legal_metrology_auditor", "version": "1.0.0"}

@app.get("/ready")
async def readiness_check():
    """Readiness probe endpoint for orchestration and load balancers."""
    if not IS_READY:
        raise HTTPException(status_code=503, detail="Model pipeline warming up")
    return {
        "status": "READY",
        "pipeline_initialized": True,
        "cache_entries": len(_INSPECTION_CACHE)
    }

@app.post("/api/v1/inspect")
async def inspect_packages(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    x_request_id: Optional[str] = Header(None, alias="X-Request-ID"),
    x_inspection_id: Optional[str] = Header(None, alias="X-Inspection-ID")
):
    """Inspect one or multiple package face images for legal compliance."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")

    request_id = x_request_id or f"req_{uuid.uuid4().hex[:12]}"
    temp_paths = []
    try:
        temp_dir = Path(tempfile.mkdtemp())
        for u_file in files:
            safe_name = Path(u_file.filename).name
            t_path = temp_dir / safe_name
            with open(t_path, "wb") as f:
                shutil.copyfileobj(u_file.file, f)
            
            # Security validation
            validate_upload_file(t_path)
            temp_paths.append(t_path)

        client_inspection_id = x_inspection_id
        final_inspection_id = client_inspection_id or f"INSP_{uuid.uuid4().hex[:8].upper()}"

        # In-Memory Cache check for duplicate/sample requests
        cache_key = compute_files_hash(temp_paths)
        cached_result = None
        async with _CACHE_LOCK:
            if cache_key in _INSPECTION_CACHE:
                cached_result = copy.deepcopy(_INSPECTION_CACHE[cache_key])
                _INSPECTION_CACHE.move_to_end(cache_key)

        if cached_result:
            cached_result["requestId"] = request_id
            cached_result["request_id"] = request_id
            cached_result["inspectionId"] = final_inspection_id
            cached_result["inspection_id"] = final_inspection_id
            cached_result["cached"] = True
            save_session_to_disk(final_inspection_id, cached_result)
            return cached_result

        # Run multi-view inspection pipeline asynchronously in worker thread
        result = await asyncio.to_thread(pipeline.inspect_images, temp_paths, inspection_id=final_inspection_id)
        res_dict = result.to_dict()

        # Build canonical fields map for cross-service consistency
        canonical_fields = {}
        field_mapping = {
            "mrp": ["mrp", "MRP"],
            "net_quantity": ["net_quantity", "netQuantity"],
            "mfg_date": ["mfg_date", "manufactureDate"],
            "packing_date": ["packing_date", "packingDate"],
            "import_date": ["import_date", "importDate"],
            "manufacturer_name_address": ["manufacturer_name_address", "manufacturer"],
            "packer": ["packer"],
            "importer": ["importer"],
            "consumer_care": ["consumer_care", "consumerCare"],
            "country_of_origin": ["country_of_origin", "countryOfOrigin"],
            "generic_name": ["generic_name", "genericName"],
            "unit_sale_price": ["unit_sale_price", "unitSalePrice"],
            "best_before": ["best_before", "bestBefore"],
            "expiry_date": ["expiry_date", "expiryDate"]
        }

        field_lookups = {
            "mrp": ["mrp", "mrp_inclusive_of_taxes"],
            "net_quantity": ["net_quantity"],
            "mfg_date": ["manufacturing_packing_date", "manufacture_or_packing_date", "mfg_date"],
            "packing_date": ["packing_date", "manufacturing_packing_date", "manufacture_or_packing_date"],
            "import_date": ["import_date"],
            "manufacturer_name_address": ["manufacturer_name_and_address", "manufacturer_name_address", "manufacturer"],
            "packer": ["packer", "manufacturer_name_and_address", "manufacturer_name_address"],
            "importer": ["importer"],
            "consumer_care": ["consumer_care_details", "consumer_care_contact", "consumer_care"],
            "country_of_origin": ["country_of_origin"],
            "generic_name": ["common_generic_name", "generic_name"],
            "unit_sale_price": ["unit_sale_price"],
            "best_before": ["best_before_expiry", "expiry_or_use_by_date", "best_before"],
            "expiry_date": ["best_before_expiry", "expiry_or_use_by_date", "expiry_date"]
        }

        for base_key, aliases in field_mapping.items():
            lookups = field_lookups.get(base_key, [base_key])
            fact_item = {}
            for lk in lookups:
                cand_fact = res_dict.get("unified_facts", {}).get(lk)
                if cand_fact and cand_fact.get("consensus_value"):
                    fact_item = cand_fact
                    break

            val = fact_item.get("consensus_value") if isinstance(fact_item, dict) else None
            conf = float(fact_item.get("mean_confidence", fact_item.get("confidence", 0.0))) if isinstance(fact_item, dict) else 0.0
            status_val = "CONFIDENT" if val and conf >= 0.70 else ("UNCERTAIN" if val else "MISSING")

            field_obj = {
                "fieldName": aliases[0],
                "rawValue": str(val) if val is not None else "",
                "normalizedValue": str(val) if val is not None else "",
                "confidence": round(conf, 4),
                "status": status_val,
                "evidence": fact_item.get("candidate_sources", []) if isinstance(fact_item, dict) else []
            }
            for alias in aliases:
                canonical_fields[alias] = field_obj

        res_dict["fields"] = canonical_fields
        res_dict["requestId"] = request_id
        res_dict["request_id"] = request_id
        res_dict["inspectionId"] = final_inspection_id
        res_dict["inspection_id"] = final_inspection_id
        res_dict["status"] = result.overall_status
        res_dict["modelVersion"] = "1.2.3"
        res_dict["ruleVersion"] = "PCR-2011.v2"
        res_dict["humanReview"] = []
        res_dict["cached"] = False

        # Store in LRU cache
        async with _CACHE_LOCK:
            _INSPECTION_CACHE[cache_key] = copy.deepcopy(res_dict)
            if len(_INSPECTION_CACHE) > _MAX_CACHE_SIZE:
                _INSPECTION_CACHE.popitem(last=False)

        save_session_to_disk(final_inspection_id, res_dict)
        if final_inspection_id != result.inspection_id:
            save_session_to_disk(result.inspection_id, res_dict)

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
    """Submit a human auditor override event with compliance re-evaluation."""
    session_data = get_session_from_disk(inspection_id)
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Inspection session '{inspection_id}' not found.")

    old_val = session_data.get("unified_facts", {}).get(field_name, {}).get("consensus_value")
    event = audit_service.log_override(
        inspection_id=inspection_id,
        field_name=field_name,
        old_value=old_val,
        new_value=new_value,
        reason=reason,
        user_role=user_role
    )

    # Update session data
    if "unified_facts" not in session_data:
        session_data["unified_facts"] = {}
    if field_name not in session_data["unified_facts"]:
        session_data["unified_facts"][field_name] = {"field_name": field_name}
    
    session_data["unified_facts"][field_name]["consensus_value"] = new_value
    session_data["unified_facts"][field_name]["confidence"] = 1.0
    session_data["unified_facts"][field_name]["is_contradictory"] = False

    # Also update canonical fields
    if "fields" in session_data:
        if field_name in session_data["fields"]:
            session_data["fields"][field_name]["rawValue"] = new_value
            session_data["fields"][field_name]["normalizedValue"] = new_value
            session_data["fields"][field_name]["confidence"] = 1.0
            session_data["fields"][field_name]["status"] = "CONFIDENT"

    if "humanReview" not in session_data:
        session_data["humanReview"] = []
    session_data["humanReview"].append(event.to_dict())

    # Re-evaluate compliance result
    try:
        from ml.extraction.types import ProductFacts
        synthetic_facts = ProductFacts(product_id=inspection_id)
        audited_facts = pipeline.conf_pipe.process(synthetic_facts, image_input=None, ocr_result=None)
        for k, v in session_data["unified_facts"].items():
            if k in audited_facts.fields:
                c_val = v.get("consensus_value")
                audited_facts.fields[k].raw_value = str(c_val) if c_val is not None else ""
                audited_facts.fields[k].raw_text = str(c_val) if c_val is not None else ""
                if c_val:
                    audited_facts.fields[k].status = "CONFIDENT"

        comp_res = pipeline.comp_pipe.evaluate(audited_facts)
        session_data["compliance_result"] = comp_res.to_dict()
        session_data["overall_status"] = session_data["compliance_result"].get("overall_status", "COMPLIANT")
        session_data["status"] = session_data["overall_status"]
    except Exception as re_err:
        print(f"Compliance re-evaluation error: {re_err}")

    # Persist updated session
    save_session_to_disk(inspection_id, session_data)

    return {
        "status": "SUCCESS",
        "event": event.to_dict(),
        "inspection": session_data
    }


@app.get("/api/v1/report/pdf/{inspection_id}")
async def download_pdf_report(inspection_id: str):
    """Download official regulatory PDF compliance report."""
    session_data = get_session_from_disk(inspection_id)
    if not session_data:
        raise HTTPException(status_code=404, detail=f"Inspection session '{inspection_id}' not found.")

    from reporting.pdf_exporter import generate_inspection_pdf
    pdf_path = generate_inspection_pdf(session_data)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"Compliance_Report_{inspection_id}.pdf"
    )


@app.post("/api/v1/report/pdf")
async def generate_pdf_report_from_payload(payload: dict):
    """Generate official regulatory PDF report from inspection payload."""
    from reporting.pdf_exporter import generate_inspection_pdf
    inspection_id = payload.get("inspection_id") or payload.get("inspectionId") or "UNKNOWN"
    pdf_path = generate_inspection_pdf(payload)
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

        cache_key = hashlib.sha256(image_bytes).hexdigest()
        cached_legacy = None
        async with _CACHE_LOCK:
            if cache_key in _LEGACY_CACHE:
                cached_legacy = copy.deepcopy(_LEGACY_CACHE[cache_key])
                _LEGACY_CACHE.move_to_end(cache_key)

        if cached_legacy:
            return cached_legacy

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            tmp.write(image_bytes)
            temp_path = Path(tmp.name)

        validate_upload_file(temp_path)
        result = await asyncio.to_thread(pipeline.inspect_images, [temp_path])
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

        legacy_res = {
            "extracted_text": "",
            "declarations": declarations,
            "overall_status": overall_status,
            "violations": violations
        }

        async with _CACHE_LOCK:
            _LEGACY_CACHE[cache_key] = copy.deepcopy(legacy_res)
            if len(_LEGACY_CACHE) > _MAX_CACHE_SIZE:
                _LEGACY_CACHE.popitem(last=False)

        return legacy_res
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

