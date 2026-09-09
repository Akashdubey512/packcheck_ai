"""
Field Candidate Generation Engine
Extracts field candidates from OCR TextRegions using keyword matching, regex patterns, OCR error tolerance,
and spatial reading-order grouping.
"""

import re
from typing import List, Dict, Any, Tuple, Optional, Union
from ml.ocr.types import OCRResult, TextRegion, BoundingBox
from ml.extraction.types import FieldCandidate, CANONICAL_FIELD_NAMES, normalize_field_name

# Keyword & Pattern Definitions for Mandatory Fields (English & Hindi/Devanagari)
FIELD_PATTERNS = {
    "mrp": {
        "keywords": [
            r"m\.?r\.?p\.?", r"maximum retail price", r"retail price", r"incl\.? of all taxes",
            r"inclusive of all taxes", r"एमआरपी", r"अधिकतम खुदरा मूल्य", r"मूल्य"
        ],
        "regexes": [
            r"(?:m\.?r\.?p\.?|max\.?\s*retail\s*price|price)\s*[:\-#]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:[.,]\d{1,2})?)",
            r"(?:₹|rs\.?|inr)\s*(\d+(?:[.,]\d{1,2})?)\s*(?:incl|mrp|inclusive)?",
            r"(\d+(?:[.,]\d{2}))\s*(?:incl\.?\s*of\s*all\s*taxes)"
        ]
    },
    "net_quantity": {
        "keywords": [
            r"net\s*qty\.?", r"net\s*quantity", r"net\s*wt\.?", r"net\s*weight", r"net\s*vol\.?",
            r"net\s*content", r"quantity", r"weight", r"निवल\s*मात्रा", r"शुद्ध\s*मात्रा", r"मात्रा"
        ],
        "regexes": [
            r"(?:net\s*(?:qty|quantity|wt|weight|vol|volume|content)?\s*[:\-]?\s*)(\d+(?:\.\d+)?)\s*(mg|g|gm|gms|kg|kilo|ml|l|ltr|liter|litre|litres|pcs|n|units?)\b",
            r"(\d+(?:\.\d+)?)\s*(mg|g|gm|gms|kg|ml|l|ltr|pcs|n)\b"
        ]
    },
    "manufacturing_packing_date": {
        "keywords": [
            r"mfg\.?", r"mfd\.?", r"mfg\s*date", r"date\s*of\s*mfg", r"date\s*of\s*packing",
            r"pkd\.?", r"packed", r"packing\s*date", r"पैकिंग\s*तिथि", r"उत्पादन\s*तिथि"
        ],
        "regexes": [
            r"(?:mfg|mfd|pkd|packed|date\s*of\s*mfg)\.?\s*(?:date)?\s*[:\-]?\s*(\d{1,2}[\/\.\-7]\d{1,2}[\/\.\-]\d{2,4}|\d{1,2}[\/\.\-]\d{2,4}|[a-zA-Z]{3,9}\s*\d{2,4}|\d{1,2}\s*[a-zA-Z]{3,9}\s*\d{2,4})",
            r"(\d{1,2}[\/\.\-7]\d{1,2}[\/\.\-]\d{2,4}|\d{1,2}[\/\.\-]\d{2,4})"
        ]
    },
    "best_before_expiry": {
        "keywords": [
            r"exp\.?", r"expiry", r"use\s*by", r"best\s*before", r"expiry\s*date", r"exp\.?\s*date",
            r"best\s*use\s*before", r"उपयोग\s*अवधि", r"समाप्ति\s*तिथि"
        ],
        "regexes": [
            r"(?:exp|expiry|use\s*by|best\s*before)\.?\s*(?:date)?\s*[:\-]?\s*(\d{1,2}[\/\.\-7]\d{1,2}[\/\.\-]\d{2,4}|\d{1,2}[\/\.\-]\d{2,4}|\d+\s*months?|\d+\s*years?|[a-zA-Z]{3,9}\s*\d{2,4})",
            r"(?:use\s*within|consume\s*within)\s*(\d+\s*days?(?:\s*of\s*opening)?)",
            r"(\d+\s*months?\s*(?:from|of)?\s*(?:mfg|pkd|packing|manufacture)?)"
        ]
    },
    "country_of_origin": {
        "keywords": [
            r"country\s*of\s*origin", r"made\s*in", r"manufactured\s*in", r"origin", r"product\s*of",
            r"मूल\s*देश", r"निर्मित"
        ],
        "regexes": [
            r"(?:country\s*of\s*origin|made\s*in|product\s*of|origin)\s*[:\-]?\s*([a-zA-Z\s]{2,30})",
            r"(made\s*in\s*[a-zA-Z]+|product\s*of\s*(?:inchedible\s*)?[a-zA-Z]+)"
        ]
    },
    "consumer_care_details": {
        "keywords": [
            r"customer\s*care", r"consumer\s*care", r"toll\s*free", r"helpline", r"contact\s*us",
            r"feedback", r"queries", r"complaints", r"email", r"care@", r"ग्राहक\s*सेवा"
        ],
        "regexes": [
            r"(?:customer|consumer)\s*care\s*[:\-]?\s*([^\n\r]+)",
            r"(?:feedback|complaints|call\s*us\s*at|reach\s*out)\s*[:\-]?\s*([^\n\r]+)",
            r"(?:1800[\-\s]?\d{3}[\-\s]?\d{4}|\+?91[\-\s]?\d{10}|\b\d{5}\s*\d{5}\b)",
            r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        ]
    },
    "manufacturer_name_and_address": {
        "keywords": [
            r"mfd\.?\s*by", r"manufactured\s*by", r"packed\s*by", r"marketed\s*by", r"imported\s*by",
            r"manufacturer", r"packer", r"importer", r"निर्माता", r"पैकर"
        ],
        "regexes": [
            r"(?:mfd\.?\s*by|manufactured\s*by|packed\s*by|marketed\s*by|imported\s*by)\s*[:\-]?\s*([^\n\r]+)"
        ]
    },
    "common_generic_name": {
        "keywords": [
            r"generic\s*name", r"common\s*name", r"commodity", r"product\s*name", r"item",
            r"proprietary\s*food", r"cereal", r"breakfast\s*cereal",
            r"सामान्य\s*नाम"
        ],
        "regexes": [
            r"(?:generic\s*name|common\s*name|commodity)\s*[:\-]?\s*([^\n\r]+)",
            r"proprietary\s*food(?:\s*category)?(?:\s*[\d.]+)?\s*([a-zA-Z\s]{3,30})",
            r"\b(breakfast\s*cereal|rolled\s*oats|peanut\s*butter|muesli|corn\s*flakes|namkeen|biscuit)\b"
        ]
    },
    "unit_sale_price": {
        "keywords": [
            r"unit\s*sale\s*price", r"unit\s*price", r"usp", r"price\s*per", r" per\s*(?:g|kg|ml|l|unit)\b",
            r"इकाई\s*बिक्री\s*मूल्य"
        ],
        "regexes": [
            r"(?:unit\s*sale\s*price|unit\s*price|usp)\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:/|per)\s*(\d+(?:\.\d+)?)?\s*([a-zA-Z]+)",
            r"(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)?\s*([a-zA-Z]+)"
        ]
    }
}


class CandidateGenerator:
    """Generates candidate extractions for Legal Metrology fields from OCR text regions."""

    def __init__(self):
        self.compiled_keywords = {
            field: [re.compile(kw, re.IGNORECASE) for kw in config["keywords"]]
            for field, config in FIELD_PATTERNS.items()
        }
        self.compiled_regexes = {
            field: [re.compile(rgx, re.IGNORECASE) for rgx in config["regexes"]]
            for field, config in FIELD_PATTERNS.items()
        }

    def generate_candidates(self, ocr_result: Union[OCRResult, Dict[str, Any]]) -> Dict[str, List[FieldCandidate]]:
        """
        Main entry point for candidate generation across all 9 canonical fields.
        Returns a dictionary mapping field_name -> List[FieldCandidate].
        """
        # Standardize regions
        if isinstance(ocr_result, dict):
            regions = ocr_result.get("regions", [])
        else:
            regions = [r.to_dict() if hasattr(r, "to_dict") else r for r in ocr_result.regions]

        candidates_by_field: Dict[str, List[FieldCandidate]] = {
            f: [] for f in CANONICAL_FIELD_NAMES
        }

        # 1. Single Region Intra-Text Extraction
        for r_idx, region in enumerate(regions):
            region_id = str(region.get("region_id", r_idx))
            text = region.get("text", "") or region.get("normalized_text", "")
            bbox = region.get("bbox", None)

            if not text.strip():
                continue

            for field_name in CANONICAL_FIELD_NAMES:
                has_field_kw = any(kw.search(text) for kw in self.compiled_keywords[field_name])

                # Regex match
                for rgx in self.compiled_regexes[field_name]:
                    for match in rgx.finditer(text):
                        raw_val = match.group(1) if match.lastindex else match.group(0)
                        raw_val_clean = raw_val.strip()
                        if not raw_val_clean:
                            continue

                        cand_id = f"cand_{field_name}_{region_id}_{len(candidates_by_field[field_name])}"
                        # If region has both the explicit keyword and the matching regex value, it's highest confidence
                        score = 0.96 if has_field_kw else 0.88

                        candidate = FieldCandidate(
                            candidate_id=cand_id,
                            field_name=field_name,
                            raw_text=text,
                            raw_value=raw_val_clean,
                            source_region_ids=[region_id],
                            source_bbox=bbox,
                            score=score,
                            evidence_types=["regex_match"] if not has_field_kw else ["intra_region_keyword_regex"]
                        )
                        candidates_by_field[field_name].append(candidate)

                # Standalone keyword match within region (lower confidence)
                if has_field_kw and not any(c.candidate_id.startswith(f"cand_{field_name}_{region_id}") for c in candidates_by_field[field_name]):
                    cand_id = f"cand_kw_{field_name}_{region_id}_{len(candidates_by_field[field_name])}"
                    candidate = FieldCandidate(
                        candidate_id=cand_id,
                        field_name=field_name,
                        raw_text=text,
                        raw_value=text,
                        source_region_ids=[region_id],
                        source_bbox=bbox,
                        score=0.50,
                        evidence_types=["keyword_match"]
                    )
                    candidates_by_field[field_name].append(candidate)

        # 2. Spatial Adjacent Region Pairing (Label region paired with validated Value region)
        paired_candidates = self._generate_paired_candidates(regions)
        for field_name, paired_cands in paired_candidates.items():
            candidates_by_field[field_name].extend(paired_cands)

        # De-duplicate candidates per field by raw_value + region_ids
        for field_name in CANONICAL_FIELD_NAMES:
            candidates_by_field[field_name] = self._deduplicate_candidates(candidates_by_field[field_name])

        return candidates_by_field

    def _generate_paired_candidates(self, regions: List[Dict[str, Any]]) -> Dict[str, List[FieldCandidate]]:
        """Pair label regions with visually adjacent value regions (horizontally or vertically)."""
        paired: Dict[str, List[FieldCandidate]] = {f: [] for f in CANONICAL_FIELD_NAMES}
        if len(regions) < 2:
            return paired

        for i, r1 in enumerate(regions):
            t1 = r1.get("text", "").strip()
            bbox1 = r1.get("bbox")
            r1_id = str(r1.get("region_id", i))

            if not t1:
                continue

            for field_name in CANONICAL_FIELD_NAMES:
                has_kw = any(kw.search(t1) for kw in self.compiled_keywords[field_name])
                if not has_kw:
                    continue

                # Search adjacent region r2
                for j, r2 in enumerate(regions):
                    if i == j:
                        continue
                    t2 = r2.get("text", "").strip()
                    bbox2 = r2.get("bbox")
                    r2_id = str(r2.get("region_id", j))

                    if not t2:
                        continue

                    # Validate that t2 actually looks like a valid value for field_name
                    val_candidate = self._validate_and_extract_value(field_name, t2)
                    if not val_candidate:
                        continue

                    # Check spatial proximity if bboxes are available
                    is_adjacent = self._are_regions_adjacent(bbox1, bbox2)
                    if is_adjacent:
                        combined_text = f"{t1} {t2}"
                        cand_id = f"cand_pair_{field_name}_{r1_id}_{r2_id}"

                        # Merge bboxes
                        merged_bbox = None
                        if bbox1 and bbox2:
                            merged_bbox = [
                                min(bbox1[0], bbox2[0]),
                                min(bbox1[1], bbox2[1]),
                                max(bbox1[2], bbox2[2]),
                                max(bbox1[3], bbox2[3])
                            ]

                        candidate = FieldCandidate(
                            candidate_id=cand_id,
                            field_name=field_name,
                            raw_text=combined_text,
                            raw_value=val_candidate,
                            source_region_ids=[r1_id, r2_id],
                            source_bbox=merged_bbox,
                            score=0.92,
                            evidence_types=["spatial_keyword_pair"]
                        )
                        paired[field_name].append(candidate)

        return paired

    def _validate_and_extract_value(self, field_name: str, text: str) -> Optional[str]:
        """Validate if adjacent text actually satisfies field pattern expectations."""
        clean_text = text.strip()
        if not clean_text:
            return None

        # Try matching any compiled regex for the field
        for rgx in self.compiled_regexes[field_name]:
            m = rgx.search(clean_text)
            if m:
                return (m.group(1) if m.lastindex else m.group(0)).strip()

        # Specific heuristics for structured text fields
        if field_name == "manufacturer_name_and_address":
            # Must not be a pure number, pure date, or statutory label
            if len(clean_text) >= 4 and not re.match(r"^[\d\s\W]+$", clean_text):
                if not re.search(r"^(?:mrp|batch|mfg|use by|exp|net weight)", clean_text, re.IGNORECASE):
                    return clean_text
        elif field_name == "country_of_origin":
            if re.search(r"\b(india|bharat|china|usa|uk|germany|japan)\b", clean_text, re.IGNORECASE):
                return clean_text
        elif field_name == "consumer_care_details":
            if re.search(r"(@|\d{5,}|\.com|\.in|feedback|support)", clean_text, re.IGNORECASE):
                return clean_text

        return None

    @staticmethod
    def _are_regions_adjacent(bbox1: Optional[List[int]], bbox2: Optional[List[int]]) -> bool:
        """Check if two bounding boxes are near each other (horizontal or vertical line)."""
        if not bbox1 or not bbox2:
            return True  # Fallback to reading order proximity if bboxes missing

        x1_1, y1_1, x2_1, y2_1 = bbox1
        x1_2, y1_2, x2_2, y2_2 = bbox2

        # Vertical overlap (same horizontal line)
        vertical_overlap = max(0, min(y2_1, y2_2) - max(y1_1, y1_2))
        h1 = max(1, y2_1 - y1_1)
        
        # Horizontally adjacent (within 200 pixels)
        horizontal_dist = abs(x1_2 - x2_1)

        if vertical_overlap / h1 > 0.4 and horizontal_dist < 250:
            return True

        # Vertically adjacent (immediately below, within 80 pixels)
        vertical_dist = abs(y1_2 - y2_1)
        horizontal_overlap = max(0, min(x2_1, x2_2) - max(x1_1, x1_2))
        w1 = max(1, x2_1 - x1_1)

        if horizontal_overlap / w1 > 0.3 and vertical_dist < 100:
            return True

        return False

    @staticmethod
    def _deduplicate_candidates(candidates: List[FieldCandidate]) -> List[FieldCandidate]:
        """Deduplicate candidates while preserving highest scores."""
        seen = set()
        unique = []
        # Sort by score descending first
        sorted_cands = sorted(candidates, key=lambda c: c.score, reverse=True)
        for c in sorted_cands:
            key = (c.field_name, c.raw_value.lower(), tuple(c.source_region_ids))
            if key not in seen:
                seen.add(key)
                unique.append(c)
        return unique
