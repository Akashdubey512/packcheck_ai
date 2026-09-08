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

        return {
            "view_id": f"view_{idx}",
            "image_id": f"{inspection_id}_view_{idx}",
            "view_type": view_type,
            "quality_status": prep_res["quality"]["status"] if prep_res["quality"] else "UNKNOWN",
            "extracted_fields": audited_facts.to_dict()["fields"],
            "evidence_crops": audited_facts.evidence_manifest.to_dict()["crops"]
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

        return MultiViewInspectionResult(
            inspection_id=inspection_id,
            overall_status=overall_status,
            coverage=coverage_info,
            unified_facts={k: v.to_dict() for k, v in unified_facts.items()},
            contradictions=contradictions,
            compliance_result=comp_dict,
            views_analyzed=len(view_results),
            execution_time_ms=exec_time
        )

    def _synthesize_audited_facts(self, inspection_id: str, view_results: List[Dict], unified_facts: Dict) -> Any:
        """Create a combined AuditedProductFacts structure for compliance rule evaluation."""
        ext_facts = ProductFacts(product_id=inspection_id)
        base_audited = self.conf_pipe.process(ext_facts, image_input=None, ocr_result=None)

        # Populate extracted values from unified facts
        for f_name, c_fact in unified_facts.items():
            if f_name in base_audited.fields:
                val = c_fact.consensus_value
                base_audited.fields[f_name].raw_value = str(val) if val is not None else ""
                base_audited.fields[f_name].raw_text = str(val) if val is not None else ""
                if val:
                    base_audited.fields[f_name].status = "CONFIDENT"

        return base_audited

