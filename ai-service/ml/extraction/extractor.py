"""
Field Value Extractor
Specialized field extractions for the 9 mandatory Legal Metrology packaged commodity fields.
"""

from typing import Dict, Any, List, Optional
from ml.extraction.types import (
    ExtractedField, FieldCandidate, FieldStatus, NormalizationStatus,
    CANONICAL_FIELD_NAMES, normalize_field_name
)
from ml.extraction.normalizer import ValueNormalizer
from ml.extraction.classifier import FieldClassifier


class FieldExtractor:
    """Specialized extraction logic for mandatory Legal Metrology fields."""

    def __init__(self):
        self.normalizer = ValueNormalizer()
        self.classifier = FieldClassifier()

    def extract_field(
        self, field_name: str, candidates: List[FieldCandidate]
    ) -> ExtractedField:
        """
        Extract a single mandatory field given its generated candidates.
        Performs candidate classification, value extraction, and normalization.
        """
        canonical_name = normalize_field_name(field_name)

        # Classify and rank candidates
        primary_cand, confidence, status, ranked_cands = self.classifier.classify_candidates(
            canonical_name, candidates
        )

        if not ranked_cands or status == FieldStatus.NOT_FOUND.value:
            return ExtractedField(
                field_name=canonical_name,
                raw_text="",
                raw_value="",
                normalized_value=None,
                source_region_ids=[],
                source_text="",
                source_bbox=None,
                extraction_confidence=0.0,
                status=FieldStatus.NOT_FOUND.value,
                candidates=[]
            )

        # Specialized value extraction & normalization based on canonical field
        raw_text = primary_cand.raw_text
        raw_value = primary_cand.raw_value
        norm_value = None

        if canonical_name == "mrp":
            norm_value = self.normalizer.normalize_mrp(raw_text)

        elif canonical_name == "net_quantity":
            norm_value = self.normalizer.normalize_net_quantity(raw_text)

        elif canonical_name in ["manufacturing_packing_date", "best_before_expiry"]:
            norm_value = self.normalizer.normalize_date(raw_text)
            if norm_value and norm_value.normalization_status == NormalizationStatus.AMBIGUOUS.value:
                status = FieldStatus.AMBIGUOUS.value

        elif canonical_name == "country_of_origin":
            norm_value = self.normalizer.normalize_country(raw_text)

        elif canonical_name == "consumer_care_details":
            norm_value = self.normalizer.normalize_consumer_care(raw_text)

        elif canonical_name == "unit_sale_price":
            norm_value = self.normalizer.normalize_unit_sale_price(raw_text)

        elif canonical_name in ["manufacturer_name_and_address", "common_generic_name"]:
            # String fields preserve clean raw text
            clean_text = raw_value or raw_text
            norm_value = self.normalizer.normalize_country(clean_text)  # Generic clean wrapper
            norm_value.normalized_value = {"text": clean_text.strip()}
            norm_value.normalization_status = NormalizationStatus.SUCCESS.value

        return ExtractedField(
            field_name=canonical_name,
            raw_text=raw_text,
            raw_value=raw_value,
            normalized_value=norm_value,
            source_region_ids=primary_cand.source_region_ids,
            source_text=raw_text,
            source_bbox=primary_cand.source_bbox,
            extraction_confidence=confidence,
            status=status,
            candidates=ranked_cands
        )
