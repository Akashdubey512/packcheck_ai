"""
End-to-End Multi-View Inspection Pipeline
Orchestrates multi-view package image processing, OCR, candidate fusion, cross-view contradiction checks,
and evaluates Legal Metrology compliance.
"""

import time
import uuid
from typing import List, Dict, Any, Union, Optional
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

from ml.preprocessing.pipeline import PreprocessingPipeline
from ml.ocr.pipeline import OCRPipeline
from ml.extraction.pipeline import ExtractionPipeline
from ml.extraction.types import ProductFacts
from ml.confidence.pipeline import AuditedProductFactsPipeline
from ml.compliance.pipeline import CompliancePipeline

from .view_classifier import classify_package_view
from .cross_view_fusion import fuse_cross_view_candidates
from .types import MultiViewInspectionResult, ContradictionItem, CoverageStatus

class MultiViewInspectionPipeline:
    """Orchestrates end-to-end multi-view packaging inspections."""

    def __init__(self):
        self.prep_pipe = PreprocessingPipeline()
        self.ocr_pipe = OCRPipeline()
        self.ext_pipe = ExtractionPipeline()
        self.conf_pipe = AuditedProductFactsPipeline()
        self.comp_pipe = CompliancePipeline()

    def _process_single_view(self, item: tuple) -> Optional[Dict[str, Any]]:
        idx, img_input, inspection_id = item
        # 1. Preprocessing
        prep_res = self.prep_pipe.process(img_input)
        if not prep_res["validation"]["valid"]:
            return None

        # 2. OCR
        primary_img = prep_res["variants"]["ocr_primary"]
        ocr_res = self.ocr_pipe.process(primary_img, image_id=f"{inspection_id}_view_{idx}")

        # 3. Field Extraction
        ext_facts = self.ext_pipe.process(ocr_res)

        # 4. Confidence & Evidence Crops
        audited_facts = self.conf_pipe.process(
            ext_facts,
            image_input=primary_img,
            ocr_result=ocr_res,
            preprocessing_result=prep_res
        )

        full_text = ocr_res.full_raw_text if hasattr(ocr_res, "full_raw_text") else ocr_res.get("full_raw_text", "")
        view_type = classify_package_view(full_text)

        raw_regions = ocr_res.get("regions", []) if isinstance(ocr_res, dict) else getattr(ocr_res, "regions", [])
        ocr_region_dicts = []
        for idx_r, r in enumerate(raw_regions):
            r_dict = r.to_dict() if hasattr(r, "to_dict") else dict(r)
            bx = r_dict.get("bbox")
            if bx:
                if hasattr(bx, "x1"):
                    bx_dict = {"x": bx.x1, "y": bx.y1, "width": max(1, bx.x2 - bx.x1), "height": max(1, bx.y2 - bx.y1)}
                elif isinstance(bx, (list, tuple)) and len(bx) >= 4:
                    bx_dict = {"x": bx[0], "y": bx[1], "width": max(1, bx[2] - bx[0]), "height": max(1, bx[3] - bx[1])}
                elif isinstance(bx, dict):
                    bx_dict = {
                        "x": bx.get("x1", bx.get("x", 0)),
                        "y": bx.get("y1", bx.get("y", 0)),
                        "width": max(1, bx.get("width", bx.get("x2", 0) - bx.get("x1", 0))),
                        "height": max(1, bx.get("height", bx.get("y2", 0) - bx.get("y1", 0)))
                    }
                else:
                    bx_dict = {"x": 0, "y": 0, "width": 10, "height": 10}
                r_dict["boundingBox"] = bx_dict
            r_dict["id"] = f"reg_v{idx}_{r_dict.get('region_id', idx_r)}"
            r_dict["detectedText"] = r_dict.get("text", "")
            r_dict["confidence"] = r_dict.get("confidence", 0.9) or 0.9
            ocr_region_dicts.append(r_dict)

        return {
            "view_id": f"view_{idx}",
            "image_id": f"{inspection_id}_view_{idx}",
            "view_type": view_type,
            "quality_status": prep_res["quality"]["status"] if prep_res["quality"] else "UNKNOWN",
            "extracted_fields": audited_facts.to_dict()["fields"],
            "evidence_crops": audited_facts.evidence_manifest.to_dict()["crops"],
            "ocr_regions": ocr_region_dicts,
            "full_raw_text": full_text
        }

    def inspect_images(
        self,
        images: List[Union[str, Path, Image.Image]],
        inspection_id: Optional[str] = None
    ) -> MultiViewInspectionResult:
        """Process multiple package face images through multi-view inspection pipeline."""
        start_time = time.perf_counter()
        if not inspection_id:
            inspection_id = f"INSP_{uuid.uuid4().hex[:8].upper()}"

        items = [(idx, img_input, inspection_id) for idx, img_input in enumerate(images)]

        if len(images) > 1:
            max_workers = min(len(images), 4)
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                results = list(executor.map(self._process_single_view, items))
            view_results = [r for r in results if r is not None]
        else:
            view_results = [r for r in (self._process_single_view(item) for item in items) if r is not None]

        # 6. Fuse cross-view candidates and check for contradictions
        unified_facts, contradictions, coverage_info = fuse_cross_view_candidates(view_results)
        coverage_status = coverage_info["coverage_status"]

        # 7. Evaluate Legal Compliance Rule Engine
        sample_audited_facts = self._synthesize_audited_facts(inspection_id, view_results, unified_facts)
        comp_res = self.comp_pipe.evaluate(sample_audited_facts)
        comp_dict = comp_res.to_dict()

        # Handle contradiction impact: forces REVIEW_REQUIRED if contradictions exist
        overall_status = comp_dict.get("overall_status", "REVIEW_REQUIRED")
        if contradictions:
            overall_status = "REVIEW_REQUIRED"
            comp_dict["overall_status"] = "REVIEW_REQUIRED"

        # Handle incomplete coverage impact: missing fields on partial view lead to INSUFFICIENT_EVIDENCE
        if coverage_status in (CoverageStatus.PARTIAL_COVERAGE.value, CoverageStatus.INSUFFICIENT_COVERAGE.value) and overall_status == "NON_COMPLIANT":
            if any(item.get("status") in ("MISSING", "MISSING_DECLARATION") for item in comp_dict.get("violations", [])):
                overall_status = "INSUFFICIENT_EVIDENCE"
                comp_dict["overall_status"] = "INSUFFICIENT_EVIDENCE"

        exec_time = round((time.perf_counter() - start_time) * 1000, 2)

        coverage_info["views_analyzed"] = len(view_results)
        coverage_info["inspected_views"] = [v["view_type"] for v in view_results]

        all_raw_texts = [v.get("full_raw_text", "") for v in view_results if v.get("full_raw_text")]
        all_regions = []
        for v in view_results:
            all_regions.extend(v.get("ocr_regions", []))

        ocr_payload = {
            "full_raw_text": "\n\n".join(all_raw_texts) if all_raw_texts else "",
            "regions": all_regions
        }

        return MultiViewInspectionResult(
            inspection_id=inspection_id,
            overall_status=overall_status,
            coverage=coverage_info,
            unified_facts={k: v.to_dict() for k, v in unified_facts.items()},
            contradictions=contradictions,
            compliance_result=comp_dict,
            views_analyzed=len(view_results),
            execution_time_ms=exec_time,
            ocr=ocr_payload
        )

    def _synthesize_audited_facts(self, inspection_id: str, view_results: List[Dict], unified_facts: Dict) -> Any:
        """Create a combined AuditedProductFacts structure for compliance rule evaluation."""
        from ml.compliance.types import FIELD_ALIAS_MAP
        from ml.confidence.types import AuditedProductFacts, AuditedField, ConfidenceBreakdown, EvidenceManifest, InputProvenance

        audited_fields: Dict[str, AuditedField] = {}
        for f_name, c_fact in unified_facts.items():
            val = c_fact.consensus_value
            conf = getattr(c_fact, "confidence", 0.85) or 0.85
            if val is not None and str(val).strip():
                # Primary canonical key
                audited_fields[f_name] = AuditedField(
                    field_name=f_name,
                    raw_text=str(val),
                    raw_value=str(val),
                    status="CONFIDENT",
                    confidence=ConfidenceBreakdown(candidate_score=conf, raw_composite_score=conf, calibrated_probability=conf),
                    source_region_ids=[],
                    source_bbox=None
                )
                # Mapped compliance alias
                comp_alias = FIELD_ALIAS_MAP.get(f_name)
                if comp_alias and comp_alias != f_name:
                    audited_fields[comp_alias] = AuditedField(
                        field_name=comp_alias,
                        raw_text=str(val),
                        raw_value=str(val),
                        status="CONFIDENT",
                        confidence=ConfidenceBreakdown(candidate_score=conf, raw_composite_score=conf, calibrated_probability=conf),
                        source_region_ids=[],
                        source_bbox=None
                    )

        return AuditedProductFacts(
            product_id=inspection_id,
            status="SUCCESS",
            fields=audited_fields,
            evidence_manifest=EvidenceManifest(manifest_id=f"manifest_{inspection_id}", product_id=inspection_id),
            provenance=InputProvenance(input_sha256="UNAVAILABLE")
        )

