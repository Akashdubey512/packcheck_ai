"""
Phase 4 Extraction Pipeline Engine
Combines candidate generation, candidate classification, specialized field extraction,
value normalization, and evidence linking into structured ProductFacts.
"""

import time
from typing import Dict, Any, Union, Optional
from ml.ocr.types import OCRResult
from ml.extraction.types import (
    ProductFacts, ExtractedField, ExtractionSourceMetadata,
    CANONICAL_FIELD_NAMES, normalize_field_name, FieldStatus
)
from ml.extraction.candidates import CandidateGenerator
from ml.extraction.extractor import FieldExtractor


class ExtractionPipeline:
    """End-to-end extraction pipeline taking Phase 3 OCR output to Phase 4 ProductFacts."""

    def __init__(self):
        self.candidate_generator = CandidateGenerator()
        self.extractor = FieldExtractor()
        self.version = "1.0.0"

    def process(
        self,
        ocr_input: Union[OCRResult, Dict[str, Any]],
        product_id: Optional[str] = None
    ) -> ProductFacts:
        """
        Process OCR result into structured ProductFacts.
        
        CRITICAL ARCHITECTURAL RULE:
        Phase 4 extracts facts. Phase 4 MUST NOT make legal compliance decisions.
        """
        start_time = time.perf_counter()

        # Parse OCR payload details
        if isinstance(ocr_input, OCRResult):
            ocr_dict = ocr_input.to_dict()
            sample_id = product_id or ocr_input.image_id
            engine = ocr_input.engine
            engine_ver = ocr_input.engine_version
            preproc_ver = ocr_input.preprocessing_version
        elif isinstance(ocr_input, dict):
            ocr_dict = ocr_input
            sample_id = product_id or ocr_input.get("image_id", "sample_unknown")
            engine = ocr_input.get("engine", "rapidocr")
            engine_ver = ocr_input.get("engine_version", "1.2.3")
            preproc_ver = ocr_input.get("preprocessing_version", "1.0.0")
        else:
            raise ValueError(f"Invalid ocr_input type: {type(ocr_input)}")

        errors = []
        extracted_fields: Dict[str, ExtractedField] = {}

        try:
            # 1. Candidate Generation
            candidates_by_field = self.candidate_generator.generate_candidates(ocr_dict)

            # 2. Field Extraction & Normalization for all 9 canonical fields
            for canonical_field in CANONICAL_FIELD_NAMES:
                cands = candidates_by_field.get(canonical_field, [])
                extracted_field = self.extractor.extract_field(canonical_field, cands)
                extracted_fields[canonical_field] = extracted_field

        except Exception as e:
            errors.append({
                "code": "EXTRACTION_FAILURE",
                "message": str(e)
            })

        execution_time_ms = (time.perf_counter() - start_time) * 1000.0

        # Build source metadata
        source_meta = ExtractionSourceMetadata(
            ocr_engine=engine,
            ocr_version=engine_ver,
            preprocessing_version=preproc_ver,
            extraction_version=self.version
        )

        overall_status = "SUCCESS" if not errors else "PARTIAL"

        return ProductFacts(
            product_id=sample_id,
            status=overall_status,
            fields=extracted_fields,
            source=source_meta,
            execution_time_ms=execution_time_ms,
            errors=errors
        )
