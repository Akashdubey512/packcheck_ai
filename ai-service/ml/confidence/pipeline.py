"""
Phase 5 Confidence, Evidence & Audit Pipeline Engine
Combines confidence calibration, visual evidence crop generation, cryptographic SHA-256 provenance tracking,
and uncertainty explainability into structured AuditedProductFacts.
"""

import time
from pathlib import Path
from typing import Dict, Any, Union, Optional
from PIL import Image
import numpy as np

from ml.ocr.types import OCRResult
from ml.extraction.types import ProductFacts, CANONICAL_FIELD_NAMES
from ml.confidence.types import (
    AuditedProductFacts, AuditedField, ConfidenceBreakdown,
    EvidenceManifest, InputProvenance, FieldExplanation
)
from ml.confidence.calibrator import ConfidenceCalibrator
from ml.confidence.evidence import EvidenceLinker
from ml.confidence.provenance import ProvenanceTracker
from ml.confidence.explainer import FieldExplainer


class ConfidencePipeline:
    """End-to-end Phase 5 Confidence Calibration, Evidence Linking, and Audit Traceability Pipeline."""

    def __init__(self, crop_output_dir: str = "processed_data/evidence_crops"):
        self.calibrator = ConfidenceCalibrator()
        self.evidence_linker = EvidenceLinker(crop_output_dir=crop_output_dir)
        self.provenance_tracker = ProvenanceTracker()
        self.explainer = FieldExplainer()
        self.version = "1.0.0"

    def process(
        self,
        product_facts: ProductFacts,
        image_input: Optional[Union[str, Path, np.ndarray, Image.Image]] = None,
        ocr_result: Optional[Union[OCRResult, Dict[str, Any]]] = None,
        preprocessing_result: Optional[Dict[str, Any]] = None
    ) -> AuditedProductFacts:
        """
        Process Phase 4 ProductFacts into Phase 5 AuditedProductFacts.
        
        CRITICAL ARCHITECTURAL RULE:
        Phase 5 evaluates confidence, evidence crops, and audit provenance.
        Phase 5 MUST NOT decide legal compliance.
        """
        start_time = time.perf_counter()
        product_id = product_facts.product_id

        # 1. Parse OCR region map & quality metrics
        ocr_region_map = self._build_ocr_region_map(ocr_result)
        quality_metrics = preprocessing_result.get("quality") if preprocessing_result else None
        preproc_version = preprocessing_result.get("preprocessing_version", "1.0.0") if preprocessing_result else "1.0.0"

        ocr_engine_name = "rapidocr"
        ocr_engine_ver = "1.2.3"
        if ocr_result:
            if isinstance(ocr_result, OCRResult):
                ocr_engine_name = ocr_result.engine
                ocr_engine_ver = ocr_result.engine_version
            elif isinstance(ocr_result, dict):
                ocr_engine_name = ocr_result.get("engine", "rapidocr")
                ocr_engine_ver = ocr_result.get("engine_version", "1.2.3")

        audited_fields: Dict[str, AuditedField] = {}
        errors = list(product_facts.errors)

        try:
            # 2. Process each mandatory field through Calibrator & Explainer
            for canonical_name in CANONICAL_FIELD_NAMES:
                field_obj = product_facts.fields.get(canonical_name)
                if not field_obj:
                    continue

                # Compute multi-signal confidence breakdown & status
                confidence_breakdown, uncertainty_status = self.calibrator.compute_confidence(
                    field_obj, ocr_region_map=ocr_region_map, quality_metrics=quality_metrics
                )

                # Generate transparent explanation
                explanation = self.explainer.explain_field(
                    field_obj, confidence_breakdown, uncertainty_status
                )

                # Map normalized value dict cleanly
                norm_dict = field_obj.normalized_value.to_dict() if field_obj.normalized_value else None

                audited_field = AuditedField(
                    field_name=canonical_name,
                    raw_text=field_obj.raw_text,
                    raw_value=field_obj.raw_value,
                    normalized_value=norm_dict,
                    status=uncertainty_status,
                    confidence=confidence_breakdown,
                    evidence_crop_ids=[f"crop_{product_id}_{canonical_name}_{rid}" for rid in field_obj.source_region_ids],
                    source_region_ids=field_obj.source_region_ids,
                    source_bbox=field_obj.source_bbox,
                    explanation=explanation
                )
                audited_fields[canonical_name] = audited_field

            # 3. Evidence Crop Generation & Manifest Linking
            evidence_manifest = self.evidence_linker.generate_evidence_manifest(
                product_facts, image_input=image_input, ocr_region_map=ocr_region_map
            )

            # 4. Cryptographic SHA-256 Provenance Calculation
            provenance = self.provenance_tracker.generate_provenance(
                image_input=image_input,
                dataset_version="1.0.0",
                preprocessing_version=preproc_version,
                ocr_engine=ocr_engine_name,
                ocr_version=ocr_engine_ver,
                extraction_version=product_facts.source.extraction_version if product_facts.source else "1.0.0"
            )

        except Exception as e:
            errors.append({
                "code": "CONFIDENCE_PIPELINE_FAILURE",
                "message": str(e)
            })

        execution_time_ms = (time.perf_counter() - start_time) * 1000.0
        overall_status = "SUCCESS" if not errors else "PARTIAL"

        return AuditedProductFacts(
            product_id=product_id,
            status=overall_status,
            fields=audited_fields,
            evidence_manifest=evidence_manifest,
            provenance=provenance,
            execution_time_ms=execution_time_ms,
            errors=errors
        )

    @staticmethod
    def _build_ocr_region_map(
        ocr_result: Optional[Union[OCRResult, Dict[str, Any]]]
    ) -> Dict[str, Any]:
        """Convert OCRResult or dict regions into string-keyed lookup dictionary."""
        if not ocr_result:
            return {}

        region_map = {}
        if isinstance(ocr_result, OCRResult):
            for r in ocr_result.regions:
                region_map[str(r.region_id)] = r.to_dict()
        elif isinstance(ocr_result, dict):
            for r in ocr_result.get("regions", []):
                r_id = str(r.get("region_id", ""))
                if r_id:
                    region_map[r_id] = r
        return region_map

# Alias for API consistency across pipeline modules
AuditedProductFactsPipeline = ConfidencePipeline
